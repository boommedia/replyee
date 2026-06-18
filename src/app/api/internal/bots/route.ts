import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedText } from '@/lib/rag/embed'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function verifySecret(req: NextRequest) {
  const secret = process.env.BOO_API_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

interface MenuItem {
  name: string
  description?: string
  price?: number
  available?: boolean
}

interface MenuCategory {
  name: string
  description?: string
  items: MenuItem[]
}

interface RestaurantInfo {
  address?: string | null
  phone?: string | null
  hours?: string | null
  website?: string | null
  policies?: string | null
}

function buildInfoChunk(name: string, info: RestaurantInfo): string {
  const lines: string[] = [`Restaurant Information — ${name}`, '']
  if (info.address)  lines.push(`Address: ${info.address}`)
  if (info.phone)    lines.push(`Phone: ${info.phone}`)
  if (info.hours)    lines.push(`Hours: ${info.hours}`)
  if (info.website)  lines.push(`Website: ${info.website}`)
  if (info.policies) lines.push('', `Policies:`, info.policies)
  return lines.join('\n')
}

// Called by BOO portal when a restaurant activates the Replyee add-on.
// Creates the bot and ingests the full menu as knowledge chunks.
export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const userId: string         = body.userId
    const restaurantName: string = body.restaurantName
    const accentColor: string    = body.accentColor    ?? '#6366f1'
    const greetingMessage: string | undefined = body.greetingMessage
    const systemPrompt: string | undefined    = body.systemPrompt
    const categories: MenuCategory[]          = body.categories ?? []
    const restaurantInfo: RestaurantInfo | undefined = body.restaurantInfo

    if (!userId || !restaurantName) {
      return NextResponse.json({ error: 'Missing userId or restaurantName' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const defaultGreeting = `Hi! I'm the ${restaurantName} assistant. Ask me about the menu, hours, or anything else — or click "Talk to a human" to reach the team directly.`
    const defaultSystem = `You are a helpful assistant for ${restaurantName}, a restaurant. Answer questions about the menu, prices, hours, allergens, catering, and ordering. Be friendly and concise. If you don't have the answer, offer to connect the customer with the team.`

    const { data: bot, error: botError } = await supabase
      .from('replyee_chatbots')
      .insert({
        user_id: userId,
        name: restaurantName,
        accent_color: accentColor,
        greeting_message: greetingMessage ?? defaultGreeting,
        system_prompt: systemPrompt ?? defaultSystem,
        is_active: true,
        restaurant_address: restaurantInfo?.address ?? null,
        restaurant_phone:   restaurantInfo?.phone   ?? null,
        restaurant_hours:   restaurantInfo?.hours   ?? null,
        restaurant_website: restaurantInfo?.website ?? null,
      })
      .select('id')
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: 'Failed to create bot', detail: botError?.message }, { status: 500 })
    }

    // Ingest menu: one knowledge chunk per category
    let chunksIngested = 0
    for (const cat of categories) {
      const available = cat.items.filter(i => i.available !== false)
      if (available.length === 0) continue

      const lines = [`${cat.name}${cat.description ? ` — ${cat.description}` : ''}`]
      for (const item of available) {
        const price = item.price != null ? ` ($${Number(item.price).toFixed(2)})` : ''
        const desc  = item.description ? ` — ${item.description}` : ''
        lines.push(`• ${item.name}${price}${desc}`)
      }
      const content = lines.join('\n')

      const embedding = await embedText(content)
      await supabase.from('replyee_knowledge_chunks').insert({
        chatbot_id: bot.id,
        content,
        source_type: 'menu',
        source_name: cat.name,
        embedding,
      })
      chunksIngested++
    }

    // Ingest restaurant info (address, phone, hours, policies) as a single chunk
    if (restaurantInfo && Object.values(restaurantInfo).some(Boolean)) {
      const content = buildInfoChunk(restaurantName, restaurantInfo)
      const embedding = await embedText(content)
      await supabase.from('replyee_knowledge_chunks').insert({
        chatbot_id: bot.id,
        content,
        source_type: 'restaurant_info',
        source_name: 'Restaurant Info',
        embedding,
      })
    }

    const embedCode = `<script src="https://replyee.online/widget.js" data-bot-id="${bot.id}" async></script>`

    return NextResponse.json({ botId: bot.id, embedCode, chunksIngested })
  } catch (err) {
    console.error('[/api/internal/bots]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Deactivate bot when BOO restaurant disconnects the Replyee add-on
export async function DELETE(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const botId: string = body.botId
    if (!botId) return NextResponse.json({ error: 'Missing botId' }, { status: 400 })

    const supabase = createAdminClient()
    await supabase.from('replyee_chatbots').update({ is_active: false }).eq('id', botId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/internal/bots DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Re-ingest menu when BOO menu changes (replace all existing menu chunks)
export async function PUT(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const botId: string          = body.botId
    const categories: MenuCategory[] = body.categories ?? []
    const restaurantInfo: RestaurantInfo | undefined = body.restaurantInfo
    if (!botId) return NextResponse.json({ error: 'Missing botId' }, { status: 400 })

    const supabase = createAdminClient()

    // Drop existing menu chunks and re-ingest
    await supabase
      .from('replyee_knowledge_chunks')
      .delete()
      .eq('chatbot_id', botId)
      .eq('source_type', 'menu')

    let chunksIngested = 0
    for (const cat of categories) {
      const available = cat.items.filter(i => i.available !== false)
      if (available.length === 0) continue

      const lines = [`${cat.name}${cat.description ? ` — ${cat.description}` : ''}`]
      for (const item of available) {
        const price = item.price != null ? ` ($${Number(item.price).toFixed(2)})` : ''
        const desc  = item.description ? ` — ${item.description}` : ''
        lines.push(`• ${item.name}${price}${desc}`)
      }
      const content = lines.join('\n')

      const embedding = await embedText(content)
      await supabase.from('replyee_knowledge_chunks').insert({
        chatbot_id: botId,
        content,
        source_type: 'menu',
        source_name: cat.name,
        embedding,
      })
      chunksIngested++
    }

    // Re-sync restaurant info chunk + chatbot columns if provided
    if (restaurantInfo && Object.values(restaurantInfo).some(Boolean)) {
      await supabase
        .from('replyee_knowledge_chunks')
        .delete()
        .eq('chatbot_id', botId)
        .eq('source_type', 'restaurant_info')

      const { data: bot } = await supabase
        .from('replyee_chatbots')
        .select('name')
        .eq('id', botId)
        .maybeSingle()

      if (bot) {
        const content = buildInfoChunk(bot.name, restaurantInfo)
        const embedding = await embedText(content)
        await Promise.all([
          supabase.from('replyee_knowledge_chunks').insert({
            chatbot_id: botId,
            content,
            source_type: 'restaurant_info',
            source_name: 'Restaurant Info',
            embedding,
          }),
          supabase.from('replyee_chatbots').update({
            restaurant_address: restaurantInfo.address ?? null,
            restaurant_phone:   restaurantInfo.phone   ?? null,
            restaurant_hours:   restaurantInfo.hours   ?? null,
            restaurant_website: restaurantInfo.website ?? null,
          }).eq('id', botId),
        ])
      }
    }

    return NextResponse.json({ ok: true, chunksIngested })
  } catch (err) {
    console.error('[/api/internal/bots PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
