-- ============================================================
-- Replyee — Voice channel (provider-agnostic)
-- Run in Supabase Studio: https://studio.boommedia.us
--
-- Voice reuses the EXISTING inbox: a phone call becomes a normal
-- replyee_conversations row with channel = 'voice', and its transcript
-- becomes normal replyee_messages rows. Nothing about chat changes —
-- existing rows default to channel = 'chat'.
--
-- No vendor name appears in this schema. The provider is a text column so
-- Retell can be swapped for Vapi/Bland/self-hosted without a migration.
-- Safe to re-run.
-- ============================================================

-- ── Conversations: channel discriminator ──────────────────────
alter table replyee_conversations
  add column if not exists channel text not null default 'chat';

alter table replyee_conversations drop constraint if exists replyee_conversations_channel_check;
alter table replyee_conversations
  add constraint replyee_conversations_channel_check check (channel in ('chat', 'voice'));

create index if not exists replyee_conversations_channel_idx
  on replyee_conversations(chatbot_id, channel, last_message_at desc);

-- ── Voice Agents ──────────────────────────────────────────────
-- Links a Replyee bot to the agent object living at a voice provider.
-- provider_engine_id covers providers that split "agent" from "response
-- engine" (prompt/LLM); null for providers that don't.
create table if not exists replyee_voice_agents (
  id                  uuid primary key default gen_random_uuid(),
  chatbot_id          uuid not null references replyee_chatbots(id) on delete cascade,
  provider            text not null default 'retell',
  provider_agent_id   text not null,
  provider_engine_id  text,
  phone_number        text,                    -- E.164, null until assigned
  voice_id            text,
  language            text not null default 'en-US',
  is_active           boolean not null default true,
  last_synced_at      timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- One provider agent id is unique within a provider; that pair is how the
-- webhook resolves an inbound call back to a Replyee bot.
create unique index if not exists replyee_voice_agents_provider_agent_idx
  on replyee_voice_agents(provider, provider_agent_id);

create index if not exists replyee_voice_agents_chatbot_idx
  on replyee_voice_agents(chatbot_id);

create unique index if not exists replyee_voice_agents_phone_idx
  on replyee_voice_agents(phone_number) where phone_number is not null;

-- ── Voice Calls ───────────────────────────────────────────────
-- One row per call: the metering record. Voice is the only Boom product with
-- real per-minute COGS (~$0.07–0.10/min), so duration_seconds is captured from
-- call #1 — usage billing can be layered on later with no retrofit.
--
-- user_id is denormalised from the bot on purpose: per-tenant usage rollups
-- must not need a join through chatbots on every billing run.
create table if not exists replyee_voice_calls (
  id                uuid primary key default gen_random_uuid(),
  chatbot_id        uuid not null references replyee_chatbots(id) on delete cascade,
  user_id           uuid not null references replyee_profiles(id) on delete cascade,
  session_id        uuid not null,             -- joins to replyee_conversations.session_id
  provider          text not null default 'retell',
  provider_call_id  text not null,             -- idempotency key for webhooks
  direction         text not null default 'unknown',
  from_number       text,
  to_number         text,
  started_at        timestamptz,
  ended_at          timestamptz,
  duration_seconds  int,                       -- THE billable number
  recording_url     text,
  end_reason        text,
  provider_cost_cents int,                     -- what the provider charged us
  status            text not null default 'started',
  raw_payload       jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table replyee_voice_calls drop constraint if exists replyee_voice_calls_direction_check;
alter table replyee_voice_calls
  add constraint replyee_voice_calls_direction_check
  check (direction in ('inbound', 'outbound', 'unknown'));

alter table replyee_voice_calls drop constraint if exists replyee_voice_calls_status_check;
alter table replyee_voice_calls
  add constraint replyee_voice_calls_status_check
  check (status in ('started', 'ended', 'analyzed', 'error'));

create unique index if not exists replyee_voice_calls_provider_call_idx
  on replyee_voice_calls(provider, provider_call_id);

create index if not exists replyee_voice_calls_session_idx
  on replyee_voice_calls(session_id);

-- The metering index: "minutes used by tenant X in period Y".
create index if not exists replyee_voice_calls_usage_idx
  on replyee_voice_calls(user_id, started_at desc);

create index if not exists replyee_voice_calls_chatbot_idx
  on replyee_voice_calls(chatbot_id, started_at desc);

-- ── Usage rollup ──────────────────────────────────────────────
-- Per-tenant, per-bot, per-month minutes. Read this for billing/dashboards;
-- do not re-derive the maths in application code.
create or replace view replyee_voice_usage_monthly as
  select
    user_id,
    chatbot_id,
    date_trunc('month', coalesce(started_at, created_at)) as period,
    count(*)                                              as call_count,
    coalesce(sum(duration_seconds), 0)                    as total_seconds,
    ceil(coalesce(sum(duration_seconds), 0) / 60.0)::int  as billable_minutes,
    coalesce(sum(provider_cost_cents), 0)                 as provider_cost_cents
  from replyee_voice_calls
  where status in ('ended', 'analyzed')
  group by user_id, chatbot_id, date_trunc('month', coalesce(started_at, created_at));

-- ── Row Level Security ────────────────────────────────────────
alter table replyee_voice_agents enable row level security;
alter table replyee_voice_calls  enable row level security;

drop policy if exists "replyee_voice_agents_own" on replyee_voice_agents;
create policy "replyee_voice_agents_own" on replyee_voice_agents
  for all using (chatbot_id in (select id from replyee_chatbots where user_id = auth.uid()));

drop policy if exists "replyee_voice_calls_own" on replyee_voice_calls;
create policy "replyee_voice_calls_own" on replyee_voice_calls
  for all using (auth.uid() = user_id);

-- Boom Media operator visibility, consistent with 003_boom_admin.sql
drop policy if exists "boom_admin_select_replyee_voice_agents" on replyee_voice_agents;
create policy "boom_admin_select_replyee_voice_agents" on replyee_voice_agents
  for select using (public.is_boom_admin());

drop policy if exists "boom_admin_select_replyee_voice_calls" on replyee_voice_calls;
create policy "boom_admin_select_replyee_voice_calls" on replyee_voice_calls
  for select using (public.is_boom_admin());

-- ── Realtime ──────────────────────────────────────────────────
-- Calls land in the same Live Inbox agents already watch.
do $$ begin
  alter publication supabase_realtime add table replyee_voice_calls;
exception when duplicate_object then null; end $$;
