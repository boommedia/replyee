import { Resend } from 'resend'

const FROM = 'Replyee <hello@replyee.online>'
const getResend = () => new Resend(process.env.RESEND_API_KEY)

// ── Welcome email after signup ────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Replyee — your first chatbot is waiting 👋',
    html: welcomeHtml(name),
  })
}

// ── Lead capture alert to bot owner ──────────────────────────
export async function sendLeadAlert(opts: {
  to: string
  botName: string
  visitorEmail: string
  question: string
}) {
  return getResend().emails.send({
    from: 'Replyee <leads@replyee.online>',
    to: opts.to,
    subject: `🔔 New lead from your ${opts.botName} chatbot`,
    html: leadAlertHtml(opts),
  })
}

// ── Live chat: visitor requested a human ─────────────────────
export async function sendHandoffAlert(opts: {
  to: string
  botName: string
  lastQuestion: string
}) {
  return getResend().emails.send({
    from: 'Replyee <leads@replyee.online>',
    to: opts.to,
    subject: `💬 A visitor is waiting for a human reply — ${opts.botName}`,
    html: handoffAlertHtml(opts),
  })
}

// ── Trial expiry warning (3 days before) ─────────────────────
export async function sendTrialExpiryEmail(to: string, name: string, daysLeft: number) {
  return getResend().emails.send({
    from: 'Eric at Replyee <eric@replyee.online>',
    to,
    subject: `Your Replyee trial ends in ${daysLeft} days — here's what happens next`,
    html: trialExpiryHtml(name, daysLeft),
  })
}

// ── Payment failed ────────────────────────────────────────────
export async function sendPaymentFailedEmail(to: string, name: string, amount: string) {
  return getResend().emails.send({
    from: 'Replyee Billing <billing@replyee.online>',
    to,
    subject: 'Action required: payment failed for your Replyee subscription',
    html: paymentFailedHtml(name, amount),
  })
}

// ── BOO new order alert to bot owner ─────────────────────────
export async function sendBooOrderAlert(opts: {
  to: string
  botName: string
  orderId: string
  status: string
  items: string[]
  total: number
  customerEmail: string | null
}) {
  return getResend().emails.send({
    from: 'Replyee <orders@replyee.online>',
    to: opts.to,
    subject: `🛍️ New order placed — ${opts.botName}`,
    html: booOrderAlertHtml(opts),
  })
}

// ── Daily activity report ──────────────────────────────────────
export async function sendDailyReport(opts: {
  to: string
  botName: string
  date: string
  visitorsTotal: number
  visitorsNew: number
  visitorsReturning: number
  conversations: number
  missedChats: number
  leadsCount: number
  aiResolutionRate: number
  triggeredAuto: number
  respondedAuto: number
  triggeredManual: number
  respondedManual: number
  topPages: Array<{ path: string; views: number }>
  sources: Array<{ name: string; count: number }>
}) {
  return getResend().emails.send({
    from: 'Replyee <reports@replyee.online>',
    to: opts.to,
    subject: `📊 Your daily Replyee report — ${opts.date}`,
    html: dailyReportHtml(opts),
  })
}

// ── Monthly usage report ──────────────────────────────────────
export async function sendMonthlyReport(opts: {
  to: string
  name: string
  month: string
  conversations: number
  resolutionRate: number
  leadsCount: number
}) {
  return getResend().emails.send({
    from: 'Replyee <reports@replyee.online>',
    to: opts.to,
    subject: `Your Replyee ${opts.month} summary — ${opts.conversations.toLocaleString()} conversations handled 🎉`,
    html: monthlyReportHtml(opts),
  })
}

// ── Password reset ────────────────────────────────────────────
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return getResend().emails.send({
    from: 'Replyee <auth@replyee.online>',
    to,
    subject: 'Reset your Replyee password',
    html: passwordResetHtml(resetUrl),
  })
}

// ── HTML templates ─────────────────────────────────────────────

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  background: #ffffff; color: #1a202c; margin: 0; padding: 0;
`
const headerHtml = `
  <div style="background:#0B0B0F;padding:28px 40px;display:flex;align-items:center;gap:10px">
    <div style="width:30px;height:30px;background:#8b7bf0;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle">
      <span style="color:#fff;font-size:14px">✦</span>
    </div>
    <span style="font-weight:900;font-size:18px;color:#fff;margin-left:8px;letter-spacing:-0.5px">Replyee</span>
    <span style="font-size:12px;color:#8B8B99;margin-left:4px">by Boom Media</span>
  </div>
