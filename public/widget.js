;(function () {
  'use strict'

  // Read config from script tag attributes
  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script')
    return scripts[scripts.length - 1]
  })()

  var BOT_ID   = script.getAttribute('data-bot-id')
  var API_BASE = script.getAttribute('data-api-url') || 'https://replyee.online'

  if (!BOT_ID) { console.warn('[Replyee] Missing data-bot-id attribute'); return }

  // ── State ──────────────────────────────────────────────────
  var sessionId    = null
  var isOpen       = false
  var isLoading    = false
  var leadCaptured = false
  var humanMode    = false
  var sbChannel    = null
  var orderContext = null   // set by BOO via window.Replyee.setOrderContext()
  var config       = { accentColor: '#6366f1', name: 'Assistant', greeting: 'Hi! How can I help you today?', fallback: "I don't have that information. Can I take your email so someone can follow up?", handoff: false }

  function makeSessionId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
  }

  // ── Styles ─────────────────────────────────────────────────
  var style = document.createElement('style')
  style.textContent = [
    '#ry-widget *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.5}',
    '#ry-bubble{position:fixed;bottom:24px;right:24px;z-index:2147483646;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform .2s,box-shadow .2s;border:none}',
    '#ry-bubble:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,0.4)}',
    '#ry-window{position:fixed;bottom:90px;right:24px;z-index:2147483645;width:340px;height:520px;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 48px rgba(0,0,0,0.4);background:#0f1117;border:1px solid rgba(255,255,255,0.08);transform:scale(0.92) translateY(16px);opacity:0;pointer-events:none;transition:transform .22s ease,opacity .22s ease}',
    '#ry-window.ry-open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}',
    '#ry-header{display:flex;align-items:center;gap:10px;padding:14px 16px;flex-shrink:0}',
    '#ry-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '#ry-bot-name{font-size:14px;font-weight:700;color:#fff}',
    '#ry-status{font-size:11px;color:rgba(255,255,255,0.6)}',
    '#ry-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent}',
    '.ry-msg{max-width:84%;padding:10px 13px;border-radius:12px;font-size:13px;line-height:1.55;word-wrap:break-word;animation:ry-fadein .18s ease}',
    '.ry-bot{background:rgba(255,255,255,0.07);color:#e2e8f0;border-radius:12px 12px 12px 3px;align-self:flex-start}',
    '.ry-user{color:#fff;border-radius:12px 12px 3px 12px;align-self:flex-end}',
    '.ry-typing{display:flex;gap:4px;padding:12px 14px}',
    '.ry-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.4);animation:ry-bounce 1.2s infinite}',
    '.ry-dot:nth-child(2){animation-delay:.2s}.ry-dot:nth-child(3){animation-delay:.4s}',
    '#ry-input-row{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,0.07);flex-shrink:0;background:#0a0c12}',
    '#ry-input{flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:9px 12px;font-size:13px;color:#e2e8f0;outline:none;resize:none}',
    '#ry-input::placeholder{color:rgba(255,255,255,0.3)}',
    '#ry-send{width:36px;height:36px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .15s}',
    '#ry-send:disabled{opacity:0.4;cursor:not-allowed}',
    '#ry-lead-form{padding:16px;background:#0a0c12;border-top:1px solid rgba(255,255,255,0.07)}',
    '#ry-lead-form input{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:9px 12px;font-size:13px;color:#e2e8f0;outline:none;margin-bottom:8px}',
    '#ry-lead-form input::placeholder{color:rgba(255,255,255,0.3)}',
    '#ry-lead-btn{width:100%;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:700;color:#fff;cursor:pointer}',
    '#ry-branding{text-align:center;font-size:10px;color:rgba(255,255,255,0.25);padding:6px;flex-shrink:0}',
    '#ry-branding a{color:inherit;text-decoration:none}',
    '.ry-agent{background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);color:#e2e8f0;border-radius:12px 12px 12px 3px;align-self:flex-start}',
    '.ry-agent-label{font-size:10px;color:#4ade80;font-weight:700;margin-bottom:3px}',
    '#ry-human-btn{background:transparent;border:none;color:rgba(255,255,255,0.45);font-size:11px;cursor:pointer;padding:4px 0;text-decoration:underline;align-self:center;flex-shrink:0}',
    '#ry-human-btn:hover{color:#fff}',
    '@keyframes ry-fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '@keyframes ry-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}',
  ].join('')
  document.head.appendChild(style)

  // ── SVG icons ──────────────────────────────────────────────
  function svgChat() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
  }
  function svgClose() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  }
  function svgSend() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
  }

  // ── Build DOM ──────────────────────────────────────────────
  var widget = document.createElement('div')
  widget.id = 'ry-widget'

  // Bubble
  var bubble = document.createElement('button')
  bubble.id = 'ry-bubble'
  bubble.style.background = config.accentColor
  bubble.style.color = '#fff'
  bubble.innerHTML = svgChat()
  bubble.setAttribute('aria-label', 'Open chat')

  // Window
  var win = document.createElement('div')
  win.id = 'ry-window'
  win.setAttribute('role', 'dialog')
  win.setAttribute('aria-label', 'Chat window')

  win.innerHTML = [
    '<div id="ry-header">',
    '  <div id="ry-avatar" style="background:' + config.accentColor + '">' + svgChat() + '</div>',
    '  <div>',
    '    <div id="ry-bot-name">' + config.name + '</div>',
    '    <div id="ry-status">&#9679; Online</div>',
    '  </div>',
    '  <button id="ry-close" style="margin-left:auto;background:transparent;border:none;color:rgba(255,255,255,0.5);cursor:pointer;padding:4px;">' + svgClose() + '</button>',
    '</div>',
    '<div id="ry-messages"></div>',
    '<button id="ry-human-btn" style="display:none">Talk to a human</button>',
    '<div id="ry-input-row">',
    '  <input id="ry-input" placeholder="Ask a question…" rows="1" />',
    '  <button id="ry-send" style="background:' + config.accentColor + ';color:#fff;">' + svgSend() + '</button>',
    '</div>',
    '<div id="ry-branding"><a href="https://replyee.online" target="_blank" rel="noopener">Powered by Replyee</a></div>',
  ].join('')

  widget.appendChild(bubble)
  widget.appendChild(win)
  document.body.appendChild(widget)

  // ── References ────────────────────────────────────────────
  var msgs     = win.querySelector('#ry-messages')
  var input    = win.querySelector('#ry-input')
  var send     = win.querySelector('#ry-send')
  var close    = win.querySelector('#ry-close')
  var humanBtn = win.querySelector('#ry-human-btn')
  var statusEl = win.querySelector('#ry-status')

  // ── Load bot config ────────────────────────────────────────
  fetch(API_BASE + '/api/bot-config?id=' + BOT_ID)
    .then(function (r) { return r.ok ? r.json() : null })
    .then(function (data) {
      if (!data) return
      config = Object.assign(config, data)
      bubble.style.background = config.accentColor
      win.querySelector('#ry-avatar').style.background = config.accentColor
      win.querySelector('#ry-send').style.background   = config.accentColor
      win.querySelector('#ry-bot-name').textContent    = config.name
      if (config.handoff) humanBtn.style.display = 'block'
      addBotMsg(config.greeting)
    })
    .catch(function () { addBotMsg(config.greeting) })

  // ── Toggle open/close ──────────────────────────────────────
  function openChat() {
    isOpen = true
    win.classList.add('ry-open')
    bubble.innerHTML = svgClose()
    bubble.setAttribute('aria-label', 'Close chat')
    setTimeout(function () { input.focus() }, 240)
  }

  function closeChat() {
    isOpen = false
    win.classList.remove('ry-open')
    bubble.innerHTML = svgChat()
    bubble.setAttribute('aria-label', 'Open chat')
  }

  bubble.addEventListener('click', function () { isOpen ? closeChat() : openChat() })
  close.addEventListener('click', closeChat)

  // ── Messages ───────────────────────────────────────────────
  function addBotMsg(text) {
    var el = document.createElement('div')
    el.className = 'ry-msg ry-bot'
    el.textContent = text
    msgs.appendChild(el)
    scrollToBottom()
    return el
  }

  function addUserMsg(text) {
    var el = document.createElement('div')
    el.className = 'ry-msg ry-user'
    el.style.background = config.accentColor
    el.textContent = text
    msgs.appendChild(el)
    scrollToBottom()
  }

  function addTyping() {
    var el = document.createElement('div')
    el.className = 'ry-msg ry-bot ry-typing'
    el.id = 'ry-typing'
    el.innerHTML = '<span class="ry-dot"></span><span class="ry-dot"></span><span class="ry-dot"></span>'
    msgs.appendChild(el)
    scrollToBottom()
    return el
  }

  function scrollToBottom() {
    msgs.scrollTop = msgs.scrollHeight
  }

  function addAgentMsg(text) {
    var el = document.createElement('div')
    el.className = 'ry-msg ry-agent'
    el.innerHTML = '<div class="ry-agent-label">Team member</div>'
    var body = document.createElement('div')
    body.textContent = text
    el.appendChild(body)
    msgs.appendChild(el)
    scrollToBottom()
  }

  // ── Live chat (human takeover via Supabase Realtime broadcast) ──
  function loadSupabase(cb) {
    if (window.supabase && window.supabase.createClient) return cb()
    var s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
    s.onload = cb
    s.onerror = function () { console.warn('[Replyee] Could not load realtime library') }
    document.head.appendChild(s)
  }

  function joinSessionChannel() {
    if (!config.supabaseUrl || !config.supabaseAnonKey || sbChannel) return
    loadSupabase(function () {
      try {
        var client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
        sbChannel = client.channel('replyee-session-' + sessionId)
        sbChannel
          .on('broadcast', { event: 'agent_message' }, function (e) {
            var typing = document.getElementById('ry-typing')
            if (typing) typing.remove()
            addAgentMsg(e.payload.content)
            setStatus('human')
          })
          .on('broadcast', { event: 'mode' }, function (e) {
            if (e.payload.mode === 'bot') {
              humanMode = false
              setStatus('bot')
              addBotMsg("I'm back! Ask me anything.")
            } else if (e.payload.mode === 'closed') {
              humanMode = false
              setStatus('bot')
            } else {
              setStatus('human')
            }
          })
          .subscribe()
      } catch (err) {
        console.warn('[Replyee] realtime unavailable', err)
      }
    })
  }

  function setStatus(mode) {
    if (!statusEl) return
    if (mode === 'waiting') statusEl.innerHTML = '&#9679; Connecting you with the team…'
    else if (mode === 'human') statusEl.innerHTML = '&#9679; Live with a team member'
    else statusEl.innerHTML = '&#9679; Online'
  }

  function requestHuman() {
    if (humanMode) return
    if (!sessionId) sessionId = makeSessionId()
    humanMode = true
    humanBtn.style.display = 'none'
    setStatus('waiting')
    addBotMsg("You're being connected with a team member. Feel free to keep typing — they'll see your messages.")
    joinSessionChannel()
    fetch(API_BASE + '/api/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId: BOT_ID, sessionId: sessionId }),
    }).catch(function () {
      addBotMsg('Sorry, I couldn’t reach the team right now. You can leave your email instead.')
      showLeadForm()
    })
  }

  humanBtn.addEventListener('click', requestHuman)

  // ── Public API (called by BOO ordering page) ───────────────
  // BOO calls this whenever cart/order state changes so the bot
  // and Live Inbox agents always have the latest order context.
  //
  //   window.Replyee.setOrderContext({
  //     orderId: 'abc123',
  //     status:  'confirmed',
  //     items:   ['Burrito Bowl', 'Horchata'],
  //     total:   45.20,
  //     customerEmail: 'pat@example.com',
  //   })
  window.Replyee = {
    setOrderContext: function (ctx) {
      orderContext = ctx || null
      // If the visitor is actively in human-mode chat, broadcast the updated
      // context so the agent's inbox reflects the latest cart/order state.
      if (sbChannel && humanMode && ctx) {
        sbChannel.send({
          type: 'broadcast',
          event: 'order_context',
          payload: ctx,
        })
      }
    },
    open:  openChat,
    close: closeChat,
  }

  // ── Send message ───────────────────────────────────────────
  function sendMessage() {
    var text = input.value.trim()
    if (!text || isLoading) return
    input.value = ''
    addUserMsg(text)
    isLoading = true
    send.disabled = true
    var typing = humanMode ? null : addTyping()

    fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId: BOT_ID, message: text, sessionId: sessionId, orderContext: orderContext }),
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (typing) typing.remove()
        if (data.sessionId) sessionId = data.sessionId
        if (data.human) {
          // A human agent owns this chat — replies arrive over realtime
          if (!humanMode) { humanMode = true; setStatus('human'); joinSessionChannel() }
        } else if (data.answer) {
          addBotMsg(data.answer)
          // Show lead capture if answer suggests it can't help
          if (!leadCaptured && /don't have|not sure|can't find|contact|email/i.test(data.answer)) {
            showLeadForm()
          }
        } else {
          addBotMsg(config.fallback)
          if (!leadCaptured) showLeadForm()
        }
      })
      .catch(function () {
        if (typing) typing.remove()
        addBotMsg('Sorry, something went wrong. Please try again.')
      })
      .finally(function () {
        isLoading = false
        send.disabled = false
        input.focus()
      })
  }

  send.addEventListener('click', sendMessage)
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  })

  // ── Lead capture form ──────────────────────────────────────
  function showLeadForm() {
    if (leadCaptured || win.querySelector('#ry-lead-form')) return
    var form = document.createElement('div')
    form.id = 'ry-lead-form'
    form.innerHTML = [
      '<p style="font-size:12px;color:rgba(255,255,255,0.5);margin:0 0 8px">Get a direct answer — leave your email:</p>',
      '<input type="email" id="ry-lead-email" placeholder="you@example.com" />',
      '<button id="ry-lead-btn" style="background:' + config.accentColor + '">Send Me an Answer</button>',
    ].join('')
    win.querySelector('#ry-input-row').before(form)

    win.querySelector('#ry-lead-btn').addEventListener('click', function () {
      var email = win.querySelector('#ry-lead-email').value.trim()
      if (!email || !/\S+@\S+\.\S+/.test(email)) return
      leadCaptured = true
      fetch(API_BASE + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: BOT_ID, email: email, sessionId: sessionId }),
      })
      form.innerHTML = '<p style="font-size:13px;color:#4ade80;text-align:center;padding:4px 0">&#10003; Got it! We\'ll be in touch shortly.</p>'
      setTimeout(function () { form.remove() }, 3000)
    })
  }
})()
