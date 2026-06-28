# Replyee — Database Schema

## Setup

1. Go to your Supabase project → SQL Editor
2. Run `migrations/001_initial.sql`
3. Verify pgvector extension is enabled: `select * from pg_extension where extname = 'vector'`

---

## Tables

### `profiles`
Extends `auth.users`. Auto-created on signup via trigger.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, references auth.users |
| full_name | text | From signup |
| email | text | |
| plan | text | starter \| growth \| agency |
| bot_limit | int | Max chatbots for plan |
| created_at | timestamptz | |

---

### `chatbots`
One per client website.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → profiles |
| name | text | Bot display name |
| website_url | text | Client's site URL |
| accent_color | text | Hex color for widget |
| system_prompt | text | Custom AI instructions |
| greeting_message | text | First message in widget |
| fallback_message | text | Shown when bot can't answer |
| is_active | boolean | Disable without deleting |
| conversation_count | int | Incremented via RPC |
| lead_count | int | Incremented via RPC |
| chunk_count | int | Total knowledge chunks |

---

### `knowledge_chunks`
Chunked + embedded text from the client's content.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| chatbot_id | uuid | FK → chatbots |
| content | text | Raw text chunk |
| embedding | vector(1536) | OpenAI text-embedding-3-small |
| source_type | text | url \| file \| text |
| source_name | text | URL or filename |

**Index:** `ivfflat` on embedding for fast cosine similarity search.

---

### `messages`
Individual messages within a conversation session.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| session_id | uuid | Groups messages into a conversation |
| chatbot_id | uuid | FK → chatbots |
| role | text | user \| assistant |
| content | text | Message body |

---

### `leads`
Visitor email captures when bot can't answer.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| chatbot_id | uuid | FK → chatbots |
| visitor_email | text | Captured email |
| question | text | What they asked |
| session_id | uuid | Links to conversation |

---

## Key RPCs

### `match_chunks(query_embedding, chatbot_id, match_count, match_threshold)`
Vector similarity search using pgvector cosine distance. Called by `/api/chat` to retrieve relevant knowledge chunks.

### `increment_conversation_count(bot_id)`
### `increment_lead_count(bot_id)`
### `increment_chunk_count(bot_id, amount)`
Atomic counters — safer than SELECT + UPDATE under concurrent load.

---

## Row Level Security

All tables have RLS enabled. Users can only access their own data. The `/api/chat` and `/api/leads` endpoints use the **service role key** (bypasses RLS) since they're public-facing with no user session.