`
const footerHtml = `
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center">
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0">
      by Boom Media &nbsp;·&nbsp;
      <a href="https://replyee.online/unsubscribe" style="color:#8b7bf0">Unsubscribe</a> &nbsp;·&nbsp;
      <a href="https://replyee.online/privacy" style="color:#8b7bf0">Privacy Policy</a><br>
      © 2026 Boom Media. All rights reserved.
    </p>
  </div>
`

function welcomeHtml(name: string) {
  return `<!DOCTYPE html><html><body style="${baseStyle}">
    ${headerHtml}
    <div style="padding:36px 40px">
      <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#0f172a;margin:0 0 16px">
        You're in. Let's build your AI chatbot.
      </h1>
      <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 16px">Hi ${name},</p>
      <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 16px">
        Welcome to Replyee! Your 14-day free trial has started. No credit card required.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:20px 0">
        <div style="font-size:14px;color:#334155;margin-bottom:8px"><strong>Step 1</strong> &nbsp; Create a chatbot from your dashboard</div>
        <div style="font-size:14px;color:#334155;margin-bottom:8px"><strong>Step 2</strong> &nbsp; Upload a PDF or paste your website URL</div>
        <div style="font-size:14px;color:#334155"><strong>Step 3</strong> &nbsp; Copy your embed code and add it to your site</div>
      </div>
      <a href="https://replyee.online/dashboard" style="display:inline-block;background:#8b7bf0;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;margin:8px 0 24px">
        Open My Dashboard →
      </a>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0">
      <p style="font-size:13px;color:#64748b;line-height:1.6">
        Questions? Just reply to this email — we actually respond.
      </p>
    </div>
    ${footerHtml}
  </body></html>`
}

function leadAlertHtml(opts: { botName: string; visitorEmail: string; question: string }) {
  return `<!DOCTYPE html><html><body style="${baseStyle}">
    ${headerHtml}
    <div style="padding:36px 40px">
      <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 16px">
        A visitor left their details for you
      </h1>
      <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 20px">
        Your chatbot <strong>${opts.botName}</strong> couldn't fully answer a visitor's question.
      </p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px 24px;margin:0 0 24px">
        <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:12px;text-transform:uppercase;letter-spacing:.06em">Lead Details</div>
        <div style="font-size:14px;color:#334155;margin-bottom:8px"><strong>Email:</strong> <a href="mailto:${opts.visitorEmail}" style="color:#8b7bf0">${opts.visitorEmail}</a></div>
        <div style="font-size:14px;color:#334155;margin-bottom:8px"><strong>Question:</strong> "${opts.question}"</div>
        <div style="font-size:14px;color:#334155"><strong>Bot:</strong> ${opts.botName}</div>
      </div>
      <a href="mailto:${opts.visitorEmail}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
        Reply to Visitor →
      </a>
      <br><br>
      <a href="https://replyee.online/dashboard/bots" style="font-size:13px;color:#8b7bf0">View all leads in dashboard →</a>
    </div>
    ${footerHtml}
  </body></html>`
}

function handoffAlertHtml(opts: { botName: string; lastQuestion: string }) {
  return `<!DOCTYPE html><html><body style="${baseStyle}">
    ${headerHtml}
    <div style="padding:36px 40px">
      <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 16px">
        A visitor wants to talk to a human — right now
      </h1>
      <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 20px">
        Someone chatting with <strong>${opts.botName}</strong> asked for a team member.
        Jump into the Live Inbox to reply while they're still on the site.
      </p>
      <div style="background:#f2effc;border:1px solid #d8cff9;border-radius:10px;padding:20px 24px;margin:0 0 24px">
        <div style="font-size:13px;font-weight:700;color:#4b3a9c;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">Their last message</div>
        <div style="font-size:14px;color:#334155">"${opts.lastQuestion}"</div>
      </div>
      <a href="https://replyee.online/dashboard/inbox" style="display:inline-block;background:#8b7bf0;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none">
        Open Live Inbox →
      </a>
    </div>
    ${footerHtml}
  </body></html>`
}

function trialExpiryHtml(name: string, daysLeft: number) {
  return `<!DOCTYPE html><html><body style="${baseStyle}">
    ${headerHtml}
    <div style="padding:36px 40px">
      <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 16px">
        Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Keep the momentum going.
      </h1>
      <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 16px">Hey ${name},</p>
      <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 20px">
        Your Replyee trial ends in <strong>${daysLeft} days</strong>. To keep your bot live, pick a plan below.
      </p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:20px 24px;margin:0 0 24px">
        <p style="font-size:14px;color:#78350f;margin:0">
          If you don't upgrade, your chatbot will be paused. Your data is kept for 30 days.
        </p>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin:0 0 24px">
        <div style="font-size:16px;font-weight:900;color:#8b7bf0;margin-bottom:4px">Starter — $25/month</div>
        <div style="font-size:13px;color:#374151;margin-bottom:12px">1 chatbot · 500 conversations/mo · Custom branding · Lead capture</div>
        <a href="https://replyee.online/dashboard/settings" style="display:inline-block;background:#8b7bf0;color:#fff;font-weight:700;font-size:13px;padding:10px 20px;border-radius:7px;text-decoration:none">Start Starter Plan →</a>
      </div>
      <a href="https://replyee.online/dashboard/settings" style="display:inline-block;background:#8b7bf0;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none">
        Choose a Plan →
      </a>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0">
      <p style="font-size:13px;color:#64748b">Reply to this email if you need help choosing. — Eric, Replyee</p>
    </div>
    ${footerHtml}
  </body></html>`
}

function paymentFailedHtml(name: string, amount: string) {
  return `<!DOCTYPE html><html><body style="${baseStyle}">
    ${headerHtml}
    <div style="padding:36px 40px">
      <div style="width:48px;height:48px;background:#fef2f2;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px">
        <span style="font-size:24px">⚠️</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 16px">We couldn't process your payment</h1>
      <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 20px">
        Hi ${name}, your payment of <strong>${amount}</strong> failed. Please update your payment method to avoid interruption.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px 24px;margin:0 0 24px">
        <div style="font-size:14px;color:#7f1d1d">Your chatbot will stay active for 3 more days while we retry. If payment still fails after 7 days, your bot will be paused.</div>
      </div>
      <a href="https://replyee.online/dashboard/settings" style="display:inline-block;background:#ef4444;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none">
        Update Payment Method →
      </a>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0">
      <p style="font-size:13px;color:#64748b">Need help? Reply to this email or <a href="mailto:eric@boommedia.us" style="color:#8b7bf0">contact support</a>.</p>
    </div>
    ${footerHtml}
  </body></html>`
}

function monthlyReportHtml(opts: {
  name: string; month: string
  conversations: number; resolutionRate: number; leadsCount: number
}) {
  return `<!DOCTYPE html><html><body style="${baseStyle}">
    ${headerHtml}
    <div style="padding:36px 40px">
      <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 16px">${opts.month} — Your monthly summary</h1>
      <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 24px">Hi ${opts.name}, here's what your Replyee chatbots accomplished this month.</p>
      <div style="display:flex;gap:16px;margin:0 0 24px">
        <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:900;color:#8b7bf0">${opts.conversations.toLocaleString()}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px">Conversations</div>
        </div>
        <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:900;color:#4ade80">${opts.resolutionRate}%</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px">Resolved by AI</div>
        </div>
        <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:900;color:#f97316">${opts.leadsCount}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px">Leads Captured</div>
        </div>
      </div>
      <a href="https://replyee.online/dashboard/analytics" style="display:inline-block;background:#8b7bf0;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none">
        View Full Analytics →
      </a>
    </div>
    ${footerHtml}
  </body></html>`
}

function booOrderAlertHtml(opts: {
  botName: string; orderId: string; status: string
  items: string[]; total: number; customerEmail: string | null
}) {
  const itemsList = opts.items.map(i => `<div style="font-size:13px;color:#475569;padding:2px 0">${i}</div>`).join('')
  return `<!DOCTYPE html><html><body style="${baseStyle}">
    ${headerHtml}
    <div style="padding:36px 40px">
      <div style="width:48px;height:48px;background:#fef9c3;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:22px">🛍️</div>
      <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 12px">New order from a chatbot visitor</h1>
      <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 20px">
        A visitor who chatted with <strong>${opts.botName}</strong> just placed an order.
        They may have follow-up questions — you can message them in the Live Inbox.
      </p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:20px 24px;margin:0 0 24px">
        <div style="font-size:11px;font-weight:700;color:#92400e;margin-bottom:14px;text-transform:uppercase;letter-spacing:.06em">Order Details</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:14px;color:#334155"><strong>Order ID:</strong></span>
          <span style="font-size:14px;font-weight:700;color:#92400e">#${opts.orderId.slice(0, 8)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:14px;color:#334155"><strong>Status:</strong></span>
          <span style="font-size:12px;font-weight:700;background:#dcfce7;color:#166534;padding:3px 10px;border-radius:20px">${opts.status}</span>
        </div>
        <div style="margin-bottom:12px">
          <div style="font-size:14px;color:#334155;font-weight:600;margin-bottom:6px">Items:</div>
          <div style="padding-left:12px">${itemsList}</div>
        </div>
        <div style="border-top:1px solid #fde68a;padding-top:12px;display:flex;justify-content:space-between">
          <span style="font-size:14px;font-weight:700;color:#334155">Total</span>
          <span style="font-size:18px;font-weight:900;color:#92400e">$${opts.total.toFixed(2)}</span>
        </div>
        ${opts.customerEmail ? `<div style="margin-top:10px;font-size:13px;color:#64748b"><strong>Customer:</strong> ${opts.customerEmail}</div>` : ''}
      </div>
      <a href="https://replyee.online/dashboard/inbox" style="display:inline-block;background:#8b7bf0;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;margin-right:12px">
        Open Live Inbox →
      </a>
    </div>
    ${footerHtml}
  </body></html>`
}

function dailyReportHtml(opts: {
  botName: string; date: string
  visitorsTotal: number; visitorsNew: number; visitorsReturning: number
  conversations: number; missedChats: number; leadsCount: number; aiResolutionRate: number
  triggeredAuto: number; respondedAuto: number; triggeredManual: number; respondedManual: number
  topPages: Array<{ path: string; views: number }>
  sources: Array<{ name: string; count: number }>
}) {
  const newPct = opts.visitorsTotal > 0 ? Math.round((opts.visitorsNew / opts.visitorsTotal) * 100) : 0
  const topPagesRows = opts.topPages.map(p =>
    `<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 16px;color:#8b7bf0">${p.path}</td><td style="padding:10px 16px;text-align:right;font-weight:700;color:#334155">${p.views}</td></tr>`
  ).join('')
  const sourcesRows = opts.sources.map(s =>
    `<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 16px;color:#475569">${s.name}</td><td style="padding:10px 16px;text-align:right;font-weight:700;color:#334155">${s.count}</td></tr>`
  ).join('')

  return `<!DOCTYPE html><html><body style="${baseStyle}">
    ${headerHtml}
    <div style="padding:28px 40px 8px">
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 4px">Your daily report</h1>
      <p style="font-size:14px;color:#64748b;margin:0">${opts.date} · ${opts.botName}</p>
    </div>

    <div style="padding:20px 40px">
      <div style="background:#141419;border-radius:6px;padding:10px 16px;margin-bottom:16px">
        <span style="font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.08em">Website Overview</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
        <tr>
          <td width="50%" style="padding-right:12px;vertical-align:top">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px">
              <div style="font-size:13px;font-weight:700;color:#334155;margin-bottom:12px">Visitors On Site</div>
              <div style="font-size:36px;font-weight:900;color:#1e293b;margin-bottom:12px">${opts.visitorsTotal}</div>
              <div style="height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;margin-bottom:10px">
                <div style="height:100%;width:${newPct}%;background:#f97316;border-radius:4px"></div>
              </div>
              <table width="100%" style="font-size:13px">
                <tr><td><span style="display:inline-block;width:10px;height:10px;background:#f97316;border-radius:50%;margin-right:6px"></span>New</td><td style="text-align:right;font-weight:700;color:#1e293b">${opts.visitorsNew} <span style="color:#94a3b8;font-weight:400;font-size:11px">(${newPct}%)</span></td></tr>
                <tr><td><span style="display:inline-block;width:10px;height:10px;background:#a99bf5;border-radius:50%;margin-right:6px"></span>Returning</td><td style="text-align:right;font-weight:700;color:#1e293b">${opts.visitorsReturning} <span style="color:#94a3b8;font-weight:400;font-size:11px">(${100 - newPct}%)</span></td></tr>
              </table>
            </div>
          </td>
          <td width="50%" style="padding-left:12px;vertical-align:top">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px">
              <div style="font-size:13px;font-weight:700;color:#334155;margin-bottom:12px">Chat Activity</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px">
                <thead><tr>
                  <th style="text-align:left;padding:6px 8px;color:#94a3b8;font-weight:600;font-size:11px;border-bottom:1px solid #e2e8f0"></th>
                  <th style="text-align:center;padding:6px 8px;color:#94a3b8;font-weight:600;font-size:11px;border-bottom:1px solid #e2e8f0">Triggered</th>
                  <th style="text-align:center;padding:6px 8px;color:#94a3b8;font-weight:600;font-size:11px;border-bottom:1px solid #e2e8f0">Responded</th>
                </tr></thead>
                <tbody>
                  <tr><td style="padding:8px;color:#475569">Automatic</td><td style="text-align:center;padding:8px;font-weight:700">${opts.triggeredAuto}</td><td style="text-align:center;padding:8px;font-weight:700;color:#4ade80">${opts.respondedAuto}</td></tr>
                  <tr><td style="padding:8px;color:#475569">Manual</td><td style="text-align:center;padding:8px;font-weight:700">${opts.triggeredManual}</td><td style="text-align:center;padding:8px;font-weight:700;color:#4ade80">${opts.respondedManual}</td></tr>
                  <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px;font-weight:700;color:#334155">Total</td><td style="text-align:center;padding:8px;font-weight:900;color:#8b7bf0">${opts.triggeredAuto + opts.triggeredManual}</td><td style="text-align:center;padding:8px;font-weight:900;color:#4ade80">${opts.respondedAuto + opts.respondedManual}</td></tr>
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:0 40px 20px">
      <div style="background:#141419;border-radius:6px;padding:10px 16px;margin-bottom:16px">
        <span style="font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.08em">Visitor Behaviour</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="52%" style="padding-right:12px;vertical-align:top">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
              <div style="padding:12px 16px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e2e8f0">Top Pages</div>
              <table width="100%" style="font-size:13px;border-collapse:collapse">${topPagesRows}</table>
            </div>
          </td>
          <td width="48%" style="padding-left:12px;vertical-align:top">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
              <div style="padding:12px 16px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e2e8f0">Sources</div>
              <table width="100%" style="font-size:13px;border-collapse:collapse">${sourcesRows}</table>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:0 40px 32px">
      <div style="background:#141419;border-radius:6px;padding:10px 16px;margin-bottom:16px">
        <span style="font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.08em">Chats Overview</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="25%" style="text-align:center;padding:0 6px">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 8px">
              <div style="width:52px;height:52px;border:3px solid #8b7bf0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px">
                <span style="font-size:20px;font-weight:900;color:#8b7bf0">${opts.conversations}</span>
              </div>
              <div style="font-size:11px;color:#64748b;font-weight:600">Conversations</div>
            </div>
          </td>
          <td width="25%" style="text-align:center;padding:0 6px">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 8px">
              <div style="width:52px;height:52px;border:3px solid #ef4444;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px">
                <span style="font-size:20px;font-weight:900;color:#ef4444">${opts.missedChats}</span>
              </div>
              <div style="font-size:11px;color:#64748b;font-weight:600">Missed Chats</div>
            </div>
          </td>
          <td width="25%" style="text-align:center;padding:0 6px">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 8px">
              <div style="width:52px;height:52px;border:3px solid #f97316;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px">
                <span style="font-size:20px;font-weight:900;color:#f97316">${opts.leadsCount}</span>
              </div>
              <div style="font-size:11px;color:#64748b;font-weight:600">Leads Captured</div>
            </div>
          </td>
          <td width="25%" style="text-align:center;padding:0 6px">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 8px">
              <div style="width:52px;height:52px;border:3px solid #4ade80;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px">
                <span style="font-size:18px;font-weight:900;color:#4ade80">${opts.aiResolutionRate}%</span>
              </div>
              <div style="font-size:11px;color:#64748b;font-weight:600">AI Resolved</div>
            </div>
          </td>
        </tr>
      </table>
      <div style="margin-top:24px;text-align:center">
        <a href="https://replyee.online/dashboard" style="display:inline-block;background:#8b7bf0;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">View Full Dashboard →</a>
      </div>
    </div>
    ${footerHtml}
  </body></html>`
}

function passwordResetHtml(resetUrl: string) {
  return `<!DOCTYPE html><html><body style="${baseStyle}">
    ${headerHtml}
    <div style="padding:36px 40px">
      <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 16px">Reset your password</h1>
      <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 24px">
        We received a request to reset your Replyee password. Click below to choose a new one.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#8b7bf0;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;margin-bottom:24px">
        Reset Password →
      </a>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0">
      <p style="font-size:13px;color:#64748b">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
    ${footerHtml}
  </body></html>`
}
