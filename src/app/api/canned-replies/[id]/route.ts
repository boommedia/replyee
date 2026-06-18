import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership before deleting
  const { data: reply } = await supabase
    .from('replyee_canned_replies')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!reply) {
    return NextResponse.json({ error: 'Canned reply not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('replyee_canned_replies')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('[DELETE /api/canned-replies/[id]]', error)
    return NextResponse.json({ error: 'Failed to delete canned reply' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
