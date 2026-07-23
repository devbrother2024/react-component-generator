# AGENTS.md

프롬프트로 React 컴포넌트를 생성해 실시간 미리보기/코드를 제공하는 도구. 프론트엔드(React+Vite)와 AI 프록시 백엔드(Bun)로 구성된다.

## Operational Commands

- 패키지 매니저는 `bun` 고정. `npm`/`yarn`/`pnpm` 사용 금지 (`bun.lock` 기준).
- 의존성 설치: `bun install`
- 개발 서버(API + Vite 동시): `bun run dev`
- API 서버만: `bun run server` (Bun 런타임, 포트 3002)
- 테스트 실행: `bun run test` (vitest, 1회 실행). watch: `bun run test:watch`
- 린트: `bun run lint`
- 빌드: `bun run build` (`tsc -b` 타입체크 후 `vite build`)
- Vite는 `/api`를 `localhost:3002`로 프록시한다. 프론트는 항상 상대경로 `/api/...`로 호출한다.

## Golden Rules

Immutable:
- API 키를 코드에 하드코딩하지 마라. 키는 `.env`(`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`) 또는 클라이언트 입력으로만 받는다.
- `.env`는 커밋하지 마라.

Do:
- 코드에서 Claude/Anthropic/모델 ID(`claude-*`, `gemini-*`)를 다룰 때는 `claude-api` 스킬을 먼저 확인하고 최신 모델 ID를 검증하라. 모델 ID는 소스에 하드코딩되어 있다(`server/index.ts`).
- 기존 스타일(함수형 컴포넌트, 커스텀 훅, 순수 함수 분리)을 따르라.
- 테스트 설명(`it('...')`)은 한국어로, 동작을 서술한다. 기술 용어는 영문 유지.

Don't:
- 요청받지 않은 라이브러리를 추가하지 마라. 의존성은 최소(`react`, `react-dom`, `react-live`)로 유지한다.
- 상태관리 라이브러리/라우터/CSS 프레임워크를 임의로 도입하지 마라. 스타일은 CSS 파일 + 인라인 스타일로 처리한다.

## Tech Stack

React 19 · TypeScript · Vite 8 · Bun (백엔드 런타임) · react-live (미리보기) · vitest + Testing Library (테스트)

## Standards & References

- 프로젝트 소개/실행법은 `README.md` 참조 (중복 작성 금지).
- 커밋 메시지: 한국어, Conventional Commits 형식(`feat:`, `fix:`, `refactor:` 등).
- 테스트 컨벤션: `describe`/`it` 구조, `it` 설명은 한국어. 부수효과 없는 로직은 순수 함수로 분리해 단위 테스트한다(`server/generator.ts` 참고).
- Maintenance Policy: 이 문서의 규칙이 코드와 어긋나면, 임의로 무시하지 말고 문서 업데이트를 함께 제안하라.

## Context Map

- **[AI 프록시 서버 / 프로바이더 연동](./server/AGENTS.md)** — Bun 서버, AI API 호출, 생성 코드 정규화, 모델 폴백 작업 시.
