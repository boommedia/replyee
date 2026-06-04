import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chunkText, embedBatch } from '@/lib/rag/embed'
import * as cheerio from 'cheerio'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { botId, url } = await req.json()
  if (!botId || !url) return NextResponse.json({ error: 'Missing botId or url' }, { status: 400 })

  const { data: bot } = await supabase.from('replyee_chatbots').select('id').eq('id', botId).eq('user_id', user.id).single()
  if (!bot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Replyee/1.0 (replyee.online)' }, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return NextResponse.json({ error: `Failed to fetch URL: ${res.status}` }, { status: 400 })
    const html = await res.text()

    const $ = cheerio.load(html)
    $('script, style, nav, footer, header, aside, noscript, [aria-hidden="true"]').remove()
    const text = $('body').text().replace(/\s+/g, ' ').trim()

    if (!text || text.length < 50) {
      return NextResponse.json({ error: 'Could not extract meaningful text from URL' }, { status: 400 })
    }

    const chunks = chunkText(text)
    const embeddings = await embedBatch(chunks)

    const admin = createAdminClient()
    const rows = chunks.map((content, i) => ({
      chatbot_id: botId,
      content,
      embedding: embeddings[i],
      source_type: 'url',
      source_name: url,
    }))

    const { error } = await admin.from('replyee_knowledge_chunks').insert(rows)
    if (error) throw error

    await admin.rpc('replyee_increment_chunk_count', { bot_id: botId, amount: rows.length })

    return NextResponse.json({ success: true, chunksAdded: rows.length })
  } catch (err) {
    console.error('[/api/ingest/url]', err)
    return NextResponse.json({ error: 'Failed to process URL' }, { status: 500 })
  }
}
