import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function verifySecret(req: NextRequest) {
  const secret = process.env.BOO_API_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

// Called by Replyee bot (via BOO) to look up an order's current status.
// BOO proxies the request server-side — the customer never touches this endpoint.
// Query params: orderId, email (at least one required to prevent fishing)
export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')?.trim()
  const email   = searchParams.get('email')?.trim().toLowerCase()

  if (!orderId && !email) {
    return NextResponse.json({ error: 'Provide orderId or email' }, { status: 400 })
  }

  // Forward lookup to BOO — BOO owns the order data.
  // BOO_ORDER_LOOKUP_URL is the BOO internal endpoint that checks its own DB.
  const booUrl = process.env.BOO_ORDER_LOOKUP_URL
  if (!booUrl) {
    return NextResponse.json({ error: 'Order lookup not configured' }, { status: 503 })
  }

  const params = new URLSearchParams()
  if (orderId) params.set('orderId', orderId)
  if (email)   params.set('email', email)

  try {
    const resp = await fetch(`${booUrl}?${params}`, {
      headers: { Authorization: `Bearer ${process.env.BOO_API_SECRET}` },
    })
    if (!resp.ok) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    const data = await resp.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/internal/order-status]', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 502 })
  }
}
