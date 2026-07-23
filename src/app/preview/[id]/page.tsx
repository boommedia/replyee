'use client'

import { use, useEffect } from 'react'

/**
 * Live widget preview.
 *
 * The bot detail page has always linked here ("Preview Widget"), but the route
 * did not exist — the link 404'd, so there was no way to confirm that saved
 * settings (name, accent colour, position, greeting, handoff, quick actions)
 * actually reached the widget. This loads the real public widget.js with the
 * real bot id, so what you see here is exactly what visitors get.
 */
export default function WidgetPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  useEffect(() => {
    if (!id) return
    const s = document.createElement('script')
    s.src = '/widget.js'
    s.async = true
    s.setAttribute('data-bot-id', id)
    document.body.appendChild(s)
    return () => {
      s.remove()
      document.getElementById('ry-widget')?.remove()
    }
  }, [id])

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: 40, background: '#f4f4f5', minHeight: '100vh', color: '#27272a' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Widget Preview</h1>
      <p style={{ fontSize: 13, color: '#71717a', maxWidth: 520, lineHeight: 1.6 }}>
        This is exactly how the chat widget will look and behave on your site, using your saved
        settings. Click the bubble to open it. Changes you save in Settings appear here within
        about 15 seconds — reload if you just saved.
      </p>
    </div>
  )
}
