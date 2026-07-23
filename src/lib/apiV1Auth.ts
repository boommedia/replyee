import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Validate a public API key from the request.
 * Accepts `Authorization: Bearer <key>` or `X-API-Key: <key>`.
 * Returns { userId } on success, or null. Touches last_used_at (fire-and-forget).
 *
 * This is the shared auth for the Replyee v1 API — the same pattern will be
 * reused across the other SaaS apps' public APIs.
 */
export async function authApiKey(req: Request): Promise<{ userId: string } | null> {
  const header = req.headers.get('authorization') || req.headers.get('x-api-key') || ''
  const key = header.replace(/^Bearer\s+/i, '').trim()
  if (!key || !key.startsWith('rpl_')) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('replyee_api_keys')
    .select('id, user_id, revoked')
    .eq('key', key)
    .maybeSingle()

  if (!data || data.revoked) return null

  // Fire-and-forget usage stamp.
  admin.from('replyee_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id).then(
    () => {},
    () => {}
  )

  return { userId: data.user_id as string }
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: 'Invalid or missing API key' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
