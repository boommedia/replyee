-- ============================================================
-- Replyee — Initial Database Migration
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable pgvector extension (required for embeddings)
create extension if not exists vector;

-- ── Profiles (extends auth.users) ────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  plan        text not null default 'starter',  -- starter | growth | agency
  bot_limit   int  not null default 1,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Chatbots ──────────────────────────────────────────────────
create table if not exists chatbots (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
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

-- ── Knowledge Chunks (RAG vectors) ───────────────────────────
create table if not exists knowledge_chunks (
  id           uuid primary key default gen_random_uuid(),
  chatbot_id   uuid not null references chatbots(id) on delete cascade,
  content      text not null,
  embedding    vector(1536),          -- OpenAI text-embedding-3-small
  source_type  text not null,         -- 'url' | 'file' | 'text'
  source_name  text,                  -- URL string or filename
  created_at   timestamptz not null default now()
);

-- pgvector index for fast cosine similarity search
create index if not exists knowledge_chunks_embedding_idx
  on knowledge_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── Messages ──────────────────────────────────────────────────
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null,
  chatbot_id   uuid not null references chatbots(id) on delete cascade,
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  created_at   timestamptz not null default now()
);

create index if not exists messages_session_idx on messages(session_id);
create index if not exists messages_chatbot_idx on messages(chatbot_id);

-- ── Conversations (session view) ──────────────────────────────
create table if not exists conversations (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null unique,
  chatbot_id   uuid not null references chatbots(id) on delete cascade,
  visitor_email text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Leads ─────────────────────────────────────────────────────
create table if not exists leads (
  id             uuid primary key default gen_random_uuid(),
  chatbot_id     uuid not null references chatbots(id) on delete cascade,
  visitor_email  text not null,
  question       text,
  session_id     uuid,
  created_at     timestamptz not null default now()
);

-- ── Helper RPCs ───────────────────────────────────────────────

-- Vector similarity search (called from /api/chat)
create or replace function match_chunks(
  query_embedding vector(1536),
  chatbot_id      uuid,
  match_count     int     default 5,
  match_threshold float   default 0.5
)
returns table (
  id       uuid,
  content  text,
  similarity float
)
language plpgsql as $$
begin
  return query
  select
    kc.id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  where
    kc.chatbot_id = match_chunks.chatbot_id
    and 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Increment helpers (avoids race conditions vs SELECT+UPDATE)
create or replace function increment_conversation_count(bot_id uuid)
returns void language sql as $$
  update chatbots set conversation_count = conversation_count + 1 where id = bot_id;
$$;

create or replace function increment_lead_count(bot_id uuid)
returns void language sql as $$
  update chatbots set lead_count = lead_count + 1 where id = bot_id;
$$;

create or replace function increment_chunk_count(bot_id uuid, amount int)
returns void language sql as $$
  update chatbots set chunk_count = chunk_count + amount where id = bot_id;
$$;

-- ── Row Level Security ─────────────────────────────────────────
alter table profiles          enable row level security;
alter table chatbots          enable row level security;
alter table knowledge_chunks  enable row level security;
alter table messages          enable row level security;
alter table conversations     enable row level security;
alter table leads             enable row level security;

-- Profiles: users see only their own
create policy "profiles_own" on profiles for all using (auth.uid() = id);

-- Chatbots: users see only their own
create policy "chatbots_own" on chatbots for all using (auth.uid() = user_id);

-- Knowledge chunks: users see only chunks for their bots
create policy "chunks_own" on knowledge_chunks for all
  using (chatbot_id in (select id from chatbots where user_id = auth.uid()));

-- Messages: users see only messages for their bots
create policy "messages_own" on messages for all
  using (chatbot_id in (select id from chatbots where user_id = auth.uid()));

-- Conversations: users see only their own
create policy "conversations_own" on conversations for all
  using (chatbot_id in (select id from chatbots where user_id = auth.uid()));

-- Leads: users see only their own
create policy "leads_own" on leads for all
  using (chatbot_id in (select id from chatbots where user_id = auth.uid()));
