# Replyee — AI Chatbot Platform

Replyee is Boom Media's white-label AI chatbot platform. Clients upload their content (PDFs, URLs, text), get an embeddable widget for their website, and Replyee answers visitor questions 24/7 using RAG + Claude AI.

## Current Status
- Phase 1: Foundation build
- Production: replyee.online (TBD)
- Stack: Next.js 16, Supabase (pgvector), Claude Haiku, OpenAI Embeddings, Vercel
- Contact: eric@boommedia.us

## Architecture

```
Visitor → Widget (widget.js) → POST /api/chat
                                    ↓
                            embed query (OpenAI)
                                    ↓
                            vector search (pgvector)
                                    ↓
                            build context + system prompt
                                    ↓
                            Claude Haiku → streamed response
                                    ↓
                            store message in DB
```

## Key Concepts

- **Chatbot** — one bot per client website. Has a knowledge base, custom colours, system prompt.
- **Knowledge Chunk** — a piece of text extracted from a PDF/URL/text, embedded as a 1536-dim vector.
- **RAG** — Retrieval-Augmented Generation. We search chunks by cosine similarity then pass the top-K as context to Claude.
- **Widget** — `public/widget.js` — vanilla JS, no framework. Loaded async on client websites via `<script>` tag.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth |
| Embeddings | OpenAI text-embedding-3-small (1536 dims) |
| AI Responses | Anthropic Claude claude-haiku-4-5 (fast + cheap) |
| Email | Resend (lead handoff notifications) |
| Payments | Stripe |
| Hosting | Vercel |
| Widget | Vanilla JS (no framework, <20KB) |

## Environment Variables

See `.env.example`. Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` — embeddings
- `ANTHROPIC_API_KEY` — chat responses
- `RESEND_API_KEY` — email handoff
- `STRIPE_SECRET_KEY` — billing

## Key Routes

- `/` — Marketing landing page (public)
- `/login` `/signup` — Auth flows
- `/dashboard` — Client dashboard (authenticated)
- `/dashboard/bots` — Manage chatbots
- `/dashboard/bots/[id]` — Bot detail: knowledge base, settings, embed code
- `/dashboard/conversations` — Conversation history
- `/dashboard/analytics` — Usage analytics
- `/admin` — Boom Media admin panel (super-admin only)
- `/api/chat` — Public widget endpoint (POST, no auth)
- `/api/ingest` — Knowledge base ingestion (authenticated)
- `/api/ingest/url` — Scrape + ingest a URL
- `/api/ingest/file` — Upload + parse a PDF
- `/api/leads` — Save lead capture (email handoff)
- `/api/webhooks/stripe` — Stripe billing webhook

## Database

See `docs/DATABASE_SCHEMA.md`. Run migrations from `migrations/` in order.

Main tables:
- `profiles` — user accounts (extends Supabase auth.users)
- `chatbots` — one per client site
- `knowledge_chunks` — embedded text chunks (has vector column)
- `conversations` — chat sessions
- `messages` — individual messages in a conversation
- `leads` — captured visitor emails when bot can't answer
- `plans` — subscription tier metadata

## Widget

`public/widget.js` is the embeddable script. It:
1. Creates a floating bubble (bottom-right)
2. Opens a chat iframe on click
3. Communicates with `/api/chat` via fetch
4. Reads `data-bot-id` from the script tag to identify which chatbot

Embed code for clients:
```html
<script src="https://replyee.online/widget.js" data-bot-id="YOUR_BOT_ID" async></script>
```

## Development Notes

- Use TypeScript everywhere
- Components in `/src/components/`
- API routes in `/src/app/api/`
- Supabase client/server helpers in `/src/lib/supabase/`
- RAG pipeline logic in `/src/lib/rag/`
- Keep widget.js under 20KB unminified — no npm imports allowed
- Claude Haiku is the default model (fast, cheap). Upgrade to Sonnet per-bot if needed.
- Always enforce Row Level Security (RLS) — users can only see their own chatbots/data
