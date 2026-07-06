# Boom Media — Complete Ecosystem Master Context
## For Build Sessions | Last Updated: June 13, 2026

> **Purpose:** This file is the single source of truth for ALL Boom SaaS products, how they integrate, what's built, what's next, and the go-to-market plan. Share this file at the start of any build session to get full context instantly.

---

## 1. WHAT BOOM IS

Boom Media is a **fully-managed restaurant tech company** — we don't sell software, we sell outcomes. Every client gets a human success manager, setup included, and a 10-app SaaS ecosystem. The moat is integration + service, not price.

**Core Product:** Boom Online Ordering (BOO) — commission-free restaurant ordering platform  
**Add-Ons:** 9 additional SaaS tools that extend BOO  
**Standalone:** Servvee.Online — for restaurants that need promos/menus but not ordering  
**Revenue Model:** Monthly recurring ($450–$850/mo BOO) + optional add-ons ($9–$149/mo each)

---

## 2. ALL 10 BOOM SAAS PRODUCTS

### A. Boom Online Ordering (BOO) — Core Platform
**What:** Commission-free online ordering for restaurants  
**Tech:** Vanilla JS/HTML frontend, Node.js API (`web/api/`), Supabase PostgreSQL, Stripe payments  
**Status:** ✅ Live with Guarapos (pilot client)  
**Pricing:**
- Starter: $450/mo + $299 setup
- Growth: $650/mo + $299 setup
- Pro: $850/mo + $299 setup
- Enterprise: Custom

### B. Compliee — ADA/WCAG Compliance
**What:** Accessibility toolbar, compliance monitoring, audit engine, done-for-you remediation  
**Tech:** Next.js, axe-core for scanning, `co_` prefixed Supabase tables  
**Status:** Building (widget live in some tiers; audit engine Sep 2026)  
**Pricing:** FREE in all BOO tiers (widget + monitoring), $149+/project for Done-For-You  
**Integration:** Compliee widget auto-installed on every BOO client ordering page

### C. Rankee — Local SEO
**What:** Local SEO rank tracking, citations, schema markup, Google Maps optimization  
**Tech:** Built (basic version), DataForSEO API integration  
**Status:** Basic included all tiers; Premium add-on building  
**Pricing:** Basic FREE, Premium ~$99–$199/mo add-on

### D. Bloggy — AI Content Marketing
**What:** AI-generated blog posts, content calendar, SEO-optimized restaurant content  
**Status:** Built, integrated  
**Pricing:** Tiered allocation (Starter: 1/mo, Growth: 2/mo, Pro: 3/mo)  
**Integration:** Posts auto-link to BOO ordering page with utm_source=blog

### E. QRcodee — QR Code Management
**What:** Custom QR codes for menus, tables, ordering links, social  
**Status:** Built  
**Pricing:** Tiered allocation (Starter: 3/mo, Growth: 6/mo, Pro: 12/mo)  
**Integration:** QR codes auto-point to BOO ordering URL for each client

### F. Displayee — Digital Signage
**What:** Display live menu on restaurant TVs via Fire TV Stick  
**Tech:** Next.js 15, Supabase Realtime (`di_` prefixed tables), Fire TV / Silk Browser  
**Status:** ✅ Built, beta-testing with Guarapos  
**Pricing:** Starter $9/mo (1 screen), Pro $24/mo (5 screens), Agency $49/mo (20 screens)  
**THE MOAT:** BOO menu price change → Displayee TV updates instantly (no other platform has this)  
**Integration:** BOO menu → Displayee via Supabase Realtime subscription

### G. Addee — Marketing Creative + Social + Print
**What:** AI ad generation, Canva integration, Adobe Express SDK, social scheduling, print-on-demand  
**Tech:** Ayrshare (social scheduler), Printful (print fulfillment), Orshot (print design), Claude API  
**Status:** ✅ Built, in testing  
**Pricing:** Included in BOO Pro ($850); standalone $99/mo  
**Integration:** BOO menu items → ad variations; promos → social posts with UTM links back to ordering page

