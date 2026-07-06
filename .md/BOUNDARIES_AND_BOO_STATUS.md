# Replyee — Boundaries & BOO Status
> **Authoritative as of 2026-07-06.** Supersedes conflicting claims in any older doc in this folder. Canonical ecosystem law: `SaaS/.md/APP_BOUNDARIES.md` · BOO wiring detail: `SaaS/.md/BOO_APPS_INTEGRATION_BRIEF.md` (also at `boo-v2/docs/SAAS_APPS_INTEGRATION_BRIEF.md`).

## Owns
**AI chatbot (RAG) + live chat** — bots trained on business content, widget, agent inbox with human takeover (Supabase Realtime), visitors, leads, canned replies, daily digest cron, Stripe billing.

## Does NOT do (owned elsewhere)
- **Reviews — nothing, ever.** Reviews = Localey. The 'AI reviews' label on BOO's Growth+ card + the review-inbox console were fixed 2026-07-06 (boo-v2 branch ecosystem-cleanup). Old master-context docs archived to .md/_archive/

## BOO integration — current state
THE reference integration: BOO calls /api/portal/replyee/activate + sync-menu; bot does order-status lookup, restaurant-info chunks, directions, 'Order Now' CTAs. Deploys on VERCEL.

## Status / next
Phase 1 committed. Remaining: verify migrations/002_live_chat.sql ran on db.boommedia.us + one E2E handoff test.
