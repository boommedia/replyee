# BOO × Replyee Integration Spec
> **For:** Boom Online Ordering team  
> **Status:** Ready to build — Replyee side complete  
> **Last Updated:** 2026-06-13  

---

## Overview

Replyee is Boom's AI chat + live agent platform. This integration embeds a Replyee chat widget on every BOO restaurant ordering page. The bot answers menu/support questions 24/7 using the restaurant's own menu data. When a visitor clicks "Talk to a human," it opens a live agent session in the Replyee Live Inbox and sends the restaurant owner an email alert.

When an order is placed, BOO fires a webhook to Replyee so the agent can see the order in the inbox and proactively follow up with the patron while they're still on the site.

**Three use cases covered by this integration:**
1. **Support** — bot answers menu, hours, allergen, and catering questions
2. **Sales** — bot knows the full menu (auto-ingested from BOO) and can upsell/answer "what's good?"
3. **Live patron chat** — "Talk to a human" routes to the restaurant's Live Inbox in real time

---

## Architecture

```
BOO Ordering Page
    ↓  loads
Replyee Widget (widget.js from replyee.online)
    ↓  patron sends message
POST replyee.online/api/chat   ← bot answers using menu knowledge base
    ↓  patron clicks "Talk to human"
POST replyee.online/api/handoff
    ↓  agent replies in Live Inbox
Supabase Realtime broadcast → widget shows green "Team member" bubble

BOO (server-side) → order placed
    ↓
POST replyee.online/api/webhooks/boo-order
    ↓
Conversation appears in Replyee Live Inbox with order summary
Agent can message patron while they're still on page
```

---

## Shared Secret

Both sides use a single shared secret for all server-to-server calls.

**Replyee env var:** `BOO_API_SECRET=<secret>`  
**BOO env var:** `REPLYEE_API_SECRET=<same secret>`

Header on every request: `Authorization: Bearer <secret>`

Use a strong random string (e.g. `openssl rand -hex 32`). Store in `.env` on both sides — never commit.

---

## Part 1 — Activate Replyee Add-On (BOO Portal)

### What to build
A "Connected Apps → Replyee" panel in the BOO portal (`/portal/settings/integrations.html` or similar).

### Flow
1. Restaurant owner clicks **Activate Replyee**
2. BOO portal prompts: *"Enter your Replyee User ID"* (found at replyee.online/dashboard/settings → Profile)
3. BOO stores the Replyee User ID in `restaurant_settings`
4. BOO calls Replyee to create the bot and ingest the menu
5. BOO stores the returned `botId` in `restaurant_settings`
6. BOO auto-injects the Replyee widget on the ordering page

### DB columns to add (`restaurant_settings`)

```sql
-- Migration: add Replyee integration columns
ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS replyee_user_id   TEXT,
  ADD COLUMN IF NOT EXISTS replyee_bot_id    TEXT,
  ADD COLUMN IF NOT EXISTS replyee_active    BOOLEAN NOT NULL DEFAULT false;
```

### API call — Create bot + ingest menu

```
POST https://replyee.online/api/internal/bots
Authorization: Bearer <REPLYEE_API_SECRET>
Content-Type: application/json
```

**Request body:**
```json
{
  "userId": "uuid-from-replyee-account",
  "restaurantName": "Guarapos Cuban Restaurant",
  "accentColor": "#d4a017",
  "greetingMessage": "Hi! Welcome to Guarapos. Ask me about our menu or click below to talk to the team.",
  "categories": [
    {
      "name": "Bowls",
      "description": "Signature Cuban bowls",
      "items": [
        {
          "name": "Burrito Bowl",
          "description": "Rice, black beans, grilled chicken, pico de gallo, sour cream, guacamole",
          "price": 12.99,
          "available": true
        },
        {
          "name": "Vegan Bowl",
          "description": "Rice, black beans, roasted veggies, avocado",
          "price": 11.99,
          "available": true
        }
      ]
    },
    {
      "name": "Drinks",
      "items": [
        { "name": "Horchata", "price": 3.99, "available": true },
        { "name": "Agua Fresca", "price": 3.49, "available": true }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "botId": "uuid",
  "embedCode": "<script src=\"https://replyee.online/widget.js\" data-bot-id=\"uuid\" async></script>",
  "chunksIngested": 2
}
```

