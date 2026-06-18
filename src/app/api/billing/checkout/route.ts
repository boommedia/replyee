import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth:  process.env.STRIPE_PRICE_GROWTH,
  agency:  process.env.STRIPE_PRICE_AGENCY,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  const priceId = PRICE_IDS[plan]
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })
  const admin  = createAdminClient()

  const { data: profile } = await admin
    .from('replyee_profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id as string | undefined

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name:  profile?.full_name ?? undefined,
      metadata: { replyee_user_id: user.id },
    })
    customerId = customer.id
    await admin
      .from('replyee_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://replyee.online'

  const session = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/settings?upgraded=1`,
    cancel_url:  `${origin}/dashboard/settings`,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14,
      metadata: { replyee_user_id: user.id, plan },
    },
  })

  return NextResponse.json({ url: session.url })
}
