import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InboxClient from './inbox-client'

export const metadata = { title: 'Live Inbox' }
export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bots } = await supabase
    .from('replyee_chatbots')
    .select('id, name, accent_color')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#ECECF1' }}>Live Inbox</h1>
        <p style={{ fontSize: 14, color: '#8B8B99', marginTop: 4 }}>
          Take over from the bot and chat with visitors in real time.
        </p>
      </div>
      <InboxClient bots={bots ?? []} />
    </div>
  )
}