### H. Replyee — Review Management
**What:** Unified inbox for Google, Yelp, Instagram, Facebook reviews; sentiment analysis; auto-reply  
**Status:** Built, not yet integrated into BOO  
**Pricing:** ~$49–$99/mo add-on (TBD)  
**Integration:** Links customer orders → reviews they left (order → reviewer match)

### I. Signee — In-Store Digital Displays + e-Signatures
**What:** iPad displays for walk-in customers: party contracts, pricing menus, catering packages  
**Status:** Building  
**Pricing:** $29–$99/mo add-on  
**Integration:** Catering menus/pricing pulled from BOO menu system; contracts via DocuSign-style flow

### J. Servvee.Online — Menu & Promotion Designer (Standalone SaaS)
**What:** Standalone SaaS for restaurants that want multi-channel promo publishing WITHOUT the full BOO ordering platform  
**Tech:** Next.js/React, Canva OAuth, Adobe Express SDK, `sv_` prefixed Supabase tables, `promos` + `canva_tokens` tables  
**Status:** Pre-beta (11 tasks remaining), launching Sep 15, 2026  
**Pricing:** Lite $29/mo (2 promo slots), Pro $59/mo (6 slots), Agency custom  
**Key distinction:** NOT the old bail-bond Servvee app. Servvee.Online = restaurant promo/menu design SaaS  
**Integration:** Shares distribution APIs with BOO Promotion Center (build once, use by both)

---

## 3. HOW EVERYTHING INTEGRATES

```
BOO (Core) ─────────────────────────────────────────────────┐
│                                                             │
├── Menu System ──────────────────────────────────────────── ┤
│   ├── Displayee (Supabase Realtime → TV)                   │
│   ├── QRcodee (QR → ordering URL)                          │
│   └── Servvee/Promotion Center (publish menu promos)       │
│                                                             │
├── Customer Data ──────────────────────────────────────────── ┤
│   ├── SureContact (email lists per restaurant)             │
│   ├── Replyee (match orders → reviews)                     │
│   └── Bloggy (content → drives new customers)             │
│                                                             │
├── Marketing Distribution ─────────────────────────────────── ┤
│   ├── SureContact email (already live)                     │
│   ├── Google My Business API (building Aug 3)              │
│   ├── Meta Graph API / Instagram (building Aug 17)         │
│   ├── LinkedIn Share API (building Aug 17)                 │
│   └── Website embed (already live)                         │
│                                                             │
├── Analytics & Attribution ────────────────────────────────── ┤
│   ├── utm_campaign=[promo_id] on all links                 │
│   ├── orders table → source_promo_id column                │
│   ├── promo_analytics table (views, clicks, orders)        │
│   └── ROI = attributed_revenue / 0 cost                   │
│                                                             │
└── Compliance & Trust ─────────────────────────────────────── ┤
    ├── Compliee (widget auto on all ordering pages)         │
    ├── Rankee (schema markup on ordering pages)             │
    └── Signee (contracts + ADA for catering clients)        │
```

### Shared Distribution API (Built Once, Used by Servvee + BOO)
```
/api/portal/publish/
├── google-business.js    ← Post to Google Maps listing
├── email.js              ← SureContact segmented send
├── social.js             ← LinkedIn + Instagram
└── all-channels.js       ← Orchestrator (calls all above)
```

### Single Database (All Apps Share One Supabase)
- Host: `db.boommedia.us` (self-hosted on DigitalOcean)
- BOO tables: `restaurants`, `menu_items`, `orders`, `customers`, `restaurant_settings`
- Per-app prefixes: `di_` (Displayee), `co_` (Compliee), `sv_` (Servvee), `si_` (Signee)
- Shared identity: `users.id` UUID is the cross-app key
- BOO uses `client_id` (text) as tenant key; SaaS apps use `users.id` UUID

---

## 4. TIER STRUCTURE (What Each Client Gets)

