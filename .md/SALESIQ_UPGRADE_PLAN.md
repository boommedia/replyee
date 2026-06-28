# Replyee — Live Chat & Visitor Engagement Upgrade (Zoho SalesIQ parity)

> **Share this doc with any Claude session working on Replyee.**
> Goal: evolve Replyee from "AI chatbot only" into a full conversations platform —
> AI bot + live human chat + visitor tracking + proactive triggers — i.e. what
> Zoho SalesIQ / Intercom / Tidio sell, at Boom pricing.
> Created: 2026-06-10 · Owner: eric@boommedia.us
> **Phase 1 Status:** ✅ COMPLETE (live chat, human takeover, inbox, BOO integration)
> **Phase 2 Status:** ✅ COMPLETE (visitor tracking, proactive triggers, canned replies)

---

## What just shipped — Phase 2 (June 13, 2026)

### ✅ Visitor Tracking
- **Live Visitors Dashboard** (`/dashboard/visitors`) — real-time table showing active visitors, pages viewed, device, time on site
- **Heartbeat API** (`POST /api/visitor-heartbeat`) — widget pings every 30s with page, referrer, UTM, device
- **Real-time updates** via Supabase postgres_changes

### ✅ Proactive Chat Triggers
- **Trigger Builder UI** in bot settings (new Triggers tab)
- **4 trigger types:** time on page, URL contains, exit intent, return visitor
- **Client-side evaluation** in widget — auto-opens with custom messages
- **API endpoint** (`PUT /api/chatbots/[id]/triggers`) to save rules

### ✅ Canned Replies (Agent Shortcuts)
- **Management page** (`/dashboard/canned-replies`) — create/delete shortcuts per user
- **Inbox dropdown** — type `/` in reply box to see all shortcuts, click to insert
- **API endpoints** (`GET/POST/DELETE /api/canned-replies`)

### ✅ Enhanced Inbox
- **Visitor typing indicator** — shows "Visitor is typing…" in real time
- **Browser notifications** — desktop alerts for new messages
- **Canned replies autocomplete** — `/` dropdown with shortcut preview + body

### ✅ Widget Enhancements
- **Persistent visitor ID** — UUID in localStorage, tracks repeat visits
- **Presence indicator** — widget shows "We're online" when agent has inbox open
- **Visitor typing events** — broadcast to agent inbox channel

### ✅ Navigation
- Added **Visitors** and **Canned Replies** to main dashboard nav

**Migration:** `migrations/004_phase2.sql` (deployed ✅)

---

## Where Replyee is today (context for new sessions)

Replyee (replyee.online) is Boom Media's white-label **AI chatbot platform**:
- Clients upload content (PDFs, URLs, text) → chunked + embedded (OpenAI text-embedding-3-small, 1536 dims) into Supabase **pgvector** (`knowledge_chunks`)
- Visitor asks via embeddable `public/widget.js` → `/api/chat` → vector search (`match_chunks` RPC) → **Claude Haiku** streams an answer
- `leads` table captures emails when the bot can't answer; Resend notifies the client
- Tables: `profiles`, `chatbots`, `messages` (role: user|assistant, grouped by `session_id`), `leads`. RLS on; public endpoints use service role.
- Stack: Next.js 16 / Supabase (shared self-hosted — db.boommedia.us) / Stripe / Resend

**What it's missing vs SalesIQ:** a human can never join the conversation, there's no
agent inbox, no visitor presence/tracking, and chats only start when the visitor opens
the widget.

---

## What we're adding (in build order)

### Phase 1 — Live Chat + Human Takeover (the core upgrade, ~1.5–2 weeks)

1. **Realtime messages** — switch widget + dashboard to **Supabase Realtime** (postgres_changes on `messages`, channel per `session_id`). Visitor sees agent replies instantly; no polling. *(2 days)*
2. **Agent Inbox** (`/inbox`) — list of conversations (open / bot-handled / closed), live transcript view, reply box. Replying flips the session to `human` mode; the bot stays silent until released. *(3 days)*
3. **Handoff logic** — visitor clicks "Talk to a human", bot confidence is low (no chunks above threshold), or agent manually takes over. Add `mode` (`bot` | `human` | `closed`) + `assigned_to` on a new `conversations` table (promote `session_id` to a first-class row). *(1–2 days)*
4. **Agent presence** — Supabase Realtime presence channel; widget shows "We're online" vs "Leave a message". Offline → existing lead-capture flow. *(1 day)*
5. **Typing indicators + read state** — Realtime broadcast events, both directions. *(1 day)*
6. **Missed-chat email** — Resend notification with transcript when a visitor message sits unanswered in `human` mode > N minutes. *(0.5 day)*

### Phase 2 — Visitor Tracking & Proactive Triggers (~1 week) ✅ COMPLETE

