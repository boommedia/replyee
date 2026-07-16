import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chunkText, embedChunksOptional } from '@/lib/rag/embed'
import pdfParse from 'pdf-parse'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const botId = formData.get('botId') as string
  const file  = formData.get('file') as File | null

  if (!botId || !file) return NextResponse.json({ error: 'Missing botId or file' }, { status: 400 })

  const { data: bot } = await supabase.from('replyee_chatbots').select('id').eq('id', botId).eq('user_id', user.id).single()
  if (!bot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    let text = ''

    const nameLc = file.name.toLowerCase()
    if (file.type === 'application/pdf' || nameLc.endsWith('.pdf')) {
      const parsed = await pdfParse(buffer)
      text = parsed.text
    } else if (
      file.type.startsWith('text/') ||
      nameLc.endsWith('.txt') || nameLc.endsWith('.md') || nameLc.endsWith('.markdown') || nameLc.endsWith('.csv')
    ) {
      text = buffer.toString('utf-8')
    } else {
      return NextResponse.json({ error: 'Supported files: PDF, TXT, Markdown (.md), CSV' }, { status: 400 })
    }

    text = text.replace(/\s+/g, ' ').trim()
    if (!text || text.length < 50) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 })
    }

    const chunks = chunkText(text)
    const { embeddings } = await embedChunksOptional(chunks)

    const admin = createAdminClient()
    const rows = chunks.map((content, i) => ({
      chatbot_id: botId,
      content,
      embedding: embeddings[i],
      source_type: 'file',
      source_name: file.name,
    }))

    const { error } = await admin.from('replyee_knowledge_chunks').insert(rows)
    if (error) throw error

    await admin.rpc('replyee_increment_chunk_count', { bot_id: botId, amount: rows.length })

    return NextResponse.json({ success: true, chunksAdded: rows.length })
  } catch (err) {
    console.error('[/api/ingest/file]', err)
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}

export const maxDuration = 60
