import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// max-age was 300 (5 min), which meant a saved setting could take five minutes
// to reach a visitor's browser — indistinguishable from "settings don't apply".
// 15s keeps the request cheap while making dashboard edits feel live.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=15',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400, headers: CORS })

  const supabase = createAdminClient()
  // Select ONLY columns guaranteed to exist in the base schema. Selecting a
  // column from an unrun migration (e.g. widget_position/handoff_enabled) makes
  // Postgres error the whole query → data is null → the route 404s → the widget
  // silently fails to render on every client site. That is exactly what took the
  // widget down. Optional/newer columns are read separately and fault-tolerantly
  // below so a not-yet-migrated DB can never break the widget again.
  const { data: bot } = await supabase
    .from('replyee_chatbots')
    .select('name, accent_color, greeting_message, fallback_message, is_active, triggers, restaurant_address, restaurant_phone, restaurant_hours, restaurant_website')
    .eq('id', id)
    .maybeSingle()

  if (!bot || !bot.is_active) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS })
  }

  // Optional per-bot settings from later migrations: widget_position (006) and
  // handoff_enabled (008). supabase-js returns an error (not a throw) when a
  // column is absent, so `opt` is simply null and we fall back to safe defaults:
  // bottom-right launcher, handoff ON (prior always-on behaviour).
  let handoff = true
  let position = 'bottom-right'
  const { data: opt } = await supabase
    .from('replyee_chatbots')
    .select('handoff_enabled, widget_position')
    .eq('id', id)
    .maybeSingle()
  if (opt) {
    const o = opt as { handoff_enabled?: boolean; widget_position?: string }
    if (o.handoff_enabled === false) handoff = false
    if (o.widget_position) position = o.widget_position
  }

  return NextResponse.json(
    {
      name: bot.name,
      accentColor: bot.accent_color,
      greeting: bot.greeting_message,
      fallback: bot.fallback_message,
      position,
      handoff,
      triggers: bot.triggers || [],
      restaurantAddress: bot.restaurant_address || null,
      restaurantPhone:   bot.restaurant_phone   || null,
      restaurantHours:   bot.restaurant_hours   || null,
      restaurantWebsite: bot.restaurant_website || null,
      // Public credentials so the widget can join Realtime broadcast channels
      // (anon key is public by design; data access is still gated by RLS)
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    { headers: CORS }
  )
}
