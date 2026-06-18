-- ============================================================
-- Replyee — Phase 2: Visitor Tracking, Proactive Triggers & Canned Replies
-- Run in Supabase Studio: https://studio.boommedia.us
-- ============================================================

-- ── Visitor Sessions (heartbeat tracking) ──────────────────
create table if not exists replyee_visitor_sessions (
  id          uuid primary key default gen_random_uuid(),
  chatbot_id  uuid not null references replyee_chatbots(id) on delete cascade,
  visitor_id  uuid not null,          -- random uuid in widget localStorage
  session_id  uuid,                   -- links to replyee_conversations if chatted
  current_page text,
  referrer    text,
  utm         jsonb,
  device      text,
  page_views  int not null default 1,
  visits      int not null default 1,
  score       int not null default 0,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);

create index if not exists replyee_visitor_sessions_chatbot_idx
  on replyee_visitor_sessions(chatbot_id, last_seen desc);

-- ── Canned Replies ────────────────────────────────────────
create table if not exists replyee_canned_replies (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references replyee_profiles(id) on delete cascade,
  shortcut  text not null,   -- e.g. '/hours'
  body      text not null,
  created_at timestamptz not null default now()
);

create index if not exists replyee_canned_replies_user_idx
  on replyee_canned_replies(user_id);

-- ── Chatbots: Add triggers config ─────────────────────────
alter table replyee_chatbots
  add column if not exists triggers jsonb not null default '[]';

-- ── Row Level Security ────────────────────────────────────
alter table replyee_visitor_sessions enable row level security;
alter table replyee_canned_replies enable row level security;

drop policy if exists "replyee_visitor_sessions_own" on replyee_visitor_sessions;
create policy "replyee_visitor_sessions_own" on replyee_visitor_sessions
  for all using (chatbot_id in (select id from replyee_chatbots where user_id = auth.uid()));

drop policy if exists "replyee_canned_replies_own" on replyee_canned_replies;
create policy "replyee_canned_replies_own" on replyee_canned_replies
  for all using (auth.uid() = user_id);

-- ── Realtime Publication ──────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table replyee_visitor_sessions;
exception when duplicate_object then null; end $$;
