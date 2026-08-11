# AGENTS.md

## Operational Commands

- Package manager: **bun 고정**. npm/yarn/pnpm 사용 금지 (`bun.lock` 존재).
- `bun install` — 의존성 설치.
- `bun run dev` — API 서버(`server/index.ts`, port 3002) + Vite 프론트엔드(port 5173) 동시 실행.
- `bun run server` — API 서버만 watch 모드로 실행.
- `bun run build` — `tsc -b && vite build`.
- `bun run lint` — ESLint 검사.
- `bun test` / `bun run test:watch` — Vitest 실행 (`src/**/*.test.{ts,tsx}`, `server/**/*.test.ts`).

## Golden Rules

- **API 키를 절대 하드코딩하지 마라.** `.env`(`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`)는 gitignore 대상이며, 클라이언트가 직접 입력한 키가 있으면 그것을 우선 사용한다 (`server/index.ts`의 `resolveApiKey`).
- **AI가 생성하는 코드는 react-live 실행 계약을 따라야 한다**: import/export 금지, TypeScript 문법 금지, 컴포넌트 선언 후 `render(<X />)` 호출 필수. 이 계약을 변경하려면 `server/generator.ts`의 정규화 로직도 함께 수정하라. 자세한 내용은 [[server/AGENTS.md]] 참고.
- **모든 서버 응답에 CORS 헤더를 포함하라** (에러 응답 포함). `server/index.ts`의 `CORS_HEADERS`를 재사용한다.
- `.env`, `.env.example`을 커밋하지 마라. 실제 키 값이 포함된 파일은 절대 스테이징하지 않는다.

## Project Context

React 컴포넌트 생성기: 사용자가 프롬프트를 입력하면 Anthropic Claude 또는 Google Gemini가 React 컴포넌트를 생성하고, `react-live`로 실시간 미리보기를 제공한다.

Tech Stack: React 19, TypeScript, Vite, Bun (API 프록시 서버), react-live, Vitest, Testing Library, ESLint (typescript-eslint).

## Standards & References

- TypeScript strict 모드 활성화 (`tsconfig.app.json`): `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` 등 적용. 사용하지 않는 변수/매개변수를 남기지 마라.
- 테스트 파일은 소스 파일과 같은 디렉토리에 `*.test.ts(x)`로 위치시킨다 (예: `server/generator.test.ts`, `src/components/PromptInput.test.tsx`).
- 부수효과가 있는 코드(예: `Bun.serve`, DOM)와 순수 로직을 분리하여 순수 함수 단위로 테스트 가능하게 작성한다 (`server/generator.ts`, `server/fallback.ts` 참고).
- 커밋 메시지: Conventional Commit 타입(`feat:`, `fix:`, `chore:`) + 한국어 설명 (예: `feat: Google 모델 실패 시 자동 폴백 추가`).
- **Maintenance Policy:** 이 문서의 규칙이 실제 코드와 어긋나는 것을 발견하면, 임의로 무시하지 말고 사용자에게 업데이트를 제안하라.

## Context Map

- **[API 프록시 / 멀티 프로바이더 로직 수정](./server/AGENTS.md)** — `server/` 내 파일을 수정하거나 새 AI 프로바이더를 추가할 때.
