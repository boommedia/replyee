import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=300',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400, headers: CORS })

  const supabase = createAdminClient()
  const { data: bot } = await supabase
    .from('replyee_chatbots')
    .select('name, accent_color, greeting_message, fallback_message, is_active')
    .eq('id', id)
    .maybeSingle()

  if (!bot || !bot.is_active) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS })
  }

  return NextResponse.json(
    {
      name: bot.name,
      accentColor: bot.accent_color,
      greeting: bot.greeting_message,
      fallback: bot.fallback_message,
      handoff: true,
      // Public credentials so the widget can join Realtime broadcast channels
      // (anon key is public by design; data access is still gated by RLS)
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    { headers: CORS }
  )
}