**On success:** store `botId` in `restaurant_settings.replyee_bot_id`, set `replyee_active = true`.

### API call — Re-sync menu (call when BOO menu changes)

```
PUT https://replyee.online/api/internal/bots
Authorization: Bearer <REPLYEE_API_SECRET>
Content-Type: application/json

{
  "botId": "<stored botId>",
  "categories": [ ... same format as above ... ]
}
```

Call this whenever a restaurant publishes menu changes (new item, price update, item disabled). Replyee drops and re-ingests all menu chunks so the bot stays current.

---

## Part 2 — Widget Embed on Ordering Page

Once `replyee_bot_id` is set in `restaurant_settings`, inject the widget on the ordering page.

### Static embed (simplest)

In `ordering.html`, just before `</body>`:

```html
<!-- Only rendered when replyee_active = true (server renders this conditionally) -->
<script src="https://replyee.online/widget.js" data-bot-id="{{ replyee_bot_id }}" async></script>
```

### Dynamic order context (recommended — lets bot answer "where's my order?")

After the widget loads, BOO's JS should call `window.Replyee.setOrderContext()` whenever cart or order state changes:

```javascript
// After cart update — tell the bot what the patron is ordering
window.Replyee && window.Replyee.setOrderContext({
  items: ['Burrito Bowl', 'Horchata'],
  total: 16.98,
  customerEmail: currentUser?.email ?? null,
})

// After order confirmed — full order data
window.Replyee && window.Replyee.setOrderContext({
  orderId:       order.id,
  status:        'confirmed',
  items:         order.items.map(i => i.name),
  total:         order.total,
  customerEmail: order.email,
  customerName:  order.name,
})
```

The widget passes this context with every chat message. The bot and agents can see exactly what the patron ordered when answering questions.

### Programmatically open the widget

```javascript
// Open chat on page load for returning customers (optional)
window.Replyee && window.Replyee.open()
```

---

## Part 3 — Order Webhook (BOO → Replyee Live Inbox)

Fire this whenever an order status changes. Replyee creates/updates a conversation in the restaurant's Live Inbox so the agent can see the order and message the patron while they're still on the site.

### When to call

| BOO event | Call webhook? |
|-----------|--------------|
| Order placed (payment confirmed) | ✅ Yes |
| Status → preparing | ✅ Yes |
| Status → ready for pickup | ✅ Yes |
| Order cancelled | ✅ Yes |
| Refund issued | Optional |

### API call

```
POST https://replyee.online/api/webhooks/boo-order
Authorization: Bearer <REPLYEE_API_SECRET>
Content-Type: application/json
```

**First call (order placed):**
```json
{
  "botId":         "<replyee_bot_id from restaurant_settings>",
  "orderId":       "boo-order-uuid",
  "customerEmail": "pat@example.com",
  "customerName":  "Pat Smith",
  "total":         45.20,
  "items":         ["Burrito Bowl", "Horchata", "Chips & Salsa"],
  "status":        "confirmed"
}
```

**Response:**
```json
{ "ok": true, "sessionId": "uuid" }
```

**IMPORTANT:** Store the returned `sessionId` on the BOO order record. Pass it on all subsequent status-update calls for the same order.

### DB column to add (`customer_orders` or `orders`)

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS replyee_session_id UUID;
```

**Subsequent calls (status updates):**
```json
{
  "botId":         "<replyee_bot_id>",
  "orderId":       "boo-order-uuid",
  "sessionId":     "<stored replyee_session_id>",
  "customerEmail": "pat@example.com",
  "customerName":  "Pat Smith",
  "total":         45.20,
  "items":         ["Burrito Bowl", "Horchata", "Chips & Salsa"],
  "status":        "ready"
}
```

Passing `sessionId` ensures all status updates appear in the **same conversation thread** in the Live Inbox, not as separate conversations.

### Node.js helper for BOO

```javascript
// web/api/_lib/replyee.js

const REPLYEE_BASE   = 'https://replyee.online'
const REPLYEE_SECRET = process.env.REPLYEE_API_SECRET

