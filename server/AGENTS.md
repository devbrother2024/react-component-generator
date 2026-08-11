# server/AGENTS.md

## Module Context

`Bun.serve` 기반 API 프록시. 프론트엔드의 `/api/generate`, `/api/config` 요청을 받아 Anthropic/Google 중 선택된 프로바이더를 호출하고, 응답을 react-live가 실행 가능한 코드로 정규화해 돌려준다.

## Tech Stack & Constraints

- HTTP 서버는 `Bun.serve`만 사용한다 — Express 등 별도 프레임워크를 추가하지 마라.
- 외부 API 호출은 Bun 내장 `fetch`만 사용한다.
- Google 모델은 `GOOGLE_MODELS` 배열(`server/index.ts`) 순서대로 폴백 시도된다. 배열의 순서 자체가 우선순위이므로, 모델 추가/변경 시 이 순서 의미를 유지하라.

## Implementation Patterns

- 부수효과 없는 순수 함수는 별도 파일로 분리한다: `generator.ts`(`stripCodeFences`, `ensureRenderCall`), `fallback.ts`(`withModelFallback`). `Bun.serve` 콜백(`index.ts`)에는 이 순수 함수들을 조합하는 로직만 둔다.
- 에러 메시지 매핑: HTTP 503 → "API 서버가 일시적으로 과부하 상태입니다...", 429 → "요청이 너무 많습니다...", 그 외는 원본 에러 메시지를 그대로 반환한다. 새 프로바이더의 에러도 이 패턴을 따른다.
- API 키 해석 순서: 클라이언트가 요청 body에 실어 보낸 키 → `.env`의 프로바이더별 환경변수 순으로 폴백한다 (`resolveApiKey`). 이 순서를 바꾸지 마라.

## Testing Strategy

- `bun test` (Vitest, `vite.config.ts`의 `test.include`가 `server/**/*.test.ts`를 포함) 로 실행된다.
- `Bun.serve` 인스턴스를 직접 띄우는 테스트는 작성하지 않는다. 새 로직은 `generator.ts`/`fallback.ts`처럼 순수 함수로 뽑아 단위 테스트하라 (예: `server/fallback.test.ts`의 `vi.fn` 기반 스텁 패턴 참고).

## Local Golden Rules

- `SYSTEM_PROMPT`(`index.ts`)는 react-live 실행 계약(임포트 금지, TS 문법 금지, `render()` 호출 필수)을 강제한다. 프롬프트 문구를 수정할 때 이 계약을 완화하면 `ensureRenderCall`/`stripCodeFences`가 깨질 수 있으니 함께 검토하라.
- 모든 `Response.json` 호출에는 `CORS_HEADERS`를 반드시 포함시켜라 (에러 응답 경로 포함). 누락 시 프론트엔드에서 CORS 오류가 발생한다.
