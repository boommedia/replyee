import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { botId, email, question, sessionId } = await req.json()
    if (!botId || !email) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const supabase = createAdminClient()

    const { data: bot } = await supabase
      .from('replyee_chatbots')
      .select('name, user_id, replyee_profiles(email, full_name)')
      .eq('id', botId)
      .single()

    if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 })

    await supabase.from('replyee_leads').insert({
      chatbot_id: botId,
      visitor_email: email,
      question: question ?? null,
      session_id: sessionId ?? null,
    })

    await supabase.rpc('replyee_increment_lead_count', { bot_id: botId })

    const ownerProfile = bot.replyee_profiles as { email: string; full_name: string } | null
    if (ownerProfile?.email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@replyee.online',
        to: ownerProfile.email,
        subject: `New lead from ${bot.name} chatbot`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #6366f1; margin-bottom: 8px;">New Lead Captured</h2>
            <p style="color: #64748b; margin-bottom: 24px;">Someone left their contact details on your <strong>${bot.name}</strong> chatbot.</p>
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Visitor Email</p>
              <p style="margin: 0; font-weight: 700; color: #0f172a;">${email}</p>
            </div>
            ${question ? `
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Their Question</p>
              <p style="margin: 0; color: #0f172a;">${question}</p>
            </div>
            ` : ''}
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">Sent by Replyee · replyee.online</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/leads]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