| Feature | Starter $450 | Growth $650 | Pro $850 | Enterprise |
|---------|-------------|-------------|----------|------------|
| Ordering system | ✅ | ✅ | ✅ | ✅ |
| Stripe payments | ✅ | ✅ | ✅ | ✅ |
| Menu management | ✅ | ✅ | ✅ | ✅ |
| Customer accounts | ✅ | ✅ | ✅ | ✅ |
| SureContact email (order confirmations) | ✅ | ✅ | ✅ | ✅ |
| Portal + Admin | ✅ | ✅ | ✅ | ✅ |
| Compliee widget + statement | ✅ | ✅ | ✅ | ✅ |
| Rankee Basic (SEO) | ✅ | ✅ | ✅ | ✅ |
| Bloggy | 1/mo | 2/mo | 3/mo | Unlimited |
| QRcodee | 3/mo | 6/mo | 12/mo | Unlimited |
| Promotion Center (email + Google) | ❌ | ✅ | ✅ | ✅ |
| Compliee monitoring | ❌ | ✅ | ✅ | ✅ |
| Promotion Center (LinkedIn + Instagram) | ❌ | ❌ | ✅ | ✅ |
| Addee (marketing creative) | ❌ | ❌ | ✅ | ✅ |
| AI upsells + chat | ❌ | ❌ | ✅ | ✅ |
| Compliee full audit + remediation | ❌ | ❌ | ✅ | ✅ |
| Delivery zones | ❌ | ❌ | ✅ | ✅ |
| Loyalty/rewards | ❌ | ❌ | ✅ | ✅ |
| White-label portal | ❌ | ❌ | ❌ | ✅ |

### Optional Add-Ons (Any Tier)
| Add-On | Price | Notes |
|--------|-------|-------|
| Displayee Starter | $9/mo | 1 TV screen |
| Displayee Pro | $24/mo | 5 screens |
| Displayee Agency | $49/mo | 20 screens |
| Replyee | ~$75/mo | Review management |
| Rankee Premium | ~$149/mo | Advanced local SEO |
| Signee | $29–$99/mo | Catering contracts + iPad displays |
| Compliee Done-For-You | $149+/project | Professional remediation |

### Servvee.Online (Standalone — Not a BOO Add-On)
| Tier | Price | Promo Slots | For |
|------|-------|-------------|-----|
| Lite | $29/mo | 2 | Design-only restaurants |
| Pro | $59/mo | 6 | Active promo users |
| Agency | Custom | Unlimited | White-label / franchise |

---

## 5. KEY TECHNICAL DECISIONS (Don't Revisit These)

1. **Email = SureContact** (not Resend, not Mailchimp). Already integrated at `web/api/_lib/surecontact.js`. 241 Guarapos contacts ready. Resend is only legacy fallback.
2. **Payments = Stripe** (not Square — dropped entirely). Live with card, Apple Pay, Google Pay.
3. **Database = Self-hosted Supabase** on DigitalOcean VPS at `db.boommedia.us`. NOT Supabase cloud.
4. **Frontend = Vanilla JS/HTML** for BOO portal + ordering pages (not React). Intentional — no build step, fast deploys.
5. **Servvee.Online = React/Next.js** (separate codebase, separate domain).
6. **Hosting = Vercel** for static/API (auto-deploy on push). DigitalOcean for Supabase + Displayee.
7. **Social API = Direct** (not Ayrshare) for BOO Promotion Center. Ayrshare is for Addee's scheduling feature.
8. **OAuth storage** = `restaurant_settings` table (JSONB column per provider: `google_oauth`, `meta_oauth`, `linkedin_oauth`).
9. **Mobile = PWA first**, Capacitor wrapper for native iOS/Android (built, not yet submitted to App Store).
10. **AI = Claude API** (claude-haiku-4-5 for upsells/chat, sonnet-4-6 for menu generation, vision features).

---

## 6. CURRENT FILE STRUCTURE (Key Paths)

