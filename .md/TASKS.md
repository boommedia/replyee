# Replyee — Task List
> Last updated: 2026-06-13 | Owner: eric@boommedia.us

## Status: 🔨 Phase 1 Complete (Jun 10, 2026) — Pending Vercel Deploy

> ⚠️ IMPORTANT: Replyee is an AI CHATBOT platform (RAG + live chat), NOT review management.
> The BOOM_ECOSYSTEM_MASTER_CONTEXT.md has wrong description — must be corrected.

---

## ✅ DONE — Phase 1 (RAG Chatbot + Live Chat)

### Core AI Chatbot (Built)
- [x] RAG pipeline: pgvector + OpenAI embeddings + knowledge base chunks
- [x] Claude Haiku (claude-haiku-4-5-20251001) for chat responses
- [x] Per-bot knowledge base (file upload → chunks → embeddings)
- [x] Widget.js — embeds on any website via 1-line `<script>` tag
- [x] `/api/chat` — RAG-powered bot response endpoint
- [x] `/api/bot-config` — widget fetches bot name, accent, greeting, handoff flag
- [x] Bot builder UI (create/edit chatbot, system prompt, knowledge base)
- [x] Conversation history per session (sessionId tracking)
- [x] Analytics: conversation count, message volume

### Phase 1 — Live Chat / Human Takeover (Built Jun 10, 2026)
- [x] **migrations/002_live_chat.sql** — written (needs to run on db.boommedia.us):
  - `replyee_conversations.mode` column (bot | human | closed)
  - `replyee_conversations.assigned_to` — agent UUID ref
  - `replyee_conversations.unread_by_agent` — unread message count
  - `replyee_conversations.last_message_at` — for Live Inbox sort
  - `replyee_messages.role` — now allows 'agent' in addition to 'user' | 'assistant'
  - Supabase Realtime publication on messages + conversations tables
- [x] `/api/handoff` — sets conversation.mode = 'human', sends alert email
- [x] `/api/chat` — human mode check: if mode='human', stores message silently, returns `{ human: true }`
- [x] **Live Inbox** (`/dashboard/inbox`) — realtime agent dashboard:
  - postgres_changes on messages + conversations (RLS-scoped to agent's own bots)
  - Conversation list with Bot/Live/Closed mode badges + unread count indicators
  - Take over / Release to bot / Close controls
  - Broadcast channel per session for instant agent → visitor delivery
  - Color-coded transcript: user (dark), bot (indigo), agent (green)
  - Enter to send, auto-scroll to latest message
- [x] **Widget.js** — "Talk to a human" button (shows only if config.handoff = true):
  - humanMode flag + sbChannel tracking
  - `requestHuman()` — calls /api/handoff, joins Supabase Realtime broadcast channel
  - `joinSessionChannel()` — subscribes to `replyee-session-[sessionId]` broadcast
  - `addAgentMsg()` — green-styled agent messages with "Team member" label
  - `loadSupabase()` — lazy CDN load of @supabase/supabase-js only when handoff triggered
  - "Waiting for team member..." status message shown while in queue
- [x] Handoff alert email (Resend) — `sendHandoffAlert()` notifies bot owner when visitor requests human
- [x] Nav: "Live Inbox" added to dashboard sidebar (MessagesSquare icon)

---

## 🔴 URGENT — Deploy Phase 1

- [ ] Verify type-check result: `node_modules\.bin\tsc.cmd --noEmit` (background task running)
- [ ] Fix any TypeScript errors found
- [ ] **Run `migrations/002_live_chat.sql`** on db.boommedia.us (Supabase Studio)
- [ ] **Deploy to Vercel** (`replyee.online`) — NOTE: Replyee uses VERCEL, not Coolify
  - Replyee is serverless-safe (no Playwright, no long-running processes)
  - Set all env vars in Vercel project settings
- [ ] End-to-end test:
  - Widget "Talk to a human" button appears
  - Clicking → visitor sees "Waiting for team member..."
  - Agent sees conversation in Live Inbox
  - Agent sends reply → visitor receives it in widget instantly
  - "Release to bot" → bot responds again
  - "Close" → conversation marked closed

---

## 📋 TODO — Phase 2 (Visitor Tracking + Proactive Triggers)

### New Tables Needed
- [ ] `visitor_sessions` table: track visitor page URL, referrer, session start time, pages viewed
- [ ] `canned_replies` table: pre-written replies agents can insert with 1 click
- [ ] `bot_triggers` table: rule-based proactive chat triggers

### Features
- [ ] Visitor session tracking: record which pages visitor viewed before opening chat
- [ ] Agent sees visitor context in Live Inbox: "Viewed: Menu page, Pricing page, 3 pages total"
- [ ] Proactive triggers: after X seconds on /pricing → show chat widget with custom message
- [ ] Lead scoring: assign score based on pages viewed, time on site, questions asked
- [ ] Canned replies for agents (quick-insert standard answers)
- [ ] Conversation tags (order inquiry, complaint, catering, etc.)

---

## 📋 TODO — Phase 3 (Multi-Agent + CSAT)

- [ ] Multiple agents per bot (assign conversations to specific agents)
- [ ] Agent availability status (Online / Away / Offline)
- [ ] CSAT (Customer Satisfaction) rating after conversation close
- [ ] Bot analytics: deflection rate, handoff rate, avg response time, CSAT score
- [ ] Sentiment analysis on visitor messages (flag negative sentiment)

---

## 📋 TODO — BOO Integration (Oct–Nov 2026)

- [ ] Embed Replyee widget on BOO ordering pages
  - Each BOO client creates 1 Replyee bot → widget script added to their ordering page HTML
  - Bot knowledge base pre-loaded with: menu, hours, FAQs, ordering policies
- [ ] Lead capture: visitor email captured during chat → added to SureContact restaurant list
- [ ] Replyee analytics in BOO portal: chat volume, common questions (inform menu/FAQ updates)
- [ ] **Dashee widget**: chat volume, handoff rate, CSAT score → client dashboard

---

## 📋 TODO — Ecosystem Doc Fix (URGENT)

- [ ] **Update BOOM_ECOSYSTEM_MASTER_CONTEXT.md section H**: change from "review management" to "AI chatbot + live support platform (RAG + SalesIQ-style live chat)"
- [ ] **Update BOOM_MASTER_ECOSYSTEM.html** products tab: fix Replyee card description + icon (⭐ is wrong — should be 💬)
- [ ] **Update SAAS_PORTFOLIO.md** Replyee description: currently says "Review reply management" → change to "AI chatbot + live support (RAG + human takeover)"

---

## 💰 Pricing Reference
| Plan | Price | Features |
|---|---|---|
| Starter (TBD) | ~$49/mo | 1 bot, 500 messages/mo |
| Growth (TBD) | ~$79/mo | 3 bots, 2,000 messages/mo |
| Pro (TBD) | ~$99/mo | Unlimited bots, messages |
| BOO Pro (included) | $850/mo BOO | AI chat on ordering page |

---

## 🔗 Related Files
- `.md/ECOSYSTEM_ROLE.md` — Replyee's role in Boom ecosystem (actual AI chatbot description)
- `.md/SALESIQ_UPGRADE_PLAN.md` — Full Phase 1/2/3 plan for live chat upgrade
- `.md/DATABASE_SCHEMA.md` — Replyee database schema
- `.md/COOLIFY_DEPLOY.md` — NOTE: Replyee uses Vercel NOT Coolify
- `migrations/002_live_chat.sql` — Must run on db.boommedia.us