7. **Visitor sessions** — widget pings `visitor_sessions`: first/last seen, current page, page count, referrer, UTM, device. Powers a live "Who's on the site" view in the dashboard. ✅ *DONE*
8. **Proactive triggers** — per-chatbot rules (JSON): auto-open widget with a message when {time on page > X, URL matches Y, return visitor, exit intent}. SalesIQ's signature feature; trivial client-side once rules exist. ✅ *DONE*
9. **Lead scoring (simple)** — score = pages viewed + return visits + chat engagement; surface hot visitors first in the live view. 🚧 *DEFERRED TO PHASE 3*
10. **Canned replies** — agent shortcuts (`/price`, `/hours`) stored per account. ✅ *DONE*
11. **Visitor typing indicator** — show in inbox when visitor is typing. ✅ *DONE*
12. **Browser notifications** — desktop alerts for new messages. ✅ *DONE*

### Phase 3 — Team & Polish (next)

13. **Lead scoring** — score = pages viewed + return visits + chat engagement; surface hot visitors first in the live view
14. Multi-agent: invite team members, route by department/skill, transfer chats
15. Chat ratings (👍/👎 + comment) and CSAT report
16. Conversation analytics: volume, bot deflection rate, first-response time
17. Mobile agent experience (responsive inbox first; PWA later)
18. Sound / sound notifications for agents; daily digest email

---

## Deployment Checklist (Phase 2)

- [x] Migration 004 deployed to Supabase
- [x] All API endpoints tested
- [x] Widget features verified
- [x] Dashboard pages created
- [x] Navigation updated
- [x] Inbox enhancements live
- [ ] E2E testing with BOO widget embed
- [ ] User onboarding docs
- [ ] Pricing tier update (optional: add "Live Chat" add-on or fold into Growth/Agency)

---

## New / changed tables

> ⚠️ Check the live migration files for the current naming before writing SQL —
> the schema doc shows unprefixed tables, but the portfolio standard for Replyee
> on the shared Supabase is the `ry_` prefix. Follow whatever the existing
> migrations actually use, and stay consistent.

```sql
-- Promote sessions to first-class conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),      -- = session_id used in messages
  chatbot_id uuid not null references chatbots(id) on delete cascade,
  mode text not null default 'bot',                   -- 'bot' | 'human' | 'closed'
  assigned_to uuid references profiles(id),
  visitor_id uuid,
  last_message_at timestamptz,
  unread_by_agent int not null default 0,
  created_at timestamptz not null default now()
);

create table visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid not null references chatbots(id) on delete cascade,
  visitor_id uuid not null,                           -- random uuid in widget localStorage
  current_page text,
  referrer text,
  utm jsonb,
  device text,
  page_views int not null default 1,
  visits int not null default 1,
  score int not null default 0,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table canned_replies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  shortcut text not null,                             -- '/hours'
  body text not null
);

-- chatbots additions
alter table chatbots add column if not exists triggers jsonb not null default '[]';
alter table chatbots add column if not exists handoff_enabled boolean not null default true;

-- messages addition (bot vs human agent replies)
alter table messages add column if not exists sender text not null default 'bot'; -- 'visitor' | 'bot' | 'agent'
```

Realtime: enable `supabase_realtime` publication on `messages` and `conversations`.

---

## Widget changes (`public/widget.js`)

- Subscribe to the conversation's Realtime channel instead of awaiting only the POST response
- "Talk to a human" button (visible when an agent is present)
- Presence-aware header: online → "Typically replies in minutes", offline → lead form
- Visitor heartbeat (page, referrer, UTM) every 30s → `visitor_sessions`
- Trigger engine: evaluate `chatbots.triggers` rules client-side, auto-open with message
- Keep it vanilla JS, < 25KB, no framework — same constraint as today

---

## Why this beats buying SalesIQ

| | Zoho SalesIQ | Replyee after upgrade |
|---|---|---|
| AI bot trained on client content | Higher tiers, clunky | ✅ Already core (RAG + Claude Haiku) |
| Live chat + takeover | ✅ | ✅ Phase 1 |
| Visitor tracking + triggers | ✅ | ✅ Phase 2 |
| White-label for agency clients | ❌ | ✅ |
| Price | $7–20/agent/mo + bot add-ons | One Replyee sub, agency-friendly |

Cross-sell notes: BOO restaurants get "chat that knows the menu" (knowledge base
fed from BOO menu data); Compliee's Playwright crawler can feed site content into
`knowledge_chunks` automatically (shared-infra synergy, Phase 2+).

## Pricing impact (suggestion)

Keep current bot plans; add **+$10–15/mo "Live Chat" add-on** per site (agent seat
included, extra seats later), or fold live chat into Growth/Agency tiers as the
upgrade driver. Tidio charges $29/mo for this; Intercom $39/seat.

---

*Boom Media SaaS · shared Supabase db.boommedia.us · deploy per COOLIFY_DEPLOY.md*
