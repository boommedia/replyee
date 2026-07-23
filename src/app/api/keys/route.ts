import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/keys — list the signed-in user's API keys (key value included; owner-only).
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('replyee_api_keys')
    .select('id, name, key, created_at, last_used_at, revoked')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: data ?? [] })
}

// POST /api/keys — create a new key. Body: { name?: string }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'API key'
  const key = 'rpl_live_' + randomBytes(24).toString('hex')

  const { data, error } = await supabase
    .from('replyee_api_keys')
    .insert({ user_id: user.id, name, key })
    .select('id, name, key, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ key: data })
}
