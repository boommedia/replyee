# Replyee — Capabilities Overview

**Last updated:** June 2026  
**Status:** Production (replyee.online)

---

## What Is Replyee?

Replyee is an AI-powered live chat and customer engagement platform for restaurant websites and ordering pages. It embeds as a lightweight widget script and connects to a dashboard where restaurant owners manage conversations, configure the bot, and see real-time visitor activity.

---

## Core Capabilities (Live Today)

### 1. AI Chat Widget

- Embeds on any website via a single `<script>` tag
- Branded with the restaurant's accent color and name
- Answers questions using RAG (retrieval-augmented generation) against the restaurant's knowledge base
- Maintains full conversation history within a session
- Smooth open/close animation, mobile-responsive, 340×520px

### 2. Knowledge Base (RAG)

- Knowledge stored as vector-embedded chunks in `replyee_knowledge_chunks`
- Powered by `text-embedding-3-small` (OpenAI) + pgvector similarity search
- Source types: `menu`, `faq`, `url`, `text`, `file`
- Menu chunks auto-ingested from BOO (one chunk per category)
- Additional chunks manually added in the dashboard (URL scrape, text paste, file upload)
- Match threshold: 0.5 cosine similarity, top-5 chunks per query
- Claude Haiku generates responses from matched context

### 3. Human Takeover / Live Chat

- Any conversation can be escalated to a human agent
- Agent claims the conversation from the Live Inbox
- Bot goes silent; agent types directly to the customer in real time
- Agent can release back to AI mode
- Typing indicator shows when agent is composing

### 4. Live Inbox

- Real-time conversation list (Supabase Realtime)
- Filter by mode: AI, human, closed
- Order context card shows BOO order details inline
- Unread badge counts
- Full message transcript per conversation
- Agent can send messages, switch modes, close conversations

### 5. Visitor Intelligence

- Tracks every visitor via persistent `replyee_visitor_id` (localStorage)
- Records: current page, referrer, device, page views, visit count, last seen
- Real-time Visitors dashboard — shows who is on the site right now
- "View Chat" button links directly to that visitor's conversation if one exists
- Heartbeat every 30 seconds keeps sessions alive

### 6. Triggers (Proactive Engagement)

- **Exit intent** — fires when cursor leaves the viewport heading toward browser chrome
- **Time on page** — fires after N seconds
- **Scroll depth** — fires when user scrolls past X% of the page
- Configurable per bot: message text, delay, one-time or repeating
- Managed in bot settings → Triggers tab

### 7. Lead Capture

- Bot asks for visitor email when it can't answer a question (fallback)
- Email + name stored in `replyee_leads`
- Visible in dashboard Leads section
- Handoff alert email sent to bot owner when lead is captured

### 8. Canned Replies

- Saved responses for common questions
- Agents can insert with one click in the Live Inbox
- Per-bot, managed in Settings → Canned Replies

### 9. Email Alerts

| Trigger | Email sent |
|---------|-----------|
| New lead captured | Lead alert to bot owner |
| Human takeover requested | Handoff alert to bot owner |
| New BOO order placed | Order alert to bot owner |
| Daily summary | Daily report to bot owner (8am UTC cron) |
| Welcome | Sent on account creation |
| Password reset | Supabase Auth native |

### 10. Daily Report Cron

- Fires at 08:00 UTC every day (`/api/cron/daily-report`)
- Per bot owner: visitors (new vs. returning), top pages, traffic sources, conversations, leads, AI resolution rate
- Protected by `CRON_SECRET` bearer token

---

## BOO Integration Capabilities

### Bot Lifecycle (Internal API)

| Endpoint | Called by BOO when… |
|----------|---------------------|
| `POST /api/internal/bots` | Restaurant activates Replyee add-on |
| `PUT /api/internal/bots` | Menu is updated in BOO |
| `DELETE /api/internal/bots` | Restaurant deactivates Replyee |

- Bot is created inside the restaurant owner's existing Replyee account (by `userId` UUID)
- Full menu ingested as knowledge chunks (one per category, available items only)
- Returns `embedCode` — BOO injects this script tag on the ordering page

### Order Notifications (Webhook)

`POST /api/webhooks/boo-order` — called by BOO on every order event:

- **New order placed** → creates conversation in Live Inbox with order summary card
- **Status: confirmed** → new message in thread: "Confirmed — being prepared"
- **Status: ready** → "Ready for pickup"
- **Status: completed** → "Delivered"
- **Status: cancelled** → "Cancelled"
- **Status: delayed** → "Being prepared" (delay implied)

