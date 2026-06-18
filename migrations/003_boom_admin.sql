-- ============================================================
-- Replyee — Boom Media Admin Setup
-- Run in: https://db.boommedia.us → SQL Editor
-- ============================================================

create or replace function public.is_boom_admin()
returns boolean language sql security definer stable as $$
  select coalesce(
    (select email from auth.users where id = auth.uid()) = 'eric@boommedia.us',
    false
  );
$$;

-- Admin can see all agency accounts using Replyee
drop policy if exists "boom_admin_select_replyee_profiles" on replyee_profiles;
create policy "boom_admin_select_replyee_profiles" on replyee_profiles
  for select using (public.is_boom_admin());

-- Admin can see all bots created by all agencies
drop policy if exists "boom_admin_select_replyee_chatbots" on replyee_chatbots;
create policy "boom_admin_select_replyee_chatbots" on replyee_chatbots
  for select using (public.is_boom_admin());

-- Admin can see all knowledge base content
drop policy if exists "boom_admin_select_replyee_knowledge_chunks" on replyee_knowledge_chunks;
create policy "boom_admin_select_replyee_knowledge_chunks" on replyee_knowledge_chunks
  for select using (public.is_boom_admin());

-- Admin can see all live chat conversations across all bots
drop policy if exists "boom_admin_select_replyee_conversations" on replyee_conversations;
create policy "boom_admin_select_replyee_conversations" on replyee_conversations
  for select using (public.is_boom_admin());

-- Admin can see all messages (for support, monitoring)
drop policy if exists "boom_admin_select_replyee_messages" on replyee_messages;
create policy "boom_admin_select_replyee_messages" on replyee_messages
  for select using (public.is_boom_admin());

-- ── Create Boom Media's own Replyee account ──────────────────────────────────
-- This is the "operator" account. BOO restaurant bots get created under this
-- account when provisioned automatically from BOO's back-end.
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'eric@boommedia.us' limit 1;
  if v_user_id is null then return; end if;

  insert into replyee_profiles (id, full_name, email, plan, bot_limit)
  values (v_user_id, 'Boom Media (Operator)', 'eric@boommedia.us', 'agency', 999)
  on conflict (id) do update set plan = 'agency', bot_limit = 999;
end $$;
