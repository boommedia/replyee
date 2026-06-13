import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function verifySecret(req: NextRequest) {
  const secret = process.env.BOO_API_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

const STATUS_LABEL: Record<string, string> = {
  confirmed:  'Confirmed — being prepared',
  preparing:  'Being prepared',
  ready:      'Ready for pickup',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
}

// Fired by BOO when an order is placed or its status changes.
// Creates/updates a conversation in Replyee so agents see it in the Live Inbox.
// BOO should store the returned `sessionId` against the order for future status updates.
export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const {
      botId,
      orderId,
      sessionId: existingSessionId,  // pass back the UUID returned from the first call
      customerEmail,
      customerName,
      total,
      items,
      status = 'confirmed',
    } = await req.json()

    if (!botId || !orderId) {
      return NextResponse.json({ error: 'Missing botId or orderId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const sessionId: string = existingSessionId ?? crypto.randomUUID()
    const itemsList = Array.isArray(items) ? items.join(', ') : (items ?? '')
    const totalStr  = total != null ? `$${Number(total).toFixed(2)}` : ''

    const summaryLines = [
      `Order #${String(orderId).slice(0, 8)} — ${STATUS_LABEL[status] ?? status}`,
      itemsList   ? `Items: ${itemsList}`       : null,
      totalStr    ? `Total: ${totalStr}`         : null,
      customerName  ? `Customer: ${customerName}` : null,
      customerEmail ? `Email: ${customerEmail}`   : null,
    ].filter(Boolean) as string[]

    const summaryContent = `📦 ${summaryLines.join(' · ')}`

    await supabase.from('replyee_conversations').upsert(
      {
        session_id:       sessionId,
        chatbot_id:       botId,
        visitor_email:    customerEmail ?? null,
        last_message_at:  new Date().toISOString(),
        updated_at:       new Date().toISOString(),
        unread_by_agent:  1,
      },
      { onConflict: 'session_id' }
    )

    // Insert / replace the order summary message (agents see this in the transcript)
    // For subsequent status updates we just insert a new message — full timeline visible.
    await supabase.from('replyee_messages').insert({
      session_id: sessionId,
      chatbot_id: botId,
      role:       'assistant',
      content:    summaryContent,
    })

    return NextResponse.json({ ok: true, sessionId })
  } catch (err) {
    console.error('[/api/webhooks/boo-order]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
