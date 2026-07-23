# AGENTS.md — server/

Bun으로 실행되는 AI 프록시 서버. 클라이언트 요청을 받아 Anthropic/Google API를 대신 호출하고, 응답을 react-live에서 실행 가능한 코드로 정규화해 반환한다. React/DOM 의존성 없음.

## Runtime & Constraints

- Node가 아닌 **Bun** 런타임. `Bun.serve`, 전역 `fetch`를 사용한다. Express 등 서버 프레임워크를 추가하지 마라.
- 포트 3002 고정. 라우팅은 `index.ts`의 `fetch` 핸들러 내 `url.pathname` 분기로 처리한다.
- 모든 응답에 `CORS_HEADERS`를 붙인다. OPTIONS preflight를 먼저 처리한다.

## Generated-Code Contract (핵심)

`SYSTEM_PROMPT`(`index.ts`)가 AI에 요구하는 출력 규약. 미리보기가 동작하려면 이 계약이 유지되어야 한다:
- 생성 코드는 순수 JavaScript. import 금지, TypeScript 문법 금지, 인라인 스타일만.
- 마지막에 `render(<Component />)` 호출이 있어야 react-live(noInline)가 렌더링한다.
- 응답 후처리: `stripCodeFences`(마크다운 펜스 제거) → `ensureRenderCall`(render 누락 시 주입). 이 두 함수는 `generator.ts`의 순수 함수이며 반드시 단위 테스트와 함께 수정한다.

## Provider Integration

- `Provider = 'anthropic' | 'google'`. 기본값 `anthropic`.
- 모델 ID는 소스에 하드코딩. Google은 `GOOGLE_MODELS` 배열 순서대로 `withModelFallback`(`fallback.ts`)로 폴백한다. Anthropic은 단일 모델.
- 모델 ID를 바꾸거나 추가할 때는 루트 규칙대로 `claude-api` 스킬로 유효한 ID인지 먼저 확인하라.
- 에러 상태코드(429/503)는 사용자용 한국어 메시지로 변환해 반환한다.

## Local Golden Rules

Do:
- 새 로직은 부수효과 없는 순수 함수로 분리해 `*.test.ts`로 검증한다(`generator.test.ts`, `fallback.test.ts` 패턴).
- API 키는 `resolveApiKey`(클라이언트 키 → env 순)로만 해석한다.

Don't:
- 프로바이더 함수(`callAnthropic`/`callGoogleModel`)에 응답 파싱 외 로직을 섞지 마라.
- 생성 코드 계약(import 금지, `render()` 필수)을 깨는 방향으로 프롬프트/정규화를 바꾸지 마라.
