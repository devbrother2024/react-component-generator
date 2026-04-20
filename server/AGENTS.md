Backend Context

Bun API server (TypeScript, port 3002). Single-file monolith that proxies frontend requests to Anthropic Claude and Google Gemini, applies SYSTEM_PROMPT rules to component generation.

Structure: server/index.ts contains configuration, helpers, provider integrations, and route handlers. Anticipated growth: future refactoring into config/, providers/, utils/, routes/ subdirectories.

Tech Stack & Constraints

- Bun runtime (no Node.js features; use Bun SDK)
- TypeScript (no transpilation needed)
- Native fetch for HTTP requests (no axios/node-fetch)
- CORS headers set on all /api/* responses
- Dual AI provider support: Anthropic and Google (not both simultaneously, selected per request)

Do not use: express, fastify, or other frameworks. Use Bun.serve() directly.

Current Implementation (index.ts)

Sections (in order):

1. Constants
   - SYSTEM_PROMPT: React component generation rules (100 lines approx)
   - CORS_HEADERS: Access-Control-Allow-* headers
   - ENV_KEYS: Read ANTHROPIC_API_KEY, GOOGLE_API_KEY from process.env

2. Helpers
   - resolveApiKey(provider, clientKey): Priority order (clientKey > env > null)
   - stripCodeFences(text): Remove markdown code fences
   - ensureRenderCall(code): Append render(<Component />) if missing

3. AI Integrations
   - callAnthropic(prompt, apiKey): Fetch from /v1/messages
     * Model: claude-haiku-4-5-20251001
     * max_tokens: 4096
     * Extract text from response.content[].text
   - callGoogle(prompt, apiKey): Fetch from /v1beta/models/{model}:generateContent
     * Model: gemini-2.5-flash
     * maxOutputTokens: 8192
     * Handle finishReason === 'MAX_TOKENS' (error: code too long)
     * Extract text from candidates[0].content.parts[].text

4. Route Handler (Bun.serve)
   - Port: 3002
   - OPTIONS: Return 200 with CORS headers
   - GET /api/config: Return { envKeys: { anthropic: bool, google: bool } }
   - POST /api/generate:
     * Parse { prompt, apiKey?, provider? }
     * Default provider: "anthropic"
     * Resolve API key (fail if missing)
     * Call callAnthropic() or callGoogle()
     * Strip code fences + ensure render() call
     * Handle errors (503, 429, 5xx -> return error response)
   - Unmatched: 404 Not Found

Error Codes
- 400: Missing prompt, missing API key, invalid provider
- 429: Rate limit (Gemini, Anthropic)
- 503: API server unavailable
- 500: Unhandled error (log message to response)

Context Map

- **[Configuration & Constants](./config/AGENTS.md)** — SYSTEM_PROMPT, CORS headers, .env key definitions
- **[AI Provider Integrations](./providers/AGENTS.md)** — callAnthropic() and callGoogle() API calls
- **[Utility Functions](./utils/AGENTS.md)** — resolveApiKey(), stripCodeFences(), ensureRenderCall()
- **[Route Handlers](./routes/AGENTS.md)** — GET /api/config, POST /api/generate, OPTIONS, 404

Local Golden Rules

- API key resolution: clientKey > env > null (frontend can override .env)
- NEVER log API keys (even truncated).
- NEVER cache generated code or responses.
- Validate prompt (non-empty, reasonable length).
- Do not store user prompts or history (stateless).
- All responses include CORS_HEADERS.
- All error responses: { error: "message" } format.
- Extract code correctly from both providers (different response shapes).

Testing Strategy

Manual: bun run server, then:
  curl -X POST http://localhost:3002/api/generate \
    -H "Content-Type: application/json" \
    -d '{"prompt":"blue button","provider":"anthropic","apiKey":"sk-ant-..."}'

Linting: bun run lint
Type Check: tsc (runs during build)
