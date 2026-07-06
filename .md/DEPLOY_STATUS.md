> ⚠️ **SUPERSEDED 2026-07-06** — Phase 1 was committed + deployed-ready long ago (plus Stripe billing, daily digest cron, BOO order-status). Current status: `.md/BOUNDARIES_AND_BOO_STATUS.md`. Kept for the migration/E2E checklists only.

# Replyee — Phase 1 Deploy Status
> Last updated: 2026-06-13 | Ready to deploy — code complete, 3 steps to live

---

## Status: ✅ Phase 1 Code Complete — NOT YET DEPLOYED

All Phase 1 live chat / human takeover files are built and sitting **uncommitted** on local machine.  
Git remote (`origin/main`) already exists. Vercel project already connected.

---

## What's Built (Phase 1 — SalesIQ-style Live Chat)

### API Routes
- ✅ `/api/chat/route.ts` — human mode check: if `convo.mode === 'human'`, stores message silently, returns `{ human: true }`, skips Claude entirely
- ✅ `/api/handoff/route.ts` — sets `mode='human'` in DB + sends Resend alert email to bot owner (with visitor's last message)
- ✅ `/api/bot-config/route.ts` — public CORS endpoint returns bot config + Supabase URL + anon key so widget can join Realtime broadcast

### Live Inbox UI
- ✅ `src/app/dashboard/inbox/page.tsx` — server component, auth check, fetches bots, passes to InboxClient
- ✅ `src/app/dashboard/inbox/inbox-client.tsx` — full agent inbox:
  - Conversation list with unread count badges + mode labels (Bot / Live / Closed)
  - Real-time updates via `postgres_changes` on `replyee_messages` + `replyee_conversations`
  - "Take over" button → sets mode to `human` + broadcasts to visitor widget
  - "Release to bot" button → sets mode back to `bot`
  - "Close" button → sets mode to `closed`, removes from list
  - Agent reply box → inserts `role: 'agent'` message → broadcasts via `replyee-session-[uuid]` channel
  - Unread badge auto-clears when conversation is opened

### Widget (`public/widget.js`)
- ✅ "Talk to a human" button in footer
- ✅ Clicking it → calls `/api/handoff` → joins Supabase Realtime broadcast channel `replyee-session-[sessionId]`
- ✅ Listens `agent_message` event → shows green "Team member" bubble
- ✅ Listens `mode` event → updates status indicator (Online / Connecting… / Live with team member)
- ✅ `sendMessage()` detects `{ human: true }` response → silently stays in human mode, no bot reply shown

### Migration
- ✅ `migrations/002_live_chat.sql` — written, NOT yet run on db.boommedia.us:
  - Adds `mode text default 'bot'` to `replyee_conversations` (check: bot/human/closed)
  - Adds `assigned_to`, `last_message_at`, `unread_by_agent` columns
  - Drops + recreates `replyee_messages_role_check` to allow `role = 'agent'`
  - Adds both tables to `supabase_realtime` publication
  - NOTE: `visitor_email` already exists in conversations from migration 001 ✅

### Other Modified Files (uncommitted)
- `src/lib/email.ts` — `sendHandoffAlert()` function added
- `src/components/nav-links.tsx` — "Live Inbox" nav link added
- `src/app/login/page.tsx` — minor updates
- `src/app/signup/page.tsx` — minor updates

---

## 3 Steps to Deploy

### Step 1 — Commit + Push (Vercel auto-deploys on push)
```bash
cd "g:\My Drive\AI\Claude\Projects\Boom Media\SaaS\Replyee"
git add migrations/002_live_chat.sql src/app/api/bot-config src/app/api/handoff src/app/dashboard/inbox public/widget.js src/app/api/chat/route.ts src/lib/email.ts src/components/nav-links.tsx src/app/login/page.tsx src/app/signup/page.tsx
git commit -m "feat: Phase 1 live chat — human takeover, Live Inbox, Realtime broadcast"
git push
```

### Step 2 — Run DB Migration
- Open Supabase Studio: https://db.boommedia.us (or https://studio.boommedia.us)
- Go to SQL Editor
- Open and paste `migrations/002_live_chat.sql`
- Run — safe, all `ADD COLUMN IF NOT EXISTS`, no destructive changes

### Step 3 — E2E Test
1. Open any page with widget embedded → click chat bubble
2. Click "Talk to a human"
3. Open Replyee dashboard → Live Inbox
4. Conversation should appear with "Live" badge
5. Type a reply → hit Send
6. Visitor widget should show green "Team member" bubble with your reply
7. Click "Release to bot" → visitor widget should show "Online" again

---

## Deploy Target
- Platform: **VERCEL** (NOT Coolify — Replyee uses serverless, no Playwright)
- Domain: replyee.online
- Vercel project: already connected to GitHub repo (origin/main)
- Push to main → Vercel auto-deploys

## Env Vars Needed in Vercel (verify all set)
```
NEXT_PUBLIC_SUPABASE_URL=https://db.boommedia.us
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://replyee.online
```

---

## What Phase 1 Does NOT Include (Phase 2+)
- Visitor session persistence across page reloads
- Proactive chat triggers (e.g., after 30s on page)
- Lead scoring
- Canned replies
- CSAT / satisfaction rating
- Multi-agent routing (assigned_to is in DB but not used in UI yet)
- BOO ordering page embed (Oct–Nov 2026)
- SureContact lead capture integration

---

## Related Files
- `.md/SALESIQ_UPGRADE_PLAN.md` — full Phase 1/2/3 roadmap
- `.md/TASKS.md` — complete task list with done/todo breakdown
- `.md/ECOSYSTEM_ROLE.md` — Replyee's role in the Boom ecosystem
- `.md/CLAUDE.md` — quick reference for Claude Code sessions
- `migrations/001_initial.sql` — original DB schema (already run)
- `migrations/002_live_chat.sql` — Phase 1 migration (NOT yet run)
