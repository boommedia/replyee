import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BotDetailClient } from './bot-detail-client'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('replyee_chatbots').select('name').eq('id', id).single()
  return { title: data?.name ?? 'Bot Detail' }
}

export default async function BotDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab = 'kb' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bot } = await supabase
    .from('replyee_chatbots')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!bot) notFound()

  const [{ data: sources }, { data: leads }] = await Promise.all([
    supabase
      .from('replyee_knowledge_chunks')
      .select('source_name, source_type, created_at')
      .eq('chatbot_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('replyee_leads')
      .select('*')
      .eq('chatbot_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const sourceMap = new Map<string, { name: string; type: string; count: number; createdAt: string }>()
  for (const chunk of sources ?? []) {
    const key = `${chunk.source_type}:${chunk.source_name}`
    if (!sourceMap.has(key)) {
      sourceMap.set(key, { name: chunk.source_name ?? 'Unknown', type: chunk.source_type, count: 0, createdAt: chunk.created_at })
    }
    sourceMap.get(key)!.count++
  }
  const knowledgeSources = Array.from(sourceMap.values())

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link href="/dashboard/bots" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8B8B99', textDecoration: 'none', fontSize: 13 }}>
          <ArrowLeft size={14} /> My Chatbots
        </Link>
      </div>

      <BotDetailClient
        bot={bot}
        knowledgeSources={knowledgeSources}
        leads={leads ?? []}
        activeTab={tab}
      />
    </div>
  )
}
