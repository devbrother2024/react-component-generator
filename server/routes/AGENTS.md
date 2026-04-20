Route Handlers

HTTP endpoints: /api/config and /api/generate.

Module Context

Two route handlers (GET /api/config, POST /api/generate) and OPTIONS handler for CORS preflight. Both return JSON with CORS_HEADERS. Error codes: 400, 429, 500, 503.

Tech Stack & Constraints

- Bun.serve() with single fetch(req) handler (no router library).
- URL parsing: new URL(req.url) to extract req.method and pathname.
- JSON response: Response.json(data, { headers: CORS_HEADERS }).
- Error handling: try/catch with message inspection for error codes.

Implementation Patterns

OPTIONS handler:
  - All CORS preflight requests
  - Return Response(null, { headers: CORS_HEADERS })

GET /api/config:
  - Query ENV_KEYS from config/
  - Return JSON: { envKeys: { anthropic: !!ENV_KEYS.anthropic, google: !!ENV_KEYS.google } }
  - Status: 200
  - No request body required

POST /api/generate:
  - Parse body: { prompt: string, apiKey?: string, provider?: Provider }
  - Validate:
      * Resolve API key using resolveApiKey(provider, apiKey)
      * Reject if !resolvedKey (400, error: "API key is required...")
      * Reject if !prompt (400, error: "Prompt is required")
  - Call AI:
      * provider === 'google' ? callGoogle(prompt, resolvedKey) : callAnthropic(prompt, resolvedKey)
  - Transform response:
      * stripCodeFences(text) → ensureRenderCall(code)
      * Return JSON: { code }
  - Error handling (in catch block):
      * 503 check: if message.includes('503') → 503, "API 서버가 일시적으로 과부하..."
      * 429 check: if message.includes('429') → 429, "요청이 너무 많습니다..."
      * Default: 500, message
  - Status: 200 on success, 400/429/500/503 on error

404 handler:
  - All other paths/methods
  - Return JSON: { error: "Not found" }
  - Status: 404

Local Golden Rules

- Always include CORS_HEADERS in all responses (200, 400, 404, 500).
- Error responses always include { error: "message" } format.
- Do not log full request bodies (may contain API keys).
- Do not log API keys (even after resolving from .env).
- Validate prompt exists and is reasonable (empty string is invalid).
- Default provider is 'anthropic' if not specified.
- Let providers throw errors; catch in route handler.
- Error messages should be user-friendly (Korean or English as per app language).

Testing Strategy

Manual endpoints:
  1. OPTIONS http://localhost:3002/api/config
     → Check CORS headers present
  2. GET http://localhost:3002/api/config
     → Check { envKeys: {...} }
  3. POST http://localhost:3002/api/generate (with/without API key, valid/invalid provider)
     → Check response format and error handling

Error cases:
  - Missing API key (no .env, no client key) → 400
  - Invalid provider → 400
  - Empty prompt → 400
  - Rate limit (429 in response) → 429
  - API server down (503 in response) → 503

Linting: bun run lint
