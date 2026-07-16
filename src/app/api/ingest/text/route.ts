import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chunkText, embedChunksOptional } from '@/lib/rag/embed'

// Ingest pasted text or Markdown into a bot's knowledge base (dashboard use).
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { botId, text, sourceName } = await req.json()
  if (!botId || !text?.trim()) return NextResponse.json({ error: 'Missing botId or text' }, { status: 400 })

  const { data: bot } = await supabase.from('replyee_chatbots').select('id').eq('id', botId).eq('user_id', user.id).single()
  if (!bot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })

  try {
    const clean = String(text).replace(/\s+/g, ' ').trim()
    if (clean.length < 20) return NextResponse.json({ error: 'Text is too short to add' }, { status: 400 })

    const chunks = chunkText(clean)
    const { embeddings } = await embedChunksOptional(chunks)

    const admin = createAdminClient()
    const rows = chunks.map((content, i) => ({
      chatbot_id: botId,
      content,
      embedding: embeddings[i],
      source_type: 'text',
      source_name: (sourceName && String(sourceName).trim()) || 'Pasted text',
    }))

    const { error } = await admin.from('replyee_knowledge_chunks').insert(rows)
    if (error) throw error

    await admin.rpc('replyee_increment_chunk_count', { bot_id: botId, amount: rows.length })

    return NextResponse.json({ success: true, chunksAdded: rows.length })
  } catch (err) {
    console.error('[/api/ingest/text]', err)
    return NextResponse.json({ error: 'Failed to add text' }, { status: 500 })
  }
}
