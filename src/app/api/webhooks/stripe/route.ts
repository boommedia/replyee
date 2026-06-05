import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER ?? '']: 'starter',
  [process.env.STRIPE_PRICE_GROWTH  ?? '']: 'growth',
  [process.env.STRIPE_PRICE_AGENCY  ?? '']: 'agency',
}

const PLAN_BOT_LIMITS: Record<string, number> = {
  starter: 1,
  growth:  5,
  agency:  999,
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig  = (await headers()).get('stripe-signature')

  if (!sig) return new Response('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const email      = session.customer_email ?? session.customer_details?.email ?? null
      const priceId    = session.line_items
        ? (await stripe.checkout.sessions.listLineItems(session.id)).data[0]?.price?.id
        : null

      const plan     = (priceId && PRICE_TO_PLAN[priceId]) || 'starter'
      const botLimit = PLAN_BOT_LIMITS[plan] ?? 1

      if (email) {
        await admin
          .from('replyee_profiles')
          .update({ plan, bot_limit: botLimit, stripe_customer_id: customerId })
          .eq('email', email)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub        = event.data.object as Stripe.Subscription
      const priceId    = sub.items.data[0]?.price?.id
      const plan       = (priceId && PRICE_TO_PLAN[priceId]) || 'starter'
      const botLimit   = PLAN_BOT_LIMITS[plan] ?? 1
      const customerId = sub.customer as string

      await admin
        .from('replyee_profiles')
        .update({ plan, bot_limit: botLimit })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      await admin
        .from('replyee_profiles')
        .update({ plan: 'starter_trial', bot_limit: 1 })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'invoice.payment_failed':
      break
  }

  return new Response('ok', { status: 200 })
}
