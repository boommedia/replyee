# Boom Online Ordering — Add-On Ecosystem

**Vision:** BOO is the core platform. Add-ons let restaurants extend capabilities without complexity.

**Status:** Planning integration points  
**Date:** June 13, 2026

---

## The BOO Core + Add-On Model

```
Boom Online Ordering (Core)
├─ Starter ($450/mo)
│  ├─ Ordering system
│  ├─ Stripe payments
│  ├─ **Compliee: ADA compliance (FREE)**
│  └─ **Compliee: Widget + Statement**
├─ Growth ($650/mo)
│  ├─ Everything in Starter
│  ├─ Promotion Center (lite: email + Google)
│  ├─ **Compliee: Widget + Statement + Audit**
│  └─ **Compliee: Monitoring (weekly scans)**
└─ Pro ($850/mo)
   ├─ Everything in Growth
   ├─ Promotion Center (full: all channels + LinkedIn + Instagram)
   ├─ Addee (included)
   ├─ AI upsells + Daily Insights
   ├─ **Compliee: Full (Widget + Statement + Audit + Monitoring + Remediation guidance)**
   └─ Delivery zones

Add-Ons (Optional, all tiers):
├─ Displayee — Digital signage ($9–$99/mo)
├─ Replyee — Review management ($TBD/mo)
├─ Rankee Premium — Advanced SEO ($TBD/mo)
├─ Compliee Done-For-You Remediation — Full site fixes ($149+/project)
└─ Printful — Print fulfillment (per-order cost)

**Compliee Special:** Included in all BOO tiers (no separate charge) as legal protection
```

---

## Add-On Details & Pricing

### 0. Compliee — ADA Compliance (FREE in all tiers)

**What It Does:**
- ADA/WCAG 2.1 AA compliance certification
- Accessibility widget (contrast modes, text resize, readable fonts, screen reader helpers)
- Auto-generates accessibility statement page
- Weekly audits (scans for violations)
- Alerts when new accessibility issues detected
- Remediation guidance (Pro tier)
- Done-for-you full remediation (Enterprise)

**Why It's Free in BOO:**
1. **Legal Protection:** Restaurants are increasingly sued for ADA violations. Compliee reduces risk.
2. **Competitive Moat:** No other ordering platform offers built-in ADA compliance. This is a differentiator vs. GloriaFood, Toast, Square, etc.
3. **Honest Positioning:** Unlike overlay-only tools, Compliee combines widget + real auditing + remediation. It's defensible in court.
4. **Recurring Revenue Multiplier:** Compliee + Displayee + Addee + Replyee = higher stickiness, harder to churn.

**Pricing Structure:**
- **Starter ($450):** Widget + Statement (passive protection)
- **Growth ($650):** Widget + Statement + Monitoring (active protection)
- **Pro ($850):** Widget + Statement + Monitoring + Remediation Guidance (proactive protection)
- **Optional:** Done-For-You Remediation (+$149/project) for any tier

**Integration with BOO:**
- ✅ Single sign-on (Compliee uses BOO account)
- ✅ One invoice (no separate billing)
- ✅ Auto-audit BOO ordering page (included)
- ✅ Dashboard widget showing compliance score
- ✅ Alerts when a new issue detected
- ✅ Feature flags by tier (Starter sees widget, Pro sees monitoring alerts)

**Marketing Message:**
> "Boom Online Ordering keeps your restaurant legally compliant. Every tier includes ADA accessibility monitoring and widget. Protect your business from accessibility lawsuits while you grow."

**Business Model Note:**
Compliee can also be sold standalone ($49–$149/mo for non-BOO restaurants). But BOO customers get it free as part of "Boom takes care of everything" positioning.

---

### 1. Displayee — Digital Signage ($9–$99/mo)

**What It Does:**
- Display menu on restaurant TVs (via Fire TV Stick)
- **Live sync:** Update price in BOO → TV updates instantly (THE MOAT)
- Time-based scheduling (breakfast/lunch/dinner menus)
- Weather, clock, scrolling text widgets
- AI menu extraction (photo → menu board)

**Pricing Tiers:**
| Plan | Price | Screens | Best For |
|------|-------|---------|----------|
| Starter | $9/mo | 1 | Single-location |
| Pro | $24/mo | 5 | Multi-location |
| Agency | $49/mo | 20 | Franchise |

**Integration with BOO:**
- ✅ Live menu sync (BOO `menu_items` → Displayee `di_menu_items`)
- ✅ Out-of-stock sync (pause items in BOO → gray out on TV)
- ✅ Price updates sync (change price once → website + TV + ordering all update)
- ✅ Single login (Displayee uses same BOO account)
- ✅ Unified billing (one invoice, one dashboard)