```
Boom Online Ordering/
├── web/
│   ├── api/                          ← Node.js API (deployed to Vercel Functions)
│   │   ├── _lib/
│   │   │   ├── surecontact.js        ← Email API (working)
│   │   │   ├── supabase.js           ← DB client
│   │   │   └── stripe.js             ← Payments
│   │   ├── portal/                   ← Portal API endpoints
│   │   └── ...
│   └── public/
│       ├── index.html                ← Marketing website homepage
│       ├── pricing-tiers.html        ← Pricing page (NEEDS UPDATE for ecosystem)
│       ├── portal/                   ← Restaurant owner portal (HTML)
│       │   ├── index.html            ← Portal dashboard
│       │   ├── menu.html             ← Menu management
│       │   └── orders.html           ← Live orders
│       └── admin/                    ← Boom admin panel
│
├── .md/                              ← Strategy & planning docs
│   ├── BOOM_ECOSYSTEM_MASTER_CONTEXT.md   ← THIS FILE
│   ├── MASTER_BUILD_PLAN_JUN2026.md       ← 14-week build plan
│   ├── BOOM_SERVICES_INVENTORY.md         ← Full services list
│   ├── BOOM_SAAS_TIER_BREAKDOWN.md        ← All 10 products × 4 tiers
│   ├── SERVVEE_PROMOTION_HUB_SPEC.md      ← Multi-channel distribution spec
│   ├── CONSOLIDATION_ANALYSIS.md          ← BOO vs Servvee strategic decision
│   └── DISPLAYEE.md                       ← Displayee full spec
│
├── html/                             ← Reference HTML dashboards (not deployed)
│   ├── BOOM_MASTER_ECOSYSTEM.html         ← NEW: Complete interactive dashboard
│   ├── BOOM_ECOSYSTEM_DASHBOARD.html      ← Pricing + integrations view
│   └── BOOM_COMPLETE_SAAS_ECOSYSTEM.html  ← All products + customer examples
│
└── client-sites/
    └── guarapos/                     ← Guarapos pilot client
```

---

## 7. WHAT'S BUILT vs BUILDING vs PLANNED

### ✅ LIVE & TESTED
- BOO ordering, menu, customers, portal, admin
- Stripe payments (card, Apple Pay, Google Pay)
- SureContact email (order confirmations, 241 contacts)
- Displayee digital signage (beta with Guarapos)
- Addee marketing creative + social (in testing)
- Compliee widget + accessibility statement
- Auth hardening (RLS + signed tokens, Jun 9)
- Signup/onboarding flow (pending → SureContact → Google Calendar)
- AI menu generator (awaiting deployment)
- SEO cluster (7 blog/comparison pages live)
- Kitchen printer (QZ Tray + Rongta RP820)
- PWA + Capacitor mobile (built, not yet submitted)

### 🚀 LAUNCHING SEP 15, 2026
- Servvee.Online (Lite + Pro tiers)
- BOO Promotion Center (Growth tier: email + Google; Pro tier: all 4 channels)
- Google My Business API integration
- Meta Instagram Graph API integration
- LinkedIn Share API integration
- Multi-channel analytics + order attribution
- Compliee audit engine + monitoring
- Supabase migrations 029, 030, 031

### ⏳ POST-LAUNCH (Oct–Dec 2026)
- Displayee live menu sync deep integration (Oct)
- Replyee review management widget in BOO (Oct–Nov)
- Rankee Premium add-on (Nov–Dec)
- Compliee Done-For-You remediation service (Q4)
- Signee catering contracts + iPad displays (Q4)
- White-label portal (Q4)
- App Store submission (iOS + Android)

---

## 8. DATABASE MIGRATIONS NEEDED

### Migration 029: Promo Campaigns
```sql
-- Extends promos table for multi-channel publishing
ALTER TABLE promos ADD COLUMN IF NOT EXISTS publish_status JSONB DEFAULT '{}';
-- { google: 'pending'|'published'|'failed', email: '...', instagram: '...', linkedin: '...' }
ALTER TABLE promos ADD COLUMN IF NOT EXISTS publish_results JSONB DEFAULT '{}';
ALTER TABLE promos ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE promos ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS promo_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID REFERENCES promos(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'google'|'email'|'instagram'|'linkedin'|'website'
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  attributed_orders INT DEFAULT 0,
  attributed_revenue NUMERIC(10,2) DEFAULT 0,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE
);
```

### Migration 030: Allocation Tracking + OAuth Tokens
```sql
-- Track tier allocations (Bloggy posts/mo, QRcodes/mo)
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS tier_allocations JSONB DEFAULT '{}';
-- { bloggy: { limit: 2, used: 0, reset_date: '2026-07-01' }, qrcodee: { limit: 6, used: 3 } }

-- OAuth tokens for distribution channels
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS google_oauth JSONB DEFAULT NULL;
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS meta_oauth JSONB DEFAULT NULL;
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS linkedin_oauth JSONB DEFAULT NULL;
-- Each: { access_token, refresh_token, expires_at, account_id }
```

