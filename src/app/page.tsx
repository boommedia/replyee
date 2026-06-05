'use client'
import Link from 'next/link'
import { useState } from 'react'
import Logo from '@/components/Logo'
import {
  MessageSquare, Upload, Globe, Zap, BarChart3, Mail,
  Check, ArrowRight, Sparkles, Shield, Users, Code2,
  FileText, Link2, ChevronDown,
} from 'lucide-react'

const BG      = '#07080f'
const BG2     = '#0d1018'
const BORDER  = '#1a2035'
const PRIMARY = '#6366f1'
const ACCENT  = '#22d3ee'
const BODY    = '#64748b'
const MUTED   = '#0a0c14'

const FEATURES = [
  {
    icon: <Upload className="w-5 h-5" />,
    title: 'Train on Your Content',
    desc: 'Upload PDFs, paste URLs, or type text. Replyee chunks, embeds, and indexes everything automatically.',
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Smart AI Responses',
    desc: 'Powered by Claude AI + semantic search. Answers are accurate, on-brand, and grounded in your actual content.',
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    title: 'One-Line Embed',
    desc: 'Copy a single script tag. Works on WordPress, Webflow, Squarespace, Shopify — any website.',
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: 'Lead Capture & Handoff',
    desc: "When the bot can't answer, it captures the visitor's email and question and emails you instantly.",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Conversation Analytics',
    desc: 'See what visitors ask most. Track resolved vs unresolved. Know exactly where your content has gaps.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Custom Branding',
    desc: 'Your colours, your name, your logo. No "Powered by" badge. Looks native to your site.',
  },
]

const STEPS = [
  { num: '01', title: 'Add Your Content', desc: 'Upload PDFs, paste your website URL, or type FAQs. Replyee processes it all in seconds.' },
  { num: '02', title: 'Customise Your Bot', desc: 'Set your brand colours, bot name, greeting message, and fallback behaviour.' },
  { num: '03', title: 'Copy & Paste', desc: 'Grab your one-line script tag and drop it into your website. Done. The bot is live.' },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$25',
    period: '/mo',
    desc: 'Perfect for a single website.',
    features: ['1 chatbot', '500 conversations/mo', 'PDF + URL ingestion', 'Custom branding', 'Email lead handoff', 'Basic analytics'],
    highlight: false,
    cta: 'Start Free Trial',
  },
  {
    name: 'Growth',
    price: '$49',
    period: '/mo',
    desc: 'For agencies managing multiple clients.',
    features: ['5 chatbots', '3,000 conversations/mo', 'Everything in Starter', 'Priority support', 'Conversation export', 'Webhook integration'],
    highlight: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Agency',
    price: '$99',
    period: '/mo',
    desc: 'Unlimited bots. Unlimited clients.',
    features: ['Unlimited chatbots', 'Unlimited conversations', 'Everything in Growth', 'White-label (remove Replyee branding)', 'API access', 'Dedicated onboarding'],
    highlight: false,
    cta: 'Talk to Us',
  },
]

