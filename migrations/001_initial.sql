-- ============================================================
-- Replyee — Initial Database Migration
-- Shared Supabase: https://db.boommedia.us
-- All tables prefixed replyee_ to avoid collisions
-- Run in Supabase Studio: https://studio.boommedia.us
-- ============================================================

create extension if not exists vector;

-- ── Profiles ──────────────────────────────────────────────────
create table if not exists replyee_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text,
  email               text,
  plan                text not null default 'starter_trial',
  bot_limit           int  not null default 1,
  stripe_customer_id  text,
  created_at          timestamptz not null default now()
);

create or replace function replyee_handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into replyee_profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists replyee_on_auth_user_created on auth.users;
create trigger replyee_on_auth_user_created
  after insert on auth.users
  for each row execute function replyee_handle_new_user();

-- ── Chatbots ──────────────────────────────────────────────────
create table if not exists replyee_chatbots (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references replyee_profiles(id) on delete cascade,
  name               text not null,
  website_url        text,
  accent_color       text not null default '#6366f1',
  bot_avatar_url     text,
  system_prompt      text,
  greeting_message   text not null default 'Hi! How can I help you today?',
  fallback_message   text not null default 'I don''t have that information. Can I take your email so someone can follow up?',
  is_active          boolean not null default true,
  conversation_count int not null default 0,
  lead_count         int not null default 0,
  chunk_count        int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── Knowledge Chunks ──────────────────────────────────────────
create table if not exists replyee_knowledge_chunks (
  id           uuid primary key default gen_random_uuid(),
  chatbot_id   uuid not null references replyee_chatbots(id) on delete cascade,
  content      text not null,
  embedding    vector(1536),
  source_type  text not null,
  source_name  text,
  created_at   timestamptz not null default now()
);

create index if not exists replyee_knowledge_chunks_embedding_idx
  on replyee_knowledge_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── Messages ──────────────────────────────────────────────────
create table if not exists replyee_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null,
  chatbot_id   uuid not null references replyee_chatbots(id) on delete cascade,
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  created_at   timestamptz not null default now()
);

create index if not exists replyee_messages_session_idx on replyee_messages(session_id);
create index if not exists replyee_messages_chatbot_idx on replyee_messages(chatbot_id);

-- ── Conversations ─────────────────────────────────────────────
create table if not exists replyee_conversations (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null unique,
  chatbot_id    uuid not null references replyee_chatbots(id) on delete cascade,
  visitor_email text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Leads ─────────────────────────────────────────────────────
create table if not exists replyee_leads (
  id             uuid primary key default gen_random_uuid(),
  chatbot_id     uuid not null references replyee_chatbots(id) on delete cascade,
  visitor_email  text not null,
  question       text,
  session_id     uuid,
  created_at     timestamptz not null default now()
);

-- ── Helper RPCs ───────────────────────────────────────────────

create or replace function replyee_match_chunks(
  query_embedding vector(1536),
  chatbot_id      uuid,
  match_count     int     default 5,
  match_threshold float   default 0.5
)
returns table (
  id         uuid,
  content    text,
  similarity float
)
language plpgsql as $$
begin
  return query
  select
    kc.id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity
  from replyee_knowledge_chunks kc
  where
    kc.chatbot_id = replyee_match_chunks.chatbot_id
    and 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;

create or replace function replyee_increment_conversation_count(bot_id uuid)
returns void language sql as $$
  update replyee_chatbots set conversation_count = conversation_count + 1 where id = bot_id;
$$;

create or replace function replyee_increment_lead_count(bot_id uuid)
returns void language sql as $$
  update replyee_chatbots set lead_count = lead_count + 1 where id = bot_id;
$$;

create or replace function replyee_increment_chunk_count(bot_id uuid, amount int)
returns void language sql as $$
  update replyee_chatbots set chunk_count = chunk_count + amount where id = bot_id;
$$;

-- ── Row Level Security ────────────────────────────────────────
alter table replyee_profiles         enable row level security;
alter table replyee_chatbots         enable row level security;
alter table replyee_knowledge_chunks enable row level security;
alter table replyee_messages         enable row level security;
alter table replyee_conversations    enable row level security;
alter table replyee_leads            enable row level security;

create policy "replyee_profiles_own"    on replyee_profiles    for all using (auth.uid() = id);
create policy "replyee_chatbots_own"    on replyee_chatbots    for all using (auth.uid() = user_id);
create policy "replyee_chunks_own"      on replyee_knowledge_chunks for all
  using (chatbot_id in (select id from replyee_chatbots where user_id = auth.uid()));
create policy "replyee_messages_own"    on replyee_messages    for all
  using (chatbot_id in (select id from replyee_chatbots where user_id = auth.uid()));
create policy "replyee_conversations_own" on replyee_conversations for all
  using (chatbot_id in (select id from replyee_chatbots where user_id = auth.uid()));
create policy "replyee_leads_own"       on replyee_leads       for all
  using (chatbot_id in (select id from replyee_chatbots where user_id = auth.uid()));
