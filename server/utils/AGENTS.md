Utility Functions

Code formatting, API key resolution, and helper utilities.

Module Context

Three functions for data transformation and validation:
- resolveApiKey(): Select API key (clientKey priority over .env).
- stripCodeFences(): Remove markdown code blocks from AI response.
- ensureRenderCall(): Append render(<Component />) if missing.

Tech Stack & Constraints

- Pure TypeScript functions, no external dependencies.
- RegExp for code fence detection and component name extraction.
- Synchronous (no async needed).

Implementation Patterns

resolveApiKey(provider: Provider, clientKey?: string): string | null
  - Logic: return clientKey || ENV_KEYS[provider] || null
  - Priority: 1. clientKey (frontend override), 2. ENV_KEYS[provider] (server .env), 3. null (missing)
  - Used by: Route handler /api/generate to validate before AI call

stripCodeFences(text: string): string
  - Removes opening fence: /^```(?:jsx|tsx|javascript|typescript)?\n?/gm
  - Removes closing fence: /```$/gm
  - Calls .trim() to remove leading/trailing whitespace
  - Edge case: Return text.trim() if no fences found

ensureRenderCall(code: string): string
  - Check if code contains "render(" using /\brender\s*\(/
  - If yes: return code unchanged
  - If no: Extract component name using /(?:const|function)\s+([A-Z]\w+)/
    * Match group [1] = PascalCase name
    * Append: code + '\n\nrender(<' + name + ' />);'
  - If no match: return code unchanged (malformed code, let renderer handle error)

Local Golden Rules

- resolveApiKey: Do not store result in cache (allow .env to change between requests in dev).
- stripCodeFences: Handle both uppercase (JSX, TSX) and lowercase (jsx, tsx) variants.
- ensureRenderCall: Do not modify code if render() already present; idempotent.
- All functions are pure (no side effects, same input = same output).
- No logging within utils (let callers decide logging strategy).

Testing Strategy

Unit test each function independently:
  - resolveApiKey: Mock ENV_KEYS, test priority order (clientKey > env > null)
  - stripCodeFences: Test markdown variants (jsx, tsx, javascript, typescript), nested code
  - ensureRenderCall: Test with/without render(), valid/invalid component names, malformed code

Manual: bun run dev, trigger /api/generate, check response code formatting.