### Migration 031: Order Attribution
```sql
-- Track which promo drove which order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_promo_id UUID REFERENCES promos(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_channel TEXT; -- 'email'|'google'|'instagram'|'linkedin'|'website'|'direct'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_utm TEXT; -- raw utm_campaign value
```

---

## 9. NEW API ENDPOINTS TO BUILD

### Track 1: Distribution APIs (Aug 3 – Aug 30)

**Week 1 (Aug 3–9): Google Business API**
```
web/api/_lib/google-business-oauth.js     ← OAuth flow
web/api/_lib/google-business-api.js       ← Post/update Google listings
web/api/portal/auth/google-business.js    ← /api/portal/auth/google-business
web/api/portal/publish/google-business.js ← /api/portal/publish/google-business
web/api/portal/settings/integrations.js   ← GET/POST integration settings
```

**Week 2 (Aug 10–16): SureContact Email**
```
web/api/portal/publish/email.js           ← /api/portal/publish/email
-- Extends existing surecontact.js with promo segments
-- Segments: 'all', 'vip', 'repeat', 'inactive'
-- SC_TEMPLATE_PROMO_LIMITED, SC_TEMPLATE_PROMO_SEASONAL, SC_TEMPLATE_PROMO_WEEKLY
```

**Week 3 (Aug 17–23): Social APIs**
```
web/api/_lib/social-oauth.js              ← Meta + LinkedIn OAuth
web/api/_lib/meta-api.js                  ← Instagram Graph API
web/api/_lib/linkedin-api.js              ← LinkedIn Share API
web/api/portal/auth/social.js             ← /api/portal/auth/social (Meta + LinkedIn)
web/api/portal/publish/social.js          ← /api/portal/publish/social
```

**Week 4 (Aug 24–30): Analytics + Orchestrator**
```
web/api/portal/publish/all-channels.js    ← Orchestrator
web/api/portal/analytics/promos.js        ← Analytics aggregation
```

### Track 3: BOO Promotion Center UI (Aug 3 – Sep 7)
```
web/public/portal/promotion-center/
├── index.html                            ← Main promo creation UI
├── publish-modal.html                    ← Channel selector + status
└── analytics.html                        ← Views/clicks/orders dashboard
web/public/portal/settings/integrations.html  ← Connect Google/Meta/LinkedIn
```

---

## 10. THIRD-PARTY API CREDENTIALS NEEDED

| Service | What For | Status | Notes |
|---------|---------|--------|-------|
| Google Cloud OAuth | My Business API | ❌ Need to get | Enable "Google My Business API" in Cloud Console |
| Meta Business | Instagram Graph API | ❌ Need to get | Requires Business Account (not Creator) |
| LinkedIn Developer | Share API | ❌ Need to get | Rate limit: 1 post/day per company page |
| SureContact | 3 promo email templates | ❌ Need UUIDs | Log in, create templates, save UUIDs to .env |
| Stripe | Payments | ✅ Live | Already configured |
| Claude API | AI features | ✅ Live | `ANTHROPIC_API_KEY` in .env |
| Supabase | Database | ✅ Live | Self-hosted at db.boommedia.us |

**Environment variables to add:**
```
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://boomonlineordering.com/api/auth/google/callback
META_APP_ID=
META_APP_SECRET=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_COMPANY_ID=
SC_TEMPLATE_PROMO_LIMITED=
SC_TEMPLATE_PROMO_SEASONAL=
SC_TEMPLATE_PROMO_WEEKLY=
```

---

## 11. WEBSITE UPDATES NEEDED

### `web/public/pricing-tiers.html` (CRITICAL — UPDATE BEFORE SEP 15)
Current state: Shows BOO-only tiers  
Needs to show: All 10 products, full ecosystem tiers, allocation table, add-ons pricing, Servvee.Online mention

### `web/public/index.html` (Homepage)
Needs: Add ecosystem section showing all integrated tools, update hero messaging to lead with the ecosystem angle

