AI Provider Integrations

Anthropic Claude and Google Gemini API calls with consistent response extraction.

Module Context

Two functions: callAnthropic() and callGoogle(). Each takes (prompt, apiKey) and returns generated component code (string). Handle provider-specific response parsing, error codes (401, 429, 503), and edge cases (max tokens).

Tech Stack & Constraints

- Fetch API (Bun native), no axios or node-fetch.
- Anthropic: x-api-key header, anthropic-version: 2023-06-01.
- Google: key in query parameter (?key=...).
- Both use SYSTEM_PROMPT from config/.
- Throw Error on non-200 responses; let caller handle.

Implementation Patterns

callAnthropic(prompt: string, apiKey: string): Promise<string>
  - Endpoint: https://api.anthropic.com/v1/messages
  - Method: POST
  - Headers: Content-Type, x-api-key, anthropic-version
  - Body:
      {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 4096,
        "system": SYSTEM_PROMPT,
        "messages": [{ "role": "user", "content": prompt }]
      }
  - Response type: { content: Array<{ type: string; text?: string }> }
  - Extract: Filter type === 'text', map to .text, join
  - Error: Throw if !response.ok

callGoogle(prompt: string, apiKey: string): Promise<string>
  - Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}
  - Method: POST
  - Headers: Content-Type: application/json
  - Body:
      {
        "system_instruction": { "parts": [{ "text": SYSTEM_PROMPT }] },
        "contents": [{ "role": "user", "parts": [{ "text": prompt }] }],
        "generationConfig": { "maxOutputTokens": 8192 }
      }
  - Response type: { candidates: Array<{ content: { parts: Array<{ text?: string }> }, finishReason?: string }> }
  - Extract: candidates[0].content.parts[].text, join
  - Error: Throw if !response.ok OR finishReason === 'MAX_TOKENS' (with message: "생성된 코드가 너무 길어 잘렸습니다...")
  - Edge case: candidates[0] may be undefined or content may be empty

Local Golden Rules

- Both functions return raw code (no markdown stripping here; done in route handlers).
- Do not catch or handle errors; let route handlers decide error response format.
- Do not retry on transient errors (429, 503); let caller handle.
- Do not log API keys, even for debugging.
- Model versions are fixed: claude-haiku-4-5-20251001, gemini-2.5-flash.
- Max tokens: Anthropic 4096, Google 8192 (tune if responses are truncated).
- Response parsing must handle undefined/null values (return empty string, not throw).

Testing Strategy

Manual: curl with valid API key and see response shape.
  - Anthropic: curl -X POST https://api.anthropic.com/v1/messages \
      -H "x-api-key: sk-ant-..." \
      -H "anthropic-version: 2023-06-01" \
      -H "Content-Type: application/json" \
      -d '{"model":"claude-haiku-4-5-20251001",...}'
  - Google: curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIza..." ...

Add logging (before production): Log request/response shapes without API keys.
