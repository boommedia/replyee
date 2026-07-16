import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chunkText, embedBatch } from '@/lib/rag/embed'
import * as cheerio from 'cheerio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Vercel strips the Authorization header on the public domains (same lesson
// as Displayee's partner API), so accept the secret via ?key= as well.
// Trim both sides — env values and pasted keys often carry stray whitespace.
function verifySecret(req: NextRequest) {
  const secret = (process.env.BOO_API_SECRET ?? '').trim()
  if (!secret) return false
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (bearer && bearer === secret) return true
  return (req.nextUrl.searchParams.get('key') ?? '').trim() === secret
}

// Internal (secret-authed) knowledge ingest for an EXISTING bot — the
// programmatic twin of /api/ingest/url, used by ops automation rather than
// the logged-in dashboard. Accepts either a `url` to fetch or raw `text`.
export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const botId: string = body.botId
  const url: string | undefined = body.url
  const rawText: string | undefined = body.text
  const sourceName: string | undefined = body.sourceName

  if (!botId || (!url && !rawText)) {
    return NextResponse.json({ error: 'Missing botId or url/text' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: bot } = await admin.from('replyee_chatbots').select('id, name').eq('id', botId).single()
  if (!bot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })

  try {
    let text = rawText ?? ''
    if (url) {
      const res = await fetch(url, { headers: { 'User-Agent': 'Replyee/1.0 (replyee.online)' }, signal: AbortSignal.timeout(10000) })
      if (!res.ok) return NextResponse.json({ error: `Failed to fetch URL: ${res.status}` }, { status: 400 })
      const html = await res.text()
      const $ = cheerio.load(html)
      $('script, style, nav, footer, header, aside, noscript, [aria-hidden="true"]').remove()
      text = $('body').text().replace(/\s+/g, ' ').trim()
    }

    if (!text || text.length < 50) {
      return NextResponse.json({ error: 'Could not extract meaningful text' }, { status: 400 })
    }

    const chunks = chunkText(text)
    const embeddings = await embedBatch(chunks)

    const rows = chunks.map((content, i) => ({
      chatbot_id: botId,
      content,
      embedding: embeddings[i],
      source_type: url ? 'url' : 'text',
      source_name: sourceName ?? url ?? 'ops-ingest',
    }))

    const { error } = await admin.from('replyee_knowledge_chunks').insert(rows)
    if (error) throw error

    return NextResponse.json({ botId, chunksIngested: rows.length, source: sourceName ?? url ?? 'text' })
  } catch (err) {
    console.error('[/api/internal/ingest]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Remove previously ingested chunks — whole bot KB, or one source by name.
export async function DELETE(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const botId: string = body.botId
  const sourceName: string | undefined = body.sourceName
  if (!botId) return NextResponse.json({ error: 'Missing botId' }, { status: 400 })

  const admin = createAdminClient()
  let q = admin.from('replyee_knowledge_chunks').delete().eq('chatbot_id', botId)
  if (sourceName) q = q.eq('source_name', sourceName)
  const { error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ botId, deleted: count ?? true })
}
