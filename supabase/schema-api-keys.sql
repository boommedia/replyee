-- ================================================================
-- Replyee — Public API keys (v1). Run in the Supabase SQL editor.
-- Other apps authenticate to https://replyee.online/api/v1/* with
-- Authorization: Bearer <key>. One API surface, many keys.
-- Idempotent.
-- ================================================================

create table if not exists replyee_api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null default 'API key',
  key          text not null unique,          -- rpl_live_<hex>
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked      boolean not null default false
);

create index if not exists idx_replyee_api_keys_key on replyee_api_keys(key);
create index if not exists idx_replyee_api_keys_user on replyee_api_keys(user_id);

alter table replyee_api_keys enable row level security;

-- Owners manage their own keys from the app (session auth).
-- The public /api/v1 endpoints validate keys via the service-role client (bypasses RLS).
drop policy if exists "users manage own api keys" on replyee_api_keys;
create policy "users manage own api keys"
  on replyee_api_keys for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on replyee_api_keys to authenticated;
