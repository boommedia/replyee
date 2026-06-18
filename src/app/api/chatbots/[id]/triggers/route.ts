import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { triggers } = await req.json()
  if (!Array.isArray(triggers)) {
    return NextResponse.json({ error: 'Triggers must be an array' }, { status: 400 })
  }

  const { data: bot } = await supabase
    .from('replyee_chatbots')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!bot) {
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('replyee_chatbots')
    .update({ triggers })
    .eq('id', id)

  if (error) {
    console.error('[PUT /api/chatbots/[id]/triggers]', error)
    return NextResponse.json({ error: 'Failed to save triggers' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, triggers })
}
