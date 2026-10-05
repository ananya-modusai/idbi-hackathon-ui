import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy to OpenRouter for the Modus Agent.
 *
 * The API key is read from the server environment and never reaches the
 * browser. Do NOT rename OPENROUTER_API_KEY to NEXT_PUBLIC_* — that would
 * inline the secret into the client bundle, where anyone can read it.
 */

// Cheap enough to run freely in a demo, capable enough to write a decent
// customer message and hold a tone instruction.
const MODEL = 'anthropic/claude-haiku-4.5';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const runtime = 'nodejs';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Without this the fetch below sends "Bearer undefined" and the failure
    // surfaces as an opaque 502. Name the actual cause instead.
    console.error('[api/agent] OPENROUTER_API_KEY is not set.');
    return NextResponse.json(
      { error: 'Agent is not configured: OPENROUTER_API_KEY is not set.' },
      { status: 503 },
    );
  }

  let body: { messages?: ChatMessage[]; system?: string; max_tokens?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: 'messages is required.' }, { status: 400 });
  }

  const payload = {
    model: MODEL,
    max_tokens: Math.min(body.max_tokens ?? 1200, 2000),
    messages: body.system
      ? [{ role: 'system' as const, content: body.system }, ...messages]
      : messages,
  };

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter attribution headers; harmless locally.
        'HTTP-Referer': 'https://modus.ai',
        'X-Title': 'Modus RM Workspace',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('[api/agent] OpenRouter error', res.status, detail.slice(0, 500));
      return NextResponse.json(
        { error: `Model request failed (${res.status}).` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ text, model: data?.model ?? MODEL });
  } catch (err) {
    console.error('[api/agent] request failed:', err);
    return NextResponse.json({ error: 'Could not reach the model.' }, { status: 502 });
  }
}