BOO stores the returned `sessionId` on the order (`customer_orders.replyee_session_id`) so all status updates append to the same thread.

### Live Order Context in Widget

BOO calls `window.Replyee.setOrderContext({ orderId, status, items, total, customerEmail })` after checkout. The AI receives this as real-time context, enabling answers to:
- "What did I just order?"
- "What's my total?"
- "Can I change my order?"

---

## What the Bot Can Answer (by Knowledge Source)

| Question type | Source | Status |
|---------------|--------|--------|
| Menu items, prices | BOO menu (auto-ingested) | ✅ Live |
| Allergens, dietary info | BOO menu descriptions | ✅ If in BOO menu |
| Hours of operation | Manual knowledge chunk | ⚠️ Manual setup needed |
| Address / directions | Manual knowledge chunk | ⚠️ Manual setup needed |
| Phone number | Manual knowledge chunk | ⚠️ Manual setup needed |
| Parking info | Manual knowledge chunk | ⚠️ Manual setup needed |
| Catering minimums / policies | Manual knowledge chunk | ⚠️ Manual setup needed |
| Current order status (in session) | `setOrderContext()` from BOO | ✅ Live |
| Past order status (new session) | Not yet implemented | ❌ Roadmap |
| Daily specials | BOO menu sync (`PUT`) | ✅ If menu updated |
| Reservation availability | Not integrated | ❌ Roadmap |

---

## Roadmap / Next Builds

### High Priority

**Auto-ingest restaurant info**  
Add a `restaurant_info` knowledge chunk to `POST /api/internal/bots`. BOO sends `{ address, phone, hours, policies }` alongside `categories`. Solves directions, hours, and contact questions at activation time with zero manual setup.

**Order status lookup endpoint**  
`GET /api/internal/order-status?orderId=xxx&email=xxx` — lets the bot answer "where's my order?" for returning customers who don't have the current session's order context. Protected by shared secret.

### Medium Priority

**Directions quick-reply button**  
Widget-level "Get Directions" CTA that opens Google Maps with the restaurant's address. Pulled from the `restaurant_info` knowledge chunk.

**Daily specials push**  
BOO scheduler calls `PUT /api/internal/bots` nightly with an updated "Today's Specials" category chunk. No new infrastructure.

**Sentiment tagging on conversations**  
Tag conversations as positive/negative/neutral using Claude at close time. Surface in daily report as "sentiment score."

### Lower Priority

**Review response (original Replyee concept)**  
Google/Yelp review monitoring + AI-generated draft replies in the dashboard. Separate module from live chat.

**Reservation/booking integration**  
If BOO adds table reservations, Replyee bot could check availability and drop a booking link.

**Multi-language**  
Detect visitor browser language, respond in kind. System prompt injection + translation layer.

---

## Technical Architecture

| Layer | Technology |
|-------|-----------|
| Widget | Vanilla JS, ~600 lines, single `<script>` tag |
| Frontend dashboard | Next.js 16, App Router, React |
| API | Next.js Route Handlers (nodejs runtime) |
| AI | Claude Haiku (chat), text-embedding-3-small (RAG) |
| Database | Supabase (PostgreSQL + pgvector + Realtime) |
| Auth | Supabase Auth (email/password) |
| Email | Resend API |
| Deployment | Vercel (serverless) |
| Cron | Vercel Crons (`vercel.json`) |

### Key Tables

| Table | Purpose |
|-------|---------|
| `replyee_chatbots` | Bot config per user |
| `replyee_knowledge_chunks` | RAG content with vector embeddings |
| `replyee_conversations` | One row per session, tracks mode + unread |
| `replyee_messages` | Full message history |
| `replyee_leads` | Captured emails |
| `replyee_visitor_sessions` | Real-time visitor presence |
| `replyee_profiles` | User accounts (mirrors Supabase Auth) |
| `replyee_triggers` | Per-bot proactive engagement rules |
| `replyee_canned_replies` | Saved agent responses |

### Security

- Internal API (`/api/internal/*`) — `Authorization: Bearer <BOO_API_SECRET>`
- Order webhook (`/api/webhooks/boo-order`) — same secret
- Cron (`/api/cron/*`) — `Authorization: Bearer <CRON_SECRET>` (Vercel-managed)
- Dashboard routes — Supabase Auth session required
- All Supabase queries scoped to authenticated user's bots (RLS + service role for internal)