const FAQS = [
  { q: 'What file types can I upload?', a: 'PDFs, plain text files (.txt), and any public URL. We extract the text, chunk it into segments, and embed it all automatically.' },
  { q: 'How accurate are the answers?', a: 'Replyee uses RAG (Retrieval-Augmented Generation) — it searches your actual content before generating a response. It only answers based on what you\'ve trained it on, so there\'s no hallucination about your business.' },
  { q: 'Does it work on any website?', a: 'Yes. The widget is a single vanilla JS script tag with no dependencies. It works on WordPress, Webflow, Shopify, Squarespace, Wix, or any custom HTML site.' },
  { q: 'What happens when the bot doesn\'t know the answer?', a: "It tells the visitor honestly and offers to capture their email and question. You get an instant email notification via Resend so you can follow up." },
  { q: 'Is there a free trial?', a: 'Yes — 14 days free on any plan, no credit card required. Your first chatbot is ready in minutes.' },
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [spotsLeft] = useState(15)

  return (
    <main style={{ background: BG, minHeight: '100vh', color: '#fff', fontFamily: 'inherit', overflowX: 'hidden' }}>

      {/* ── Announcement Banner ── */}
      <div style={{ background: '#050710', borderBottom: `1px solid ${BORDER}`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 13 }}>
        <span style={{ color: ACCENT, fontWeight: 800 }}>✦ Early Access Open</span>
        <span style={{ color: BODY }}>— 50% off for life · Code:</span>
        <span style={{ color: '#fff', fontWeight: 900, fontFamily: 'monospace', background: BORDER, padding: '2px 8px', borderRadius: 4 }}>REPLY50</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 80, height: 5, background: BORDER, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${(spotsLeft / 20) * 100}%`, height: '100%', background: PRIMARY, borderRadius: 99 }} />
          </div>
          <span style={{ color: BODY, fontSize: 11 }}>{spotsLeft}/20 spots left</span>
        </div>
        <Link href="/signup" style={{ background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: 11, padding: '4px 14px', borderRadius: 99, textDecoration: 'none' }}>Claim Spot →</Link>
      </div>

      {/* ── Nav ── */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 48px', borderBottom: `1px solid ${BORDER}`, background: 'rgba(7,8,15,0.9)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 13, color: BODY }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
          <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>How it works</a>
          <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a>
          <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
        </div>
        <Link href="/signup" style={{ background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 22px', borderRadius: 8, textDecoration: 'none' }}>
          Start Free →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '100px 48px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `rgba(99,102,241,0.1)`, border: `1px solid rgba(99,102,241,0.25)`, borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: PRIMARY, marginBottom: 28, letterSpacing: '0.06em' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} className="pulse-dot" />
          AI-POWERED · KNOWLEDGE-GROUNDED · EMBEDDABLE IN 60 SECONDS
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', marginBottom: 24, maxWidth: 800, margin: '0 auto 24px' }}>
          Your AI support team,<br />
          <span style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ready in 60 seconds.</span>
        </h1>

        <p style={{ fontSize: 18, color: BODY, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Train a chatbot on your content. Embed it on your website. Let AI answer customer questions 24/7 — while you focus on the work that matters.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          <Link href="/signup" style={{ background: PRIMARY, color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 32px', borderRadius: 10, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Start Free — No Card Needed <ArrowRight size={16} />
          </Link>
          <a href="#how-it-works" style={{ background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 10, border: `1px solid ${BORDER}`, textDecoration: 'none' }}>
            See How It Works
          </a>
        </div>

        {/* Chat widget mockup */}
        <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative' }}>
          <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', boxShadow: `0 0 80px rgba(99,102,241,0.12)` }}>
            {/* Browser bar */}
            <div style={{ background: MUTED, borderBottom: `1px solid ${BORDER}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block', marginLeft: 4 }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#29c941', display: 'inline-block', marginLeft: 4 }} />
              <span style={{ flex: 1, background: BG, border: `1px solid ${BORDER}`, borderRadius: 5, padding: '3px 12px', fontSize: 11, color: BODY, fontFamily: 'monospace', marginLeft: 12 }}>yourclientsite.com</span>
            </div>
            {/* Page content (fake) */}
            <div style={{ padding: 24, position: 'relative', minHeight: 300 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 18, background: BORDER, borderRadius: 4, width: '60%', marginBottom: 10 }} />
                  <div style={{ height: 12, background: BORDER, borderRadius: 3, width: '85%', marginBottom: 7 }} />
                  <div style={{ height: 12, background: BORDER, borderRadius: 3, width: '70%', marginBottom: 7 }} />
                  <div style={{ height: 12, background: BORDER, borderRadius: 3, width: '80%' }} />
                  <div style={{ marginTop: 20, height: 36, background: PRIMARY, borderRadius: 7, width: 120 }} />
                </div>
                <div style={{ width: 180, height: 140, background: BORDER, borderRadius: 10 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 70, background: BORDER, borderRadius: 8 }} />)}
              </div>

              {/* Floating chat widget */}
              <div style={{ position: 'absolute', bottom: 20, right: 20 }}>
                {/* Chat window */}
                <div style={{ background: '#0f1420', border: `1px solid ${BORDER}`, borderRadius: 14, width: 260, marginBottom: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  <div style={{ background: PRIMARY, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={13} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Acme Support</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>● Online</div>
                    </div>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: '8px 8px 8px 2px', padding: '8px 12px', fontSize: 12, color: '#fff', marginBottom: 8 }}>
                      👋 Hi! I know everything about Acme. What can I help you with?
                    </div>
                    <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '8px 8px 2px 8px', padding: '8px 12px', fontSize: 12, color: '#fff', marginBottom: 8, marginLeft: 'auto', width: 'fit-content' }}>
                      What's your return policy?
                    </div>
                    <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: '8px 8px 8px 2px', padding: '8px 12px', fontSize: 12, color: '#fff' }}>
                      We offer 30-day returns on all items. Just email returns@acme.com with your order number...
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 10px', fontSize: 11, color: BODY }}>Ask a question…</div>
                    <div style={{ background: PRIMARY, borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowRight size={13} color="#fff" />
                    </div>
                  </div>
                </div>
                {/* Bubble */}
                <div style={{ background: PRIMARY, width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', boxShadow: `0 4px 20px rgba(99,102,241,0.5)` }}>
                  <MessageSquare size={18} color="#fff" />
                </div>
              </div>
            </div>
          </div>
          {/* Embed code tag */}
          <div style={{ marginTop: 16, background: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 16px', fontSize: 12, fontFamily: 'monospace', color: BODY, textAlign: 'left' }}>
            <span style={{ color: '#f97316' }}>&lt;script</span>
            <span style={{ color: ACCENT }}> src</span>
            <span style={{ color: '#fff' }}>="https://replyee.online/widget.js"</span>
            <span style={{ color: ACCENT }}> data-bot-id</span>
            <span style={{ color: '#fff' }}>="abc123"</span>
            <span style={{ color: '#f97316' }}>&gt;&lt;/script&gt;</span>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
        {[['Works on any site', Globe], ['No hallucinations', Shield], ['Instant setup', Zap], ['Agency-ready', Users]].map(([label, Icon]) => (
          <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 8, color: BODY, fontSize: 13 }}>
            {/* @ts-expect-error dynamic icon */}
            <Icon size={16} style={{ color: PRIMARY }} />
            <span>{label as string}</span>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: PRIMARY, marginBottom: 12 }}>Features</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 12 }}>Everything you need to automate support</h2>
          <p style={{ color: BODY, fontSize: 16, maxWidth: 520, margin: '0 auto' }}>No live agents. No ticket queues. Just AI that knows your business inside out.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
              <div style={{ width: 40, height: 40, background: `rgba(99,102,241,0.15)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: PRIMARY }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: BODY, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ padding: '80px 48px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: PRIMARY, marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px' }}>Live in 3 steps. Seriously.</h2>
        </div>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', background: BG2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28 }}>
              <div style={{ minWidth: 48, height: 48, background: `rgba(99,102,241,0.15)`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: PRIMARY }}>
                {s.num}
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ color: BODY, fontSize: 15, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && <div style={{ position: 'absolute' }} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Sources supported ── */}
      <section style={{ padding: '60px 48px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: BODY, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Train from any source</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            [FileText, 'PDFs & Docs'],
            [Globe, 'Website URLs'],
            [MessageSquare, 'FAQ Text'],
            [Link2, 'Sitemap Crawl'],
          ].map(([Icon, label]) => (
            <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 8, background: BG2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 18px', fontSize: 13, color: '#fff' }}>
              {/* @ts-expect-error dynamic icon */}
              <Icon size={15} style={{ color: ACCENT }} />
              {label as string}
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: '80px 48px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: PRIMARY, marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Simple, transparent pricing</h2>
            <p style={{ color: BODY }}>14-day free trial on all plans. No credit card required.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {PLANS.map((plan) => (
              <div key={plan.name} style={{ background: plan.highlight ? `rgba(99,102,241,0.08)` : BG2, border: `1px solid ${plan.highlight ? 'rgba(99,102,241,0.4)' : BORDER}`, borderRadius: 16, padding: 28, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                    Most Popular
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{plan.name}</h3>
                  <p style={{ fontSize: 13, color: BODY, marginBottom: 16 }}>{plan.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: plan.highlight ? PRIMARY : '#fff' }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: BODY }}>{plan.period}</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                      <Check size={15} style={{ color: PRIMARY, flexShrink: 0 }} />
                      <span style={{ color: '#d1d5db' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/signup" style={{ display: 'block', textAlign: 'center', background: plan.highlight ? PRIMARY : 'transparent', color: plan.highlight ? '#fff' : '#fff', fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 8, border: `1px solid ${plan.highlight ? PRIMARY : BORDER}`, textDecoration: 'none' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: BODY, fontSize: 13, marginTop: 24 }}>
            Need more? <Link href="/signup" style={{ color: PRIMARY, textDecoration: 'none' }}>Contact us</Link> for custom volume pricing.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 48px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: PRIMARY, marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px' }}>Frequently asked questions</h2>
          </div>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 15, fontWeight: 600, gap: 16 }}>
                {faq.q}
                <ChevronDown size={16} style={{ color: BODY, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>
              {openFaq === i && (
                <p style={{ color: BODY, fontSize: 14, lineHeight: 1.7, paddingBottom: 18 }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '80px 48px', borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ marginBottom: 16 }}>
            <Sparkles size={32} style={{ color: PRIMARY, margin: '0 auto 12px' }} />
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 12 }}>Start your free trial today</h2>
          <p style={{ color: BODY, marginBottom: 32, fontSize: 16 }}>Your first chatbot is live in 60 seconds. No technical setup required.</p>
          <Link href="/signup" style={{ background: PRIMARY, color: '#fff', fontWeight: 800, fontSize: 16, padding: '16px 40px', borderRadius: 10, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <Logo />
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: BODY }}>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
          <a href="mailto:eric@boommedia.us" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
        </div>
        <p style={{ fontSize: 12, color: BODY }}>© 2026 Boom Media. All rights reserved.</p>
      </footer>
    </main>
  )
}
