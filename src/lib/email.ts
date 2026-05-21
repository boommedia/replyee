import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Replyee <hello@replyee.online>'

// ── Welcome email after signup ────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
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
  return resend.emails.send({
    from: 'Replyee <leads@replyee.online>',
    to: opts.to,
    subject: `🔔 New lead from your ${opts.botName} chatbot`,
    html: leadAlertHtml(opts),
  })
}

// ── Trial expiry warning (3 days before) ─────────────────────
export async function sendTrialExpiryEmail(to: string, name: string, daysLeft: number) {
  return resend.emails.send({
    from: 'Eric at Replyee <eric@replyee.online>',
    to,
    subject: `Your Replyee trial ends in ${daysLeft} days — here's what happens next`,
    html: trialExpiryHtml(name, daysLeft),
  })
}

// ── Payment failed ────────────────────────────────────────────
export async function sendPaymentFailedEmail(to: string, name: string, amount: string) {
  return resend.emails.send({
    from: 'Replyee Billing <billing@replyee.online>',
    to,
    subject: 'Action required: payment failed for your Replyee subscription',
    html: paymentFailedHtml(name, amount),
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
  return resend.emails.send({
    from: 'Replyee <reports@replyee.online>',
    to: opts.to,
    subject: `Your Replyee ${opts.month} summary — ${opts.conversations.toLocaleString()} conversations handled 🎉`,
    html: monthlyReportHtml(opts),
  })
}

// ── Password reset ────────────────────────────────────────────
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return resend.emails.send({
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
  <div style="background:#07080f;padding:28px 40px;display:flex;align-items:center;gap:10px">
    <div style="width:30px;height:30px;background:#6366f1;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle">
      <span style="color:#fff;font-size:14px">✦</span>
    </div>
    <span style="font-weight:900;font-size:18px;color:#fff;margin-left:8px;letter-spacing:-0.5px">Replyee</span>
    <span style="font-size:12px;color:#64748b;margin-left:4px">by Boom Media</span>
  </div>
`
const footerHtml = `
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center">
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0">
      by Boom Media &nbsp;·&nbsp;
      <a href="https://replyee.online/unsubscribe" style="color:#6366f1">Unsubscribe</a> &nbsp;·&nbsp;
      <a href="https://replyee.online/privacy" style="color:#6366f1">Privacy Policy</a><br>
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
      <a href="https://replyee.online/dashboard" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;margin:8px 0 24px">
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
        <div style="font-size:14px;color:#334155;margin-bottom:8px"><strong>Email:</strong> <a href="mailto:${opts.visitorEmail}" style="color:#6366f1">${opts.visitorEmail}</a></div>
        <div style="font-size:14px;color:#334155;margin-bottom:8px"><strong>Question:</strong> "${opts.question}"</div>
        <div style="font-size:14px;color:#334155"><strong>Bot:</strong> ${opts.botName}</div>
      </div>
      <a href="mailto:${opts.visitorEmail}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
        Reply to Visitor →
      </a>
      <br><br>
      <a href="https://replyee.online/dashboard/bots" style="font-size:13px;color:#6366f1">View all leads in dashboard →</a>
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
        <div style="font-size:16px;font-weight:900;color:#6366f1;margin-bottom:4px">Starter — $25/month</div>
        <div style="font-size:13px;color:#374151;margin-bottom:12px">1 chatbot · 500 conversations/mo · Custom branding · Lead capture</div>
        <a href="https://replyee.online/dashboard/settings" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;font-size:13px;padding:10px 20px;border-radius:7px;text-decoration:none">Start Starter Plan →</a>
      </div>
      <a href="https://replyee.online/dashboard/settings" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none">
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
      <p style="font-size:13px;color:#64748b">Need help? Reply to this email or <a href="mailto:eric@boommedia.us" style="color:#6366f1">contact support</a>.</p>
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
          <div style="font-size:28px;font-weight:900;color:#6366f1">${opts.conversations.toLocaleString()}</div>
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
      <a href="https://replyee.online/dashboard/analytics" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none">
        View Full Analytics →
      </a>
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
      <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;margin-bottom:24px">
        Reset Password →
      </a>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0">
      <p style="font-size:13px;color:#64748b">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
    ${footerHtml}
  </body></html>`
}