**Upsell Path:**
- BOO Growth customer → notices menu changing frequently → needs TV board → add Displayee Starter ($9/mo)
- BOO Pro + Displayee Starter → restaurant expands to 2 locations → upgrades to Displayee Pro ($24/mo)

**Installation:** 15 minutes
1. Buy Fire TV Stick ($30 one-time)
2. Open Silk Browser → displayee.online/tv
3. Enter 6-digit code → linked to BOO account
4. Done. Displays BOO menu in real-time.

---

### 2. Addee — Marketing Creative + Social ($99/mo, included in Pro)

**What It Does:**
- Design ads, graphics, social posts (AI-powered)
- Auto-post to LinkedIn, Instagram, Facebook (via Ayrshare)
- Print ads via Orshot
- Print-on-demand (t-shirts, posters) via Printful

**Pricing:**
- **Included in BOO Pro** ($850/mo)
- Standalone (if purchased with Growth): $99/mo
- Standalone (if not BOO customer): $149/mo

**Integration with BOO:**
- ✅ Auto-pull menu items → create ad variations
- ✅ Promo sync (Servvee promos → Addee ad templates)
- ✅ Social posting (link back to ordering page with utm_campaign)

**Upsell Path:**
- BOO Growth ($650) → restaurant wants to run ads → add Addee ($99) → total $749
- OR upgrade to BOO Pro ($850) → Addee included

---

### 3. Replyee — Review Management ($TBD/mo)

**What It Does:**
- Unified dashboard for Google, Yelp, Instagram DMs, Facebook messages
- Reply to reviews without leaving dashboard
- Sentiment analysis + insights
- Auto-response templates

**Pricing:** TBD (estimated $49–$99/mo based on competitors)

**Integration with BOO:**
- ✅ Link orders → reviews ("Customer ordered tacos, left 5-star review")
- ✅ Integrate with SureContact (tag customers who leave good reviews)
- ✅ Dashboard widget (latest review + response CTA)

---

### 4. Rankee Premium — Advanced SEO ($TBD/mo)

**What It Does:**
- Local SEO optimization
- Citation building + backlink tracking
- Rank tracking vs. competitors
- Keyword strategy reports

**Pricing:** TBD (estimated $99–$199/mo)

**Integration with BOO:**
- ✅ Auto-generate meta tags from menu
- ✅ Schema markup (restaurants, menu items, hours)
- ✅ Local pack optimization (Google Maps visibility)

---

## Pricing Tiers: Revised (with Compliee Free + Add-Ons)

### Boom Online Ordering + Add-Ons Strategy

```
STARTER RESTAURANTS ($450–$550/mo)
├─ BOO Starter ($450/mo)
│  ├─ Ordering + payments
│  ├─ Compliee: Widget + Statement (FREE)
│  └─ Optional: Displayee Starter (+$9/mo) = $459 total
└─ Suitable for: 1-location, simple operations
└─ Legal Protection: ✅ ADA-compliant (widget + statement)

GROWTH RESTAURANTS ($650–$850/mo)
├─ BOO Growth ($650/mo)
│  ├─ Ordering + Promotion Center (lite)
│  ├─ Compliee: Widget + Statement + Monitoring (FREE)
│  ├─ Optional: Addee (+$99/mo) = $749 total
│  ├─ Optional: Displayee Pro (+$24/mo) = $674 total
│  └─ Optional: Replyee (+$75/mo) = $725 total
└─ Suitable for: Multi-location, active promotion
└─ Legal Protection: ✅ ADA-compliant (monitoring checks for regressions)

PRO RESTAURANTS ($850–$1,100+/mo)
├─ BOO Pro ($850/mo) [includes Addee]
│  ├─ Ordering + Promotion Center (full)
│  ├─ Addee (marketing creative + social)
│  ├─ Compliee: Full suite (Widget + Statement + Audit + Monitoring + Remediation guidance) (FREE)
│  ├─ Optional: Displayee Pro (+$24/mo) = $874 total
│  ├─ Optional: Replyee (+$75/mo) = $925 total
│  ├─ Optional: Rankee Premium (+$149/mo) = $999 total
│  └─ Optional: Compliee Done-For-You Remediation (+$149+/project)
└─ Suitable for: Full-service, competitive market
└─ Legal Protection: ✅ ADA-compliant (real remediation guidance, not just scanning)

ENTERPRISE RESTAURANTS ($2,000+/mo)
├─ BOO Enterprise (custom)
├─ All add-ons included or custom pricing
├─ Dedicated account manager
├─ White-label options
├─ Compliee: Done-for-you full remediation included
└─ Suitable for: Franchise, multi-brand operator
└─ Legal Protection: ✅ ADA-compliant (ongoing managed remediation)
```

---

## Customer Journey: The Expansion Path

