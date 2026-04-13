# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

프롬프트를 입력하면 Claude API로 React 컴포넌트 코드를 생성하고, react-live로 실시간 미리보기를 제공하는 웹 앱.

## 명령어

```bash
bun install          # 의존성 설치
bun run dev          # Vite 프론트엔드 개발서버 (localhost:5173)
bun run server       # Bun API 프록시 서버 (localhost:3002)
bun run build        # tsc + vite build
bun run lint         # eslint
```

개발 시 터미널 2개 필요: `bun run server` + `bun run dev`

## 아키텍처

**프론트엔드** (React 19 + TypeScript + Vite)와 **백엔드** (Bun 서버)로 구성된 모노리포.

- `server/index.ts` — Bun HTTP 서버. `/api/generate` 엔드포인트가 Claude API에 프록시 요청. 클라이언트로부터 API 키를 받아 사용.
- `src/hooks/useComponentGenerator.ts` — 컴포넌트 생성/삭제 상태 관리 커스텀 훅. `/api/generate`에 POST 요청.
- `src/components/LivePreview.tsx` — `react-live`의 `LiveProvider`를 `noInline` 모드로 사용. 생성된 코드에서 `render(<Component />)` 호출 필요.
- `src/components/ComponentCard.tsx` — 미리보기/코드 탭 전환 카드.
- Vite 프록시 설정: `/api` → `localhost:3002`

## 코드 생성 규칙

서버의 시스템 프롬프트가 생성 코드의 형식을 결정:
- import문 없이 inline 스타일만 사용
- `React.useState` 등 React 전역 참조
- 코드 끝에 `render(<ComponentName />)` 호출 (react-live noInline 모드)
