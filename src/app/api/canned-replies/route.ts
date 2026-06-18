import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: replies, error } = await supabase
    .from('replyee_canned_replies')
    .select('id, shortcut, body, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/canned-replies]', error)
    return NextResponse.json({ error: 'Failed to fetch canned replies' }, { status: 500 })
  }

  return NextResponse.json({ replies })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { shortcut, body } = await req.json()
  if (!shortcut || !body) {
    return NextResponse.json({ error: 'Missing shortcut or body' }, { status: 400 })
  }

  const { data: reply, error } = await supabase
    .from('replyee_canned_replies')
    .insert({ user_id: user.id, shortcut, body })
    .select('id, shortcut, body, created_at')
    .single()

  if (error) {
    console.error('[POST /api/canned-replies]', error)
    return NextResponse.json({ error: 'Failed to create canned reply' }, { status: 500 })
  }

  return NextResponse.json({ reply }, { status: 201 })
}
