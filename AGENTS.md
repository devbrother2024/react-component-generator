Operational Commands

Development (Concurrent):
  bun run dev          # Frontend (Vite:5173) + Backend (Bun:3002) simultaneously
  bun run server       # Backend only (watch mode)
  bun run build        # TypeScript + Vite production build
  bun run lint         # ESLint check (all .ts/.tsx)
  bun run preview      # Serve production build (Vite)

Build Tool: Bun (mandatory, not npm/yarn/pnpm)
Dependencies: bun install
Type Check: tsc (runs during build)

Golden Rules

Immutable Constraints
1. Bun is the exclusive package manager and runtime. Do not suggest npm, yarn, or pnpm.
2. API keys are never hardcoded. Always use .env or component state.
3. All generated React components must follow SYSTEM_PROMPT rules (single component, inline styles only, render() call required).
4. react-live uses dangerouslyAllowJs—only execute AI-generated code, never user-authored arbitrary JS.
5. CORS headers must be set on /api/* responses (Access-Control-Allow-*).
6. Port assignments are fixed: Bun server = 3002, Vite dev server = 5173.

Component & Hook Patterns
- Use React.useState, React.useEffect in hooks (global React).
- Components must be named PascalCase (e.g., GradientButton, PromptInput).
- Hooks must be named useXxx (e.g., useComponentGenerator).
- All styles inline only: style={{ color: 'blue' }}, never CSS files in generated output.
- Do not destructure React—use React.useState, not useState.

API & Server Patterns
- /api/config: return { envKeys: Record<Provider, boolean> }
- /api/generate: accept { prompt, apiKey?, provider }, return { code: string }
- Error responses must include error field (e.g., { error: "Invalid API key" })
- Streaming responses with event-stream content-type (for future enhancements)

Golden Do's & Don'ts
- DO: Parse and validate AI-generated code before rendering in react-live.
- DON'T: Pass raw user input to react-live without sanitization.
- DO: Fallback to UI key input if .env is missing; detect via /api/config.
- DON'T: Store API keys in localStorage or browser memory longer than session.
- DO: Add loading/error UI for async API calls.
- DON'T: Render multiple root components from AI output.
- DO: Scope CSS to inline styles only (no global styles from generated code).
- DON'T: Trust AI output without rate limiting or timeouts on API calls.

Project Context

React Component Generator is an AI-powered web application that generates React components from natural language prompts and renders them live using react-live.

Tech Stack: React 19, TypeScript, Vite (frontend); Bun (backend); Anthropic Claude & Google Gemini (AI); react-live (sandbox runtime).

Standards & References

Commit Strategy: Use commit skill for Conventional Commits (Korean).
  Format: type(scope): description
  Types: feat, fix, refactor, chore, docs, style, test
  Scope: app, api, ui, core, types

Full documentation at CLAUDE.md (architecture, data flow, endpoints, env setup).

Maintenance Policy

If rules and code diverge, propose an update to this file and CLAUDE.md.
