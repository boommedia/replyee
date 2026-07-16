import OpenAI from 'openai'

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function embedText(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return response.data[0].embedding
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await getClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: texts.map(t => t.slice(0, 8000)),
  })
  return response.data.map(d => d.embedding)
}

/**
 * Embed chunks if an embedding provider (OpenAI) is configured; otherwise
 * return nulls. Small per-site KBs work without vectors — the chat route
 * loads the whole KB into Claude's context when embeddings are absent.
 */
export async function embedChunksOptional(chunks: string[]): Promise<{ embeddings: (number[] | null)[]; mode: 'vector' | 'claude-context' }> {
  try {
    const embeddings = await embedBatch(chunks)
    return { embeddings, mode: 'vector' }
  } catch {
    return { embeddings: chunks.map(() => null), mode: 'claude-context' }
  }
}

export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim()) chunks.push(chunk)
    i += chunkSize - overlap
  }
  return chunks
}