async function replyeeOrderWebhook({ botId, orderId, sessionId, customerEmail, customerName, total, items, status }) {
  const res = await fetch(`${REPLYEE_BASE}/api/webhooks/boo-order`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${REPLYEE_SECRET}`,
    },
    body: JSON.stringify({ botId, orderId, sessionId, customerEmail, customerName, total, items, status }),
  })
  if (!res.ok) {
    console.error('[replyee] order webhook failed', await res.text())
    return null
  }
  return res.json()  // { ok: true, sessionId }
}

async function replyeeCreateBot({ userId, restaurantName, accentColor, categories }) {
  const res = await fetch(`${REPLYEE_BASE}/api/internal/bots`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${REPLYEE_SECRET}`,
    },
    body: JSON.stringify({ userId, restaurantName, accentColor, categories }),
  })
  if (!res.ok) throw new Error(`[replyee] createBot failed: ${await res.text()}`)
  return res.json()  // { botId, embedCode, chunksIngested }
}

async function replyeeSyncMenu({ botId, categories }) {
  const res = await fetch(`${REPLYEE_BASE}/api/internal/bots`, {
    method:  'PUT',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${REPLYEE_SECRET}`,
    },
    body: JSON.stringify({ botId, categories }),
  })
  if (!res.ok) throw new Error(`[replyee] syncMenu failed: ${await res.text()}`)
  return res.json()  // { ok: true, chunksIngested }
}

module.exports = { replyeeOrderWebhook, replyeeCreateBot, replyeeSyncMenu }
```

---

## Part 4 — Order Status Bot Command (Phase D)

So the Replyee bot can answer "where's my order?" in real time, BOO needs to expose an order status lookup endpoint.

### Build this endpoint in BOO

```
GET /api/internal/replyee/order-status?replyeeSessionId={uuid}
Authorization: Bearer <REPLYEE_API_SECRET>
```

**Response:**
```json
{
  "orderId":       "boo-uuid",
  "status":        "preparing",
  "statusLabel":   "Being prepared",
  "items":         ["Burrito Bowl", "Horchata"],
  "total":         45.20,
  "estimatedReady": "2026-06-13T18:45:00Z"
}
```

**Implementation:**
```javascript
// web/api/internal/replyee/order-status.js
const { supabase } = require('../../_lib/supabase')

module.exports = async (req, res) => {
  const secret = req.headers['authorization']?.replace('Bearer ', '')
  if (secret !== process.env.REPLYEE_API_SECRET) return res.status(401).json({ error: 'Unauthorized' })

  const { replyeeSessionId } = req.query
  if (!replyeeSessionId) return res.status(400).json({ error: 'Missing replyeeSessionId' })

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total, items, estimated_ready_at')
    .eq('replyee_session_id', replyeeSessionId)
    .maybeSingle()

  if (!order) return res.status(404).json({ error: 'Order not found' })

  const labels = { confirmed: 'Confirmed', preparing: 'Being prepared', ready: 'Ready for pickup', delivered: 'Delivered' }

  res.json({
    orderId:       order.id,
    status:        order.status,
    statusLabel:   labels[order.status] ?? order.status,
    items:         order.items,
    total:         order.total,
    estimatedReady: order.estimated_ready_at,
  })
}
```

Once this is built, inform Replyee team so they can wire up the bot's order-status intent detection.

---

## Part 5 — BOO Portal UI

### `portal/settings/integrations.html` — Replyee panel

Show a "Replyee — AI Chat & Live Support" card in the Connected Apps section.

**States:**
- **Not connected:** Show description + "Activate" button → prompts for Replyee User ID → calls `POST /api/portal/replyee/activate`
- **Connected:** Show status (Active), bot name, link to Live Inbox, "Re-sync menu" button, "Disconnect" button

**BOO portal API endpoints to add:**

```
POST /api/portal/replyee/activate
  body: { replyeeUserId }
  → calls replyeeCreateBot with full menu
  → stores botId in restaurant_settings
  → returns { botId, embedCode }

POST /api/portal/replyee/sync-menu
  → re-fetches current menu from DB
  → calls replyeeSyncMenu({ botId, categories })
  → returns { chunksIngested }

DELETE /api/portal/replyee/disconnect
  → sets replyee_active = false in restaurant_settings
  → (optionally deactivates bot via Replyee API)
```

### Dashboard widget (optional, nice-to-have)

On the BOO portal dashboard, add a small "Live Chat" widget showing:
- Active conversations (count from Replyee, or link out)
- Button: "Open Live Inbox →" → `https://replyee.online/dashboard/inbox`

---

## Part 6 — Menu Helper (BOO-side)

BOO needs a function to format its menu data into the categories/items shape Replyee expects.

```javascript
// web/api/_lib/replyee-menu-formatter.js

async function getMenuForReplyee(clientId) {
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('id, name, description')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('sort_order')

  const result = []
  for (const cat of categories ?? []) {
    const { data: items } = await supabase
      .from('menu_items')
      .select('name, description, base_price, is_available')
      .eq('category_id', cat.id)
      .order('sort_order')

    result.push({
      name:        cat.name,
      description: cat.description ?? undefined,
      items: (items ?? []).map(i => ({
        name:        i.name,
        description: i.description ?? undefined,
        price:       i.base_price,
        available:   i.is_available,
      })),
    })
  }
  return result
}

module.exports = { getMenuForReplyee }
```

---

## Environment Variables

### Add to BOO `.env`
```
REPLYEE_API_SECRET=<shared secret — same value as Replyee's BOO_API_SECRET>
```

### Add to Replyee `.env` (Vercel)
```
BOO_API_SECRET=<shared secret>
```

---

## Build Checklist for BOO Team

### Phase A — Widget Embed (Oct 2026, ~2 days)
- [ ] DB migration: add `replyee_user_id`, `replyee_bot_id`, `replyee_active` to `restaurant_settings`
- [ ] Build `web/api/_lib/replyee.js` helper (create bot, sync menu, order webhook)
- [ ] Build `web/api/_lib/replyee-menu-formatter.js`
- [ ] Build `POST /api/portal/replyee/activate` endpoint
- [ ] Build `POST /api/portal/replyee/sync-menu` endpoint
- [ ] Add Replyee card to portal integrations page
- [ ] Inject widget script tag on ordering page when `replyee_active = true`

### Phase B — Order Context (Oct 2026, ~1 day)
- [ ] Call `window.Replyee.setOrderContext()` in `ordering.js` after cart update
- [ ] Call `window.Replyee.setOrderContext()` after order confirmed

### Phase C — Order Webhook (Nov 2026, ~2 days)
- [ ] DB migration: add `replyee_session_id UUID` to orders table
- [ ] Fire `replyeeOrderWebhook()` after Stripe payment confirmed
- [ ] Store returned `sessionId` in `orders.replyee_session_id`
- [ ] Fire webhook again on status changes (preparing, ready, cancelled)

### Phase D — Order Status Endpoint (Nov 2026, ~1 day)
- [ ] Build `GET /api/internal/replyee/order-status` endpoint
- [ ] Notify Replyee team when live so they can wire bot intent detection

---

## Testing the Integration

### Test bot creation
```bash
curl -X POST https://replyee.online/api/internal/bots \
  -H "Authorization: Bearer <secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<your-replyee-user-uuid>",
    "restaurantName": "Test Restaurant",
    "categories": [
      { "name": "Mains", "items": [{ "name": "Test Burger", "price": 12.99, "available": true }] }
    ]
  }'
# Expected: { "botId": "...", "embedCode": "...", "chunksIngested": 1 }
```

### Test order webhook
```bash
curl -X POST https://replyee.online/api/webhooks/boo-order \
  -H "Authorization: Bearer <secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "botId":         "<botId from above>",
    "orderId":       "test-order-001",
    "customerEmail": "test@example.com",
    "customerName":  "Test Customer",
    "total":         12.99,
    "items":         ["Test Burger"],
    "status":        "confirmed"
  }'
# Expected: { "ok": true, "sessionId": "uuid" }
# Then open replyee.online/dashboard/inbox — conversation should appear
```

### End-to-end test
1. Embed widget on a test ordering page with `data-bot-id`
2. Ask "what's on the menu?" → bot should list items from the ingested menu
3. Click "Talk to a human"
4. Place a test order → check Replyee Live Inbox shows the order conversation
5. Reply from Live Inbox → widget should show green "Team member" bubble

---

## Questions / Contact

Replyee side built by: Eric / Boom Media  
Replyee API questions: check `src/app/api/internal/bots/route.ts` and `src/app/api/webhooks/boo-order/route.ts` in the Replyee repo.  
Shared secret: coordinate with Eric to set the same value in both `.env` files.

---

*Created: 2026-06-13 | Replyee Phase: Complete | BOO Phase: Ready to build*
