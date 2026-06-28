# Replyee — Role in Boom Media Ecosystem

## ⚠️ IMPORTANT: Product Description Discrepancy

The `BOOM_ECOSYSTEM_MASTER_CONTEXT.md` describes Replyee as a **"Unified review inbox for Google, Yelp, Instagram, Facebook reviews"** — this is OUTDATED / INCORRECT.

**Replyee.online is an AI chatbot platform (RAG-based live chat + AI support).**

The master ecosystem doc needs to be updated. The review management function described there was likely an original concept that evolved into the current AI chatbot product. The current actual product is documented below.

---

## Primary Function (ACTUAL)
AI chatbot + live customer support platform — embeds a widget on any website, answers visitor questions using RAG (Retrieval-Augmented Generation) trained on a knowledge base, and now includes SalesIQ-style live chat with human agent takeover. Powered by Claude Haiku + pgvector embeddings.

## Ecosystem Position
- **Category:** Add-On (~$49–$99/mo TBD) — can be embedded on any BOO client page
- **In BOO tiers:**
  - Pro ($850): AI chat assistant included (maps to "AI customer chat assistant" in tier table)
  - All tiers: Available as add-on for the customer-facing ordering page
- **Standalone SaaS:** AI chatbot builder at replyee.boommedia.us / replyee.online

## Core Technical Architecture
```
Customer visits BOO ordering page
  → Replyee widget.js loads
  → Visitor types question
  → /api/chat (RAG pipeline):
      1. Embed question (OpenAI/pgvector)
      2. Match top 5 knowledge base chunks
      3. Claude Haiku generates answer from context
  → Bot replies instantly
  → If visitor requests human: /api/handoff
      → conversation.mode = 'human'
      → Agent gets alert email (Resend)
      → Bot goes silent
      → Agent replies via Live Inbox (Supabase Realtime broadcast)
```

## Features Built (Phase 1 — Jun 2026)
- ✅ RAG chatbot with per-bot knowledge base (file upload → chunks → embeddings)
- ✅ Widget.js: embeds on any site via 1-line script tag
- ✅ Human takeover: "Talk to a human" button → mode switch → Live Inbox
- ✅ Live Inbox: real-time agent dashboard (postgres_changes + broadcast channels)
- ✅ Agent ↔ visitor messaging via Supabase Realtime
- ✅ Conversation history, mode badges (Bot/Live/Closed), unread counts
- ✅ Handoff alert emails (Resend)
- 📋 Phase 2: visitor tracking, proactive triggers, lead scoring, canned replies

## Integration Points

| Direction | From | To | Data / Event |
|---|---|---|---|
| → | BOO restaurant (knowledge base) | Replyee | Menu, hours, policies, FAQs → uploaded to bot knowledge base |
| → | BOO ordering page | Replyee widget | Script tag embed: `<script src="https://replyee.boommedia.us/widget.js">` |
| ← | Replyee (conversation data) | BOO analytics | Chat volume, handoff rate, common questions → inform menu/FAQ updates |
| → | Replyee (lead capture) | SureContact | Visitor email captured during chat → added to restaurant's email list |

## Cross-Product Links
- **BOO** — primary embed target: Replyee widget lives on BOO ordering pages
- **Signnee** — catering clients who view pricing on Signnee iPad could also use Replyee to ask questions
- **Compliee** — Replyee widget must be ADA-accessible; Compliee widget and Replyee widget coexist on the same page
- **Dashee** — chat analytics (volume, satisfaction, handoff rate) surface in Dashee client dashboards

## Deployment
- **Deploy target:** Vercel (NOT Coolify — Replyee uses serverless, no long-running processes)
- **Exception:** Supabase Realtime for live chat works with Vercel via client-side JS connections
- **Supabase table prefix:** `ry_` (replyee_chatbots, replyee_conversations, replyee_messages, etc.)

## Build Status
- **Code:** ✅ Phase 1 complete (Jun 10, 2026)
- **Deployed:** 🔨 Pending — needs Vercel deploy + Supabase migration 002_live_chat.sql
- **Type-check:** 🔨 In progress (background task)
- **Migration 002:** Written, needs to run on db.boommedia.us
- **Next milestone:** Oct–Nov 2026 (integrate into BOO ordering page per build plan)

## What's Pending for Full Ecosystem Integration
- [ ] Run `migrations/002_live_chat.sql` on db.boommedia.us
- [ ] Deploy to Vercel (`replyee.online`)
- [ ] End-to-end test: widget handoff → inbox → visitor receives agent reply
- [ ] BOO integration: embed Replyee widget on BOO ordering pages (Oct–Nov 2026)
- [ ] Lead capture: pipe visitor emails to SureContact restaurant list
- [ ] Phase 2: visitor_sessions, proactive triggers, lead scoring, canned replies
- [ ] Update BOOM_ECOSYSTEM_MASTER_CONTEXT.md: fix Replyee description from "review management" to "AI chatbot + live chat"
- [ ] Dashee widget: chat analytics → client dashboard

## ⚠️ Ecosystem Doc Correction Needed
The master ecosystem doc (`BOOM_ECOSYSTEM_MASTER_CONTEXT.md` section H) says:
> "Replyee — Unified inbox for Google, Yelp, Instagram, Facebook reviews; sentiment analysis; auto-reply"

**This is wrong.** Replyee is an AI chatbot platform, not a review management tool. The BOOM_ECOSYSTEM_MASTER_CONTEXT.md must be updated before the Sep 15 launch to avoid internal confusion.

*Last updated: 2026-06-13 | Boom Media SaaS Ecosystem*
