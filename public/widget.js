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
  var sessionId      = null
  var visitorId      = null
  var isOpen         = false
  var isLoading      = false
  var leadCaptured   = false
  var humanMode      = false
  var sbChannel      = null
  var sbPresence     = null
  var agentPresent   = false
  var orderContext   = null   // set by BOO via window.Replyee.setOrderContext()
  var triggerFired   = false
  var lastPage       = null
  var heartbeatTimer = null
  var typingTimeout  = null
  var config         = { accentColor: '#8b7bf0', name: 'Assistant', greeting: 'Hi! How can I help you today?', fallback: "I don't have that information. Can I take your email so someone can follow up?", handoff: false, triggers: [], position: 'bottom-right' }

  function makeUUID() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
  }

  function makeSessionId() { return makeUUID() }

  // Initialize or retrieve visitor ID
  function initVisitorId() {
    var stored = localStorage.getItem('replyee_visitor_id')
    if (stored) { visitorId = stored } else {
      visitorId = makeUUID()
      localStorage.setItem('replyee_visitor_id', visitorId)
    }
    // Track visits (increment on each page load, reset after 30 minutes inactivity)
    var visits = parseInt(localStorage.getItem('replyee_visits') || '1', 10)
    var lastVisit = parseInt(localStorage.getItem('replyee_last_visit') || '0', 10)
    var now = Date.now()
    if (lastVisit && (now - lastVisit) > 30 * 60 * 1000) {
      visits += 1
    }
    localStorage.setItem('replyee_visits', visits.toString())
    localStorage.setItem('replyee_last_visit', now.toString())
  }

  // ── Styles ─────────────────────────────────────────────────
  var style = document.createElement('style')
  style.textContent = [
    '#ry-widget *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.5}',
    '#ry-bubble{position:fixed;bottom:24px;bottom:calc(24px + env(safe-area-inset-bottom, 0px));right:24px;z-index:2147483646;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform .2s,box-shadow .2s;border:none}',
    '#ry-bubble:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,0.4)}',
    '#ry-window{position:fixed;bottom:90px;bottom:calc(90px + env(safe-area-inset-bottom, 0px));right:24px;z-index:2147483645;width:340px;height:520px;max-width:calc(100vw - 32px);max-height:calc(100vh - 110px);max-height:calc(100dvh - 110px);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 48px rgba(0,0,0,0.4);background:#0f1117;border:1px solid rgba(255,255,255,0.08);transform:scale(0.92) translateY(16px);opacity:0;pointer-events:none;transition:transform .22s ease,opacity .22s ease}',
    '#ry-window.ry-open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}',
    '#ry-header{display:flex;align-items:center;gap:10px;padding:14px 16px;flex-shrink:0}',
    '#ry-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '#ry-bot-name{font-size:14px;font-weight:700;color:#fff}',
    '#ry-status{font-size:11px;color:rgba(255,255,255,0.6)}',
    '#ry-messages{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:12px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent}',
    '.ry-msg{max-width:84%;padding:10px 13px;border-radius:12px;font-size:13px;line-height:1.55;word-wrap:break-word;animation:ry-fadein .18s ease}',
    '.ry-bot{background:rgba(255,255,255,0.07);color:#e2e8f0;border-radius:12px 12px 12px 3px;align-self:flex-start}',
    '.ry-user{color:#fff;border-radius:12px 12px 3px 12px;align-self:flex-end}',
    '.ry-typing{display:flex;gap:4px;padding:12px 14px}',
    '.ry-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.4);animation:ry-bounce 1.2s infinite}',
    '.ry-dot:nth-child(2){animation-delay:.2s}.ry-dot:nth-child(3){animation-delay:.4s}',
    '#ry-input-row{display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,0.07);flex-shrink:0;background:#0a0c12}',
    '#ry-input{flex:1;min-width:0;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:9px 12px;font-size:16px;color:#e2e8f0;outline:none;resize:none}',
    '#ry-input::placeholder{color:rgba(255,255,255,0.3)}',
    '#ry-send{width:40px;height:40px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .15s}',
    '#ry-send:disabled{opacity:0.4;cursor:not-allowed}',
    '#ry-lead-form{padding:16px;background:#0a0c12;border-top:1px solid rgba(255,255,255,0.07)}',
    '#ry-lead-form input{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px 12px;font-size:16px;color:#e2e8f0;outline:none;margin-bottom:8px}',
    '#ry-lead-form input::placeholder{color:rgba(255,255,255,0.3)}',
    '#ry-lead-btn{width:100%;min-height:44px;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:700;color:#fff;cursor:pointer}',
    '#ry-branding{text-align:center;font-size:10px;color:rgba(255,255,255,0.25);padding:6px 6px calc(6px + env(safe-area-inset-bottom, 0px));flex-shrink:0}',
    '#ry-branding a{color:inherit;text-decoration:none}',
    '#ry-quick-actions{display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 10px}',
    '.ry-qa{background:transparent;border:1px solid rgba(255,255,255,0.15);border-radius:20px;color:rgba(255,255,255,0.75);font-size:13px;line-height:1.2;min-height:36px;padding:9px 14px;cursor:pointer;transition:all .15s;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:4px}',
    '.ry-qa:hover{border-color:rgba(255,255,255,0.4);color:#fff;background:rgba(255,255,255,0.06)}',
    '.ry-agent{background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);color:#e2e8f0;border-radius:12px 12px 12px 3px;align-self:flex-start}',
    '.ry-agent-label{font-size:10px;color:#4ade80;font-weight:700;margin-bottom:3px}',
    '#ry-human-btn{background:transparent;border:none;color:rgba(255,255,255,0.45);font-size:13px;line-height:1.2;min-height:44px;cursor:pointer;padding:10px 14px;text-decoration:underline;align-self:center;flex-shrink:0}',
    '#ry-human-btn:hover{color:#fff}',
    '#ry-close{flex-shrink:0}',
    '@keyframes ry-fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '@keyframes ry-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}',
    // ── Large phones / small tablets: keep the floating window, clamp it ──
    '@media (min-width:481px) and (max-width:900px){',
    '  #ry-window{max-width:calc(100vw - 32px);max-height:calc(100vh - 110px);max-height:calc(100dvh - 110px)}',
    '}',
    // ── Small phones: full-screen sheet (Intercom/Crisp style) ──
    '@media (max-width:480px){',
    '  #ry-window{top:0 !important;right:0 !important;bottom:0 !important;left:0 !important;width:100% !important;max-width:100% !important;height:100vh;height:100dvh;max-height:100vh;max-height:100dvh;border-radius:0;border:none;box-shadow:none}',
    '  #ry-widget.ry-fullscreen #ry-bubble{display:none}',
    '  #ry-header{padding:12px 12px;min-height:56px}',
    '  #ry-close{width:44px !important;height:44px !important;padding:0 !important;border-radius:10px}',
    '  #ry-messages{padding:12px 12px 4px}',
    '  #ry-widget input,#ry-widget textarea{font-size:16px}',
    '  #ry-input{padding:11px 12px}',
    '  #ry-send{width:44px;height:44px}',
    '  .ry-qa{min-height:44px;font-size:14px;padding:11px 16px}',
    '  #ry-human-btn{min-height:44px;font-size:14px}',
    '  #ry-input-row{padding-bottom:10px}',
    '  #ry-branding{padding-bottom:calc(6px + env(safe-area-inset-bottom, 0px))}',
    '}',
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
    '  <button id="ry-close" aria-label="Close chat" style="margin-left:auto;background:transparent;border:none;color:rgba(255,255,255,0.5);cursor:pointer;padding:0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:10px;">' + svgClose() + '</button>',
    '</div>',
    '<div id="ry-messages"></div>',
    '<div id="ry-quick-actions" style="display:none"></div>',
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
  var msgs        = win.querySelector('#ry-messages')
  var input       = win.querySelector('#ry-input')
  var send        = win.querySelector('#ry-send')
  var close       = win.querySelector('#ry-close')
  var humanBtn    = win.querySelector('#ry-human-btn')
  var statusEl    = win.querySelector('#ry-status')
  var quickActions = win.querySelector('#ry-quick-actions')

  // ── Initialize visitor tracking ───────────────────────────
  initVisitorId()
  lastPage = location.href

  // ── Quick-action chips (Get Directions, Call Us) ──────────
  function renderQuickActions() {
    if (!quickActions) return
    var chips = []
    if (config.restaurantAddress) {
      var mapsUrl = 'https://maps.google.com/?q=' + encodeURIComponent(config.restaurantAddress)
      chips.push('<a class="ry-qa" href="' + mapsUrl + '" target="_blank" rel="noopener">&#128205; Get Directions</a>')
    }
    if (config.restaurantPhone) {
      var tel = config.restaurantPhone.replace(/[^\d+]/g, '')
      chips.push('<a class="ry-qa" href="tel:' + tel + '">&#128222; Call Us</a>')
    }
    if (config.restaurantHours) {
      chips.push('<button class="ry-qa" onclick="this.closest(\'#ry-widget\').querySelector(\'#ry-input\').value=\'What are your hours?\';this.closest(\'#ry-widget\').querySelector(\'#ry-send\').click()">&#128337; Hours</button>')
    }
    if (chips.length > 0) {
      quickActions.innerHTML = chips.join('')
      quickActions.style.display = 'flex'
    }
  }

  // ── Widget position (bottom-right default, or bottom-left) ──
  function applyPosition(pos) {
    var left = pos === 'bottom-left'
    bubble.style.right = left ? 'auto' : '24px'
    bubble.style.left  = left ? '24px' : 'auto'
    win.style.right    = left ? 'auto' : '24px'
    win.style.left     = left ? '24px' : 'auto'
  }

  // ── Load bot config ────────────────────────────────────────
  function loadBotConfig() {
    fetch(API_BASE + '/api/bot-config?id=' + BOT_ID)
      .then(function (r) { return r.ok ? r.json() : null })
      .then(function (data) {
        if (!data) return
        config = Object.assign(config, data)
        applyPosition(config.position)
        bubble.style.background = config.accentColor
        win.querySelector('#ry-avatar').style.background = config.accentColor
        win.querySelector('#ry-send').style.background   = config.accentColor
        win.querySelector('#ry-bot-name').textContent    = config.name
        if (config.handoff) humanBtn.style.display = 'block'
        addBotMsg(config.greeting)
        renderQuickActions()
        // Evaluate triggers after config loads
        evaluateTriggers()
        // Start heartbeat and presence tracking
        startHeartbeat()
        subscribeToPresence()
      })
      .catch(function () { addBotMsg(config.greeting) })
  }
  loadBotConfig()

  // ── Heartbeat (visitor session tracking) ───────────────────
  function sendHeartbeat() {
    fetch(API_BASE + '/api/visitor-heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: BOT_ID,
        visitorId: visitorId,
        sessionId: sessionId || null,
        page: location.href,
        referrer: document.referrer,
        utm: parseUTM(),
        device: getDevice(),
      }),
    }).catch(function () {})
  }

  function startHeartbeat() {
    sendHeartbeat() // Fire immediately
    heartbeatTimer = setInterval(sendHeartbeat, 30 * 1000) // Then every 30s
  }

  function parseUTM() {
    var params = {}
    var search = location.search.substring(1)
    var pairs = search.split('&')
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split('=')
      if (pair[0].startsWith('utm_')) {
        params[pair[0]] = decodeURIComponent(pair[1] || '')
      }
    }
    return Object.keys(params).length > 0 ? params : null
  }

  function getDevice() {
    var ua = navigator.userAgent
    if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return 'mobile'
    if (/tablet|ipad|android/i.test(ua)) return 'tablet'
    return 'desktop'
  }

  // ── Agent presence ─────────────────────────────────────────
  function subscribeToPresence() {
    if (!config.supabaseUrl || !config.supabaseAnonKey) return
    loadSupabase(function () {
      try {
        var client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
        sbPresence = client.channel('replyee-presence-' + BOT_ID)
        sbPresence
          .on('presence', { event: 'sync' }, function () {
            var agents = sbPresence.presenceState()
            agentPresent = Object.keys(agents).length > 0
            updatePresenceStatus()
          })
          .subscribe()
      } catch (err) {
        console.warn('[Replyee] presence unavailable', err)
      }
    })
  }

  function updatePresenceStatus() {
    if (!statusEl) return
    if (humanMode) {
      statusEl.innerHTML = '&#9679; Live with a team member'
    } else if (agentPresent) {
      statusEl.innerHTML = '&#9679; We\'re typically online'
    } else {
      statusEl.innerHTML = '&#9679; Leave a message'
    }
  }

  // ── Proactive triggers ─────────────────────────────────────
  function evaluateTriggers() {
    if (!config.triggers || config.triggers.length === 0 || triggerFired) return
    var triggers = config.triggers

    for (var i = 0; i < triggers.length; i++) {
      var rule = triggers[i]
      var shouldFire = false

      if (rule.type === 'time_on_page' && rule.value) {
        shouldFire = true
        setTimeout(function (msg) {
          if (!isOpen && !triggerFired) {
            triggerFired = true
            openChat()
            if (msg) addBotMsg(msg)
          }
        }, rule.value * 1000, rule.message)
      }

      if (rule.type === 'url_contains' && rule.value && location.href.includes(rule.value)) {
        shouldFire = true
        if (!isOpen && !triggerFired) {
          triggerFired = true
          openChat()
          if (rule.message) addBotMsg(rule.message)
        }
      }

      if (rule.type === 'exit_intent' && rule.value) {
        shouldFire = true
        document.addEventListener('mouseleave', function (event) {
          if (!isOpen && !triggerFired && event.clientY < 0) {
            triggerFired = true
            openChat()
            if (rule.message) addBotMsg(rule.message)
          }
        })
      }

      if (rule.type === 'return_visitor' && rule.value) {
        var visits = parseInt(localStorage.getItem('replyee_visits') || '1', 10)
        if (visits > 1) {
          shouldFire = true
          if (!isOpen && !triggerFired) {
            triggerFired = true
            openChat()
            if (rule.message) addBotMsg(rule.message)
          }
        }
      }
    }
  }

  // ── Toggle open/close ──────────────────────────────────────
  function openChat() {
    isOpen = true
    win.classList.add('ry-open')
    // Lets the mobile stylesheet hide the launcher bubble behind the full-screen sheet
    widget.classList.add('ry-fullscreen')
    bubble.innerHTML = svgClose()
    bubble.setAttribute('aria-label', 'Close chat')
    setTimeout(function () { input.focus() }, 240)
  }

  function closeChat() {
    isOpen = false
    win.classList.remove('ry-open')
    widget.classList.remove('ry-fullscreen')
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

  // ── Typing indicator (visitor typing) ──────────────────────
  input.addEventListener('input', function () {
    if (humanMode && sbChannel && visitorId) {
      clearTimeout(typingTimeout)
      sbChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { visitorId: visitorId },
      })
      typingTimeout = setTimeout(function () {
        sbChannel.send({
          type: 'broadcast',
          event: 'typing_stop',
          payload: { visitorId: visitorId },
        })
      }, 2000)
    }
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
