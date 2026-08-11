import { stripCodeFences, ensureRenderCall, toFriendlyErrorMessage } from './generator';
import { withModelFallbackStream } from './fallback';
import {
  splitSSEEvents,
  extractSSEData,
  extractAnthropicDeltaText,
  extractGoogleDeltaText,
  isGoogleMaxTokensFinish,
} from './sse';

// 우선순위 순서. 앞 모델이 실패하면 다음 모델로 폴백한다.
const GOOGLE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];

const SYSTEM_PROMPT = `You are a React component generator. Generate a single React component based on the user's description.

Rules:
- Use inline styles only (no CSS imports, no CSS modules)
- Do NOT use import statements — React is already available in scope as a global
- Define the component as a function, then call render(<ComponentName />) at the end
- Make the component visually appealing with proper styling
- Use React hooks if needed (e.g., React.useState, React.useEffect)
- The component must be completely self-contained
- Respond with ONLY the code block — no explanations, no markdown fences
- Use descriptive variable names and clean formatting
- For colors, prefer modern palettes (gradients, shadows, etc.)
- Ensure the component is interactive where appropriate (hover states, click handlers, etc.)
- Do NOT use TypeScript syntax — no type annotations, no interfaces, no generics, no "as" casts. Write plain JavaScript only.

Example output format:
const GradientButton = () => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      style={{
        background: hovered
          ? 'linear-gradient(135deg, #667eea, #764ba2)'
          : 'linear-gradient(135deg, #764ba2, #667eea)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      Click me
    </button>
  );
};

render(<GradientButton />);`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type Provider = 'anthropic' | 'google';

const ENV_KEYS: Record<Provider, string | undefined> = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  google: process.env.GOOGLE_API_KEY,
};

function resolveApiKey(provider: Provider, clientKey?: string): string | null {
  return clientKey || ENV_KEYS[provider] || null;
}

type OnDelta = (text: string) => void;

/**
 * 프로바이더의 SSE 응답 바디를 읽어 완결된 이벤트마다 델타 텍스트를 콜백으로 흘려보내고,
 * 전체 누적 텍스트를 반환한다. Anthropic/Google 모두 이 파서를 공유한다.
 */
async function consumeSSEStream(
  response: Response,
  extractDeltaText: (eventData: unknown) => string | null,
  onDelta: OnDelta,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = splitSSEEvents(buffer);
      buffer = rest;

      for (const event of events) {
        const data = extractSSEData(event);
        if (!data) continue;

        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }

        const text = extractDeltaText(parsed);
        if (text) {
          fullText += text;
          onDelta(text);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

async function callAnthropicStream(
  prompt: string,
  apiKey: string,
  onDelta: OnDelta,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  return consumeSSEStream(response, extractAnthropicDeltaText, onDelta);
}

async function callGoogleModelStream(
  prompt: string,
  apiKey: string,
  model: string,
  onDelta: OnDelta,
  signal?: AbortSignal,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  return consumeSSEStream(
    response,
    (eventData) => {
      if (isGoogleMaxTokensFinish(eventData)) {
        throw new Error('생성된 코드가 너무 길어 잘렸습니다. 더 간단한 컴포넌트를 요청해주세요.');
      }
      return extractGoogleDeltaText(eventData);
    },
    onDelta,
  );
}

async function callGoogleStream(
  prompt: string,
  apiKey: string,
  onDelta: OnDelta,
  signal?: AbortSignal,
): Promise<string> {
  return withModelFallbackStream(GOOGLE_MODELS, (model, onEmit) =>
    callGoogleModelStream(
      prompt,
      apiKey,
      model,
      (text) => {
        onEmit();
        onDelta(text);
      },
      signal,
    ),
  );
}

const server = Bun.serve({
  port: 3002,
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(req.url);

    if (req.method === 'GET' && url.pathname === '/api/config') {
      return Response.json(
        {
          envKeys: {
            anthropic: !!ENV_KEYS.anthropic,
            google: !!ENV_KEYS.google,
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      let body: { prompt: string; apiKey?: string; provider?: Provider };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return Response.json(
          { error: '요청 본문을 파싱할 수 없습니다.' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const { prompt, apiKey, provider = 'anthropic' } = body;
      const resolvedKey = resolveApiKey(provider, apiKey);

      if (!resolvedKey) {
        return Response.json(
          { error: `API key is required. Set ${provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_API_KEY'} in .env or enter it manually.` },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      if (!prompt) {
        return Response.json(
          { error: 'Prompt is required' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const encoder = new TextEncoder();
      const upstreamAbort = new AbortController();
      let streamClosed = false;

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const send = (event: Record<string, unknown>) => {
            if (streamClosed) return;
            try {
              controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
            } catch {
              streamClosed = true;
            }
          };

          try {
            const fullText =
              provider === 'google'
                ? await callGoogleStream(
                    prompt,
                    resolvedKey,
                    (text) => send({ type: 'delta', text }),
                    upstreamAbort.signal,
                  )
                : await callAnthropicStream(
                    prompt,
                    resolvedKey,
                    (text) => send({ type: 'delta', text }),
                    upstreamAbort.signal,
                  );

            const code = ensureRenderCall(stripCodeFences(fullText));
            send({ type: 'done', code });
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            send({ type: 'error', message: toFriendlyErrorMessage(message) });
          } finally {
            if (!streamClosed) {
              streamClosed = true;
              try {
                controller.close();
              } catch {
                // 클라이언트가 이미 연결을 끊어 controller가 닫힌 경우 무시한다.
              }
            }
          }
        },
        cancel() {
          streamClosed = true;
          upstreamAbort.abort();
        },
      });

      return new Response(stream, {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/x-ndjson' },
      });
    }

    return Response.json(
      { error: 'Not found' },
      { status: 404, headers: CORS_HEADERS }
    );
  },
});

console.log(`API server running at http://localhost:${server.port}`);