### Path 1: Steady Growth (Most Common)
```
Month 1: Subscribe to BOO Growth ($650/mo)
         ↓ "Menu updates are annoying — need a TV board"
Month 3: Add Displayee Starter (+$9/mo) = $659/mo
         ↓ "Restaurant 2 opening next month"
Month 6: Upgrade to BOO Enterprise ($2,000/mo) + Displayee Pro ($24/mo)
         ↓ "Need to compete on social media"
Month 9: Add Replyee (+$75/mo) = $2,099/mo
         ↓ "We're killing it, let's go full digital"
Month 12: Add Rankee Premium (+$149/mo) = $2,248/mo

Annual Revenue Progression: $7,800 → $26,980
Customer LTV: $26,980 (year 1) + renewals
```

### Path 2: "Go Big Immediately"
```
Month 1: Subscribe to BOO Pro ($850/mo)
         ↓ "Includes Addee, get social ads started"
Month 1: Add Displayee Pro (+$24/mo) = $874/mo
         ↓ "4 locations, need multiple TV boards"
Month 1: Add Replyee (+$75/mo) = $949/mo
         ↓ "Handle our Google/Yelp reputation"

First-month revenue: $949/mo = $11,388/year
```

---

## Integration Points: BOO → Add-Ons

### Displayee Integration (THE MOAT)

**Live Menu Sync:**
```
Restaurant updates BOO menu
        ↓
BOO API broadcasts: "menu_item_id=123, price=$12.99, in_stock=true"
        ↓
Displayee Realtime subscription receives update
        ↓
TV updates instantly (no refresh, no delay)
        ↓
Customer sees new price on menu board, orders at that price
```

**Technical Implementation (Post-BOO Beta):**
1. Add webhook in BOO: POST to Displayee when menu changes
2. Displayee subscribes to Supabase Realtime on `menu_items` table
3. When update received, push to Fire TV Stick via WebSocket
4. TV refreshes menu board (animation, not jarring)

**Feature Flags in BOO Portal:**
- Settings → Connected Apps → Displayee
- Toggle: "Sync menu to Displayee?" (default ON for Pro tier)
- Show: "3 screens syncing" (count of active Displayee devices)

### Addee Integration (Promo to Social)

**Promo → Ad Flow:**
```
Restaurant publishes promo in Servvee/BOO
        ↓
Optional: "Also create social ad?" → Addee modal
        ↓
Addee generates ad variations (headline, image, CTA)
        ↓
Restaurant selects design
        ↓
Auto-post to LinkedIn + Instagram (+ include BOO embed link)
        ↓
Analytics: Track clicks back to ordering page (utm_campaign=promo_id)
```

**Feature Flags in BOO Portal:**
- Promotions → Publish → "Also post to social?" checkbox
- Clicking checkbox opens Addee design wizard
- On publish, Addee creates post + auto-posts

### Replyee Integration (Review Sentiment)

**Review Dashboard in BOO:**
```
BOO Portal → Dashboard → Widget: "Latest Reviews"
├─ Google review: ★★★★★ "Best tacos in town!"
├─ Yelp review: ★★★☆☆ "Food was cold"
└─ Instagram DM: "Do you do catering?"

Click "Reply" → opens Replyee dashboard (unified inbox)
```

### Rankee Integration (Local SEO)

**Dashboard Widget:**
```
BOO Portal → Dashboard → Widget: "Local Visibility"
├─ Ranking for "tacos near me": #2 (was #5 last month) ↑
├─ Ranking for "Cuban restaurant Miami": #7 (competitor is #3)
└─ Citations: 12/15 consistent (missing address in 3 places)

Click "Improve" → opens Rankee full report
```

---

## Marketing Strategy: Add-On Upsells

### Onboarding Flow (New BOO Customer)

**Week 1:** Setup ordering (storefront, menu, payment)  
**Week 2:** First order! Email: "Congrats on your first order" + featured add-on  
**Week 3:** Email: "5 restaurants in your area use Displayee + BOO. See how they sync menus."  
**Week 4:** Email: "Need help with social media? Addee auto-creates ads from your menu."  

### In-App Prompts (Contextual Upsells)

**Scenario 1: Restaurant updates menu frequently**
```
BOO Portal → Menu → (user changes price for 5th time in a week)
Prompt: "Tip: Sync your menu to a TV board. Displayee keeps it live."
Button: "Learn about Displayee" → product page + $9/mo CTA
```

**Scenario 2: Restaurant publishes promo**
```
Promotion → Publish
Modal: "Also post to social?" → Addee CTA ($99/mo or included in Pro)
```

**Scenario 3: Low Google reviews**
```
Dashboard widget: "Your Google reviews: 4.2★ (3 reviews)"
Button: "Get more reviews → Replyee helps you respond faster"
```

---

## Pricing Psychology: The Add-On Stack

