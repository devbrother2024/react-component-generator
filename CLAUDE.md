# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (Bun is the package manager/runtime for the server)
bun install

# Run API server (Bun, port 3002) + Vite dev server concurrently
npm run dev          # or: bun run dev

# Run only the API server (Bun --watch)
bun run server

# Type-check + production build
npm run build         # tsc -b && vite build

# Lint
npm run lint

# Tests (Vitest, jsdom environment)
npm test              # vitest run — runs once
npm run test:watch    # vitest — watch mode

# Run a single test file
npx vitest run src/components/PromptInput.test.tsx
npx vitest run server/generator.test.ts

# Preview production build
npm run preview
```

Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` and/or `GOOGLE_API_KEY` to avoid entering keys in the UI. Without a server-side key, the user must paste one into the UI for the request to succeed.

## Architecture

This is a two-process app: a Bun API server (`server/`) and a Vite/React frontend (`src/`), run together via `concurrently` under `npm run dev`. In development, Vite proxies `/api/*` to the Bun server at `http://localhost:3002` (see `vite.config.ts`).

**Request flow**: `App.tsx` → `useComponentGenerator` hook → `POST /api/generate` → `server/index.ts` picks a provider (`anthropic` or `google`) → calls the provider's API with a fixed `SYSTEM_PROMPT` → the raw AI text is normalized by `server/generator.ts` (`stripCodeFences`, `ensureRenderCall`) → the resulting code string is sent back and executed client-side by `react-live` (`noInline` mode) inside `LivePreview.tsx`.

**Why the AI output has strict constraints**: `SYSTEM_PROMPT` in `server/index.ts` requires plain JavaScript (no imports, no TypeScript syntax, inline styles only, must end with `render(<Component />)`) because the code runs directly in the browser via `react-live` with React only available as a global — there is no transpile/bundle step for generated code. If you change this prompt, keep it consistent with what `generator.ts`'s `ensureRenderCall`/`stripCodeFences` expect to clean up.

**Provider fallback**: Google requests go through `withModelFallback` (`server/fallback.ts`), trying `GOOGLE_MODELS` in `server/index.ts` in order (currently `gemini-3.1-flash-lite` → `gemini-3.5-flash`) and returning the first success. Anthropic has no fallback list (single model, `claude-haiku-4-5-20251001`).

**API key resolution**: `resolveApiKey()` in `server/index.ts` prefers a client-supplied key over the server's `ANTHROPIC_API_KEY`/`GOOGLE_API_KEY` env vars. `GET /api/config` reports (without exposing values) which env keys are configured, so the frontend can skip prompting for a key when the server already has one.

**Server code is split for testability**: `server/generator.ts` and `server/fallback.ts` are pure functions with no side effects, so they're unit-tested directly (`*.test.ts`). `server/index.ts` (the `Bun.serve` HTTP handler, routing, provider calls) has no automated tests currently.

**Frontend state**: All generation state (`components`, `isLoading`, `error`) lives in the `useComponentGenerator` hook, called once from `App.tsx`. There is no global store — state flows down through props (`PromptInput` → `onGenerate`, `ComponentCard` → `LivePreview`/`CodeView`).

**Custom accessible combobox**: `src/components/SearchableSelect.tsx` implements the WAI-ARIA combobox pattern from scratch (role="combobox" + listbox + `aria-activedescendant`, full keyboard support) rather than using a native `<select>` or a library, to support in-place search filtering. Follow this pattern (function declarations ordered before the `useEffect`/handlers that reference them, to satisfy the `react-hooks` lint rules) if adding similar custom interactive components.

**Styling**: No CSS modules or per-component stylesheets — all component styles live in `src/App.css` as global classes using the CSS custom properties defined in `:root` (colors, shadows). Keep new components consistent with this single-stylesheet convention and the existing 8px border-radius / 42px control-height scale.
