import { NextRequest, NextResponse } from 'next/server'
import { authApiKey, unauthorized } from '@/lib/apiV1Auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/me
 * Validate the API key and return the account's chatbots.
 * Consumers use this to confirm their key + discover bot_ids.
 */
export async function GET(req: NextRequest) {
  const auth = await authApiKey(req)
  if (!auth) return unauthorized()

  const admin = createAdminClient()
  const { data: bots } = await admin
    .from('replyee_chatbots')
    .select('id, name, is_active')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    ok: true,
    user_id: auth.userId,
    bots: bots ?? [],
  })
}