**Base BOO Pro:** $850/mo feels expensive  
**BOO Pro + Displayee + Replyee + Rankee:** $1,148/mo feels less scary as add-ons  
→ **Result:** Customer pays more because they see incremental value, not sticker shock

**Bundling Discounts (Optional):**
- BOO Pro + Displayee + Replyee + Rankee: $1,080/mo (vs. $1,148) = 6% discount
- Encourages customers to adopt full stack

---

## Success Metrics (By Dec 31, 2026)

### Adoption
- 30% of BOO Growth customers add at least 1 add-on
- 50% of BOO Pro customers add at least 1 add-on
- Average add-ons per customer: 1.2

### Revenue Impact
- Base BOO revenue: $108K–$300K (25–30 customers × $450–$850)
- Add-on revenue: $35K–$75K (Displayee, Replyee, Rankee)
- **Total:** $143K–$375K (vs. $108K–$300K without add-ons)
- **Lift:** +33% revenue per customer

### Customer Satisfaction
- NPS for BOO alone: 8/10
- NPS for BOO + 2+ add-ons: 9/10 (more features, more stickiness)
- Churn rate with add-ons: 2% (vs. 5% without)

---

## Go-to-Market: Add-Ons Launch (Sep 2026)

### Week 1: Internal Enablement
- [ ] Sales training (which add-on for which customer type?)
- [ ] Pricing page updated (feature matrix)
- [ ] Help center articles (Displayee setup, Addee workflow, etc.)

### Week 2–3: Beta Customer Outreach
- [ ] Email Guarapos: "We've built add-ons. Want to test Displayee?"
- [ ] Show live demo (menu sync in real-time)
- [ ] Offer free trial for 3 months

### Week 4: Public Launch
- [ ] Marketing email: "Introducing Boom Add-Ons" (Displayee, Addee, Replyee, Rankee)
- [ ] Blog post: "The Complete Restaurant Tech Stack" (BOO + add-ons)
- [ ] Pricing page: Feature matrix (which add-on for which need?)
- [ ] Launch in-app prompts (contextual upsells)

### Month 2–3: Content Marketing
- [ ] "Why restaurants need digital signage" → Displayee
- [ ] "Restaurant marketing mistakes" → Addee
- [ ] "Competing on Google reviews" → Replyee
- [ ] "Local SEO for restaurants" → Rankee

---

## Feature Dependencies: What Needs to Be Built First

### Must-Have Before Add-On Launch

- ✅ BOO core (ordering, menu, payments) — DONE
- ✅ Promotion Center (email + Google distribution) — DONE by Sep 2026
- 🔄 Displayee live menu sync — BUILD POST-BETA (Sep–Oct)
- 🔄 Addee integration (promo → ad) — BUILD POST-BETA
- 🔄 In-app prompts (contextual upsells) — BUILD POST-BETA

### Nice-to-Have (Q4 2026)

- Replyee integration (review dashboard widget)
- Rankee integration (SEO widget)
- Bundle pricing / discounts

---

## Summary: The Boom Ecosystem

```
Restaurant subscribes to BOO ($450–$850/mo)
        ↓
**Included at signup (no extra cost):**
├─ Compliee: ADA compliance (widget + statement) ✅
├─ Email: SureContact integration ✅
└─ Promotion Center: At least basic tier ✅
        ↓
Sees dashboard with 5 add-on recommendations
        ↓
"Oh, we need a menu board" → Add Displayee ($9/mo)
"Our social media sucks" → Consider BOO Pro (includes Addee) or add standalone ($99/mo)
"Google reviews are killing us" → Add Replyee ($75/mo)
"We're not ranking locally" → Add Rankee Premium ($149/mo)
"We want full ADA audit + remediation" → Compliee Done-For-You (+$149/project)
        ↓
Customer progression:
├─ Month 1: BOO Growth ($650) + Compliee (free)
├─ Month 3: Add Displayee Starter (+$9) = $659
├─ Month 6: Upgrade BOO Pro ($850, includes Addee) = $850
├─ Month 9: Add Replyee (+$75) = $925
└─ Month 12: Add Rankee Premium (+$149) = $1,074

Annual Revenue:
├─ Year 1: $10,788 (average weighted)
└─ Lifetime Value: $35K+ (assuming 3-year retention)
```

**The Strategy:**
1. **Free compliance (Compliee)** removes legal risk, builds trust, increases stickiness
2. **Included features** (Promotion Center, email, ordering) give immediate ROI
3. **Optional add-ons** let customer expand as they grow (no feature lock-in)
4. **Deep integrations** (live menu sync with Displayee, promo→ad with Addee) justify premium pricing

Result: Restaurants can't imagine running without Boom. Churn < 3%. NPS = 9/10.

---

*Last Updated: June 13, 2026*  
*Status: Ready for Sep 2026 launch*