### New pages to create:
- `web/public/solutions.html` — Use-case landing pages (catering, QSR, fine dining, franchise)
- `web/public/integrations.html` — Show all 10 tools + third-party integrations
- Servvee.Online gets its own site at `servvee.online` (separate codebase)

---

## 12. REVENUE MODEL & PROJECTIONS

### Per-Client Revenue Examples
| Scenario | Monthly | Annual |
|----------|---------|--------|
| Starter only | $450 | $5,400 |
| Growth + Displayee | $659 | $7,908 |
| Pro + Displayee + Replyee | $974 | $11,688 |
| Pro + all add-ons | $1,083 | $12,996 |

### Portfolio Projections (Q4 2026 — 25–30 clients)
| Revenue Stream | Annual |
|---------------|--------|
| BOO tiers (25–30 clients × avg $650) | $195K–$234K |
| Add-ons (30–40% adoption) | $17K–$35K |
| Servvee.Online (15–20 customers × avg $44) | $7K–$11K |
| **TOTAL** | **$219K–$280K/year** |

### Unit Economics
- Infrastructure cost: ~$72/mo (DigitalOcean VPS)
- Vercel: $20/mo
- Third-party APIs: ~$50/mo (Claude, Ayrshare, etc.)
- **Total infra: ~$142/mo**
- **Gross margin at 25 clients × $650:** ~97%

---

## 13. LAUNCH TIMELINE

```
Jun 13–20:  Get OAuth credentials + create SureContact templates
Jun 20–Jul 11: Update pricing page, write help articles, run DB migrations
Aug 3:      🚀 Development kickoff (3 parallel tracks)
Aug 3–9:    Track 1 Week 1 — Google Business OAuth + API
Aug 10–16:  Track 1 Week 2 — SureContact email promo distribution
Aug 17–23:  Track 1 Week 3 — LinkedIn + Instagram OAuth + posting
Aug 24–30:  Track 1 Week 4 — Analytics infrastructure
Aug 3–Sep 7: Track 2 — Servvee.Online UI + multi-channel publishing
Aug 3–Sep 7: Track 3 — BOO Promotion Center portal pages
Sep 8–14:   QA, beta with Guarapos, launch prep
Sep 15:     🎉 LAUNCH — Servvee.Online + BOO Promotion Center go live
Oct–Nov:    Displayee live sync + Replyee integration
Nov–Dec:    Rankee Premium + Compliee Done-For-You + Signee
```

---

## 14. PILOT CLIENT: GUARAPOS

**Client:** Guarapos Cuban Restaurant (Healing Arts & Wellness location)  
**Contact:** `manage@guarapos` (portal login)  
**Status:** Live on BOO, Displayee beta, 241 SureContact contacts  
**Use case:** Test all new features (Promotion Center, Compliee, analytics) before wider rollout  
**SureContact workspace:** Guarapos-specific workspace with full contact list  
**Notes:**
- Rongta RP820 printer configured (QZ Tray, network IP setup)
- GCC website integration in progress (`guarapos-test` client-site folder)
- 241 contacts ready for first email promo blast

---

## 15. HOW TO USE THIS FILE IN BUILD SESSIONS

**When starting a new build session, say:**
> "Read `.md/BOOM_ECOSYSTEM_MASTER_CONTEXT.md` to understand the full ecosystem before we build [specific feature]"

**Then specify what you're building:**
- "Build `web/api/_lib/google-business-oauth.js`" → See sections 6 + 9 for file path + spec
- "Update the pricing page" → See section 11 for what needs to change
- "Add Displayee add-on upsell in the portal" → See sections 3 + 6 for integration points
- "Create Supabase migration 029" → See section 8 for exact SQL
- "Build the BOO Promotion Center UI" → See section 9 Track 3 for file list

**Key files to read first in any session:**
1. This file (`BOOM_ECOSYSTEM_MASTER_CONTEXT.md`)
2. `MASTER_BUILD_PLAN_JUN2026.md` for week-by-week task assignments
3. The relevant spec file for what you're building

---

*Created: June 13, 2026 | Owner: Eric Boom Media | Session: Ecosystem Integration Planning*
