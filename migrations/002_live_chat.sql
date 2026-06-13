-- ============================================================
-- Replyee — Live Chat & Human Takeover (SalesIQ upgrade Phase 1)
-- Run in Supabase Studio: https://studio.boommedia.us
-- See .md/SALESIQ_UPGRADE_PLAN.md
-- ============================================================

-- ── Conversations: mode + agent assignment ────────────────────
alter table replyee_conversations
  add column if not exists mode            text not null default 'bot',
  add column if not exists assigned_to     uuid references replyee_profiles(id),
  add column if not exists last_message_at timestamptz,
  add column if not exists unread_by_agent int not null default 0;

alter table replyee_conversations drop constraint if exists replyee_conversations_mode_check;
alter table replyee_conversations
  add constraint replyee_conversations_mode_check check (mode in ('bot', 'human', 'closed'));

create index if not exists replyee_conversations_mode_idx
  on replyee_conversations(chatbot_id, mode, last_message_at desc);

-- ── Messages: allow human agent replies ───────────────────────
alter table replyee_messages drop constraint if exists replyee_messages_role_check;
alter table replyee_messages
  add constraint replyee_messages_role_check check (role in ('user', 'assistant', 'agent'));

-- ── Realtime for the authenticated agent inbox ────────────────
-- postgres_changes respects RLS: owners only receive rows for their own bots.
-- The visitor widget does NOT use postgres_changes (no anon read policy needed) —
-- it uses Realtime *broadcast* channels keyed by session UUID instead.
do $$ begin
  alter publication supabase_realtime add table replyee_messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table replyee_conversations;
exception when duplicate_object then null; end $$;
