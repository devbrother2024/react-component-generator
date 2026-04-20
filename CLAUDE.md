@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📌 프로젝트 개요

AI 프롬프트를 입력하면 React 컴포넌트를 자동 생성하고 실시간 미리보기를 제공하는 웹 애플리케이션.

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Bun 런타임 (AI API 프록시 서버)
- **AI 제공자**: Anthropic Claude (claude-haiku-4-5-20251001) / Google Gemini (gemini-2.5-flash)
- **실시간 렌더링**: react-live (컴포넌트 런타임 평가)

---

## 📁 디렉토리 구조

```
react-component-generator/
├── src/
│   ├── App.tsx                        # 메인 앱 컴포넌트
│   ├── main.tsx                       # React 진입점
│   ├── App.css                        # 앱 스타일 (git 미추적)
│   ├── components/
│   │   ├── PromptInput.tsx           # 프롬프트 입력 폼
│   │   ├── ComponentCard.tsx         # 생성된 컴포넌트 카드
│   │   ├── LivePreview.tsx           # react-live 렌더 영역
│   │   └── CodeView.tsx              # 코드 표시 영역
│   ├── hooks/
│   │   └── useComponentGenerator.ts  # 상태 관리 & API 호출 로직
│   └── types/
│       └── index.ts                  # TypeScript 타입 정의
│
├── server/
│   └── index.ts                      # Bun API 서버
│
├── public/                            # 정적 자산
├── .env                              # API 키 설정 (git 무시)
├── package.json
├── tsconfig.json                     # TS 설정
├── vite.config.ts                    # Vite 설정
└── index.html                        # HTML 진입점
```

---

## 🔄 데이터 흐름

### 컴포넌트 생성 워크플로우

```
사용자 입력
    ↓
App.tsx (API 키, Provider 관리)
    ↓
PromptInput.tsx (폼 제출)
    ↓
useComponentGenerator() (API 호출)
    ↓
server/index.ts (AI API 프록시)
    ↓
Anthropic API 또는 Google Gemini
    ↓
ComponentCard.tsx (카드 표시)
    ├── LivePreview.tsx (react-live 렌더링)
    └── CodeView.tsx (코드 표시)
```

---

## 🎯 주요 컴포넌트 역할

### **App.tsx** (메인 컴포넌트)
- Provider (Anthropic/Google) 선택
- API 키 관리 (.env 또는 수동 입력)
- 전체 UI 레이아웃

### **PromptInput.tsx**
- 텍스트 입력 폼
- 예시 프롬프트 버튼들
- 생성 버튼 (`isLoading` 상태 연결)

### **ComponentCard.tsx**
- 생성된 컴포넌트 카드 UI
- 재생성, 새로고침, 삭제 버튼
- LivePreview와 CodeView를 자식으로 포함

### **LivePreview.tsx**
- `react-live`의 `LiveProvider`, `LiveEditor`, `LivePreview` 활용
- 컴포넌트 실시간 렌더링
- 에러 처리

### **CodeView.tsx**
- 생성된 코드를 보기 좋게 표시
- 문법 강조 (선택)

### **useComponentGenerator.ts**
- `useState`: 컴포넌트 배열, 로딩, 에러 상태
- 함수: `generate()`, `removeComponent()`, `clearAll()`
- API 호출: `/api/generate` (POST)

---

## 🔌 API 엔드포인트 (server/index.ts)

**핵심**: Bun 백엔드는 **API 프록시** 역할. 클라이언트 API 키를 받아 Anthropic/Google API를 호출하고 결과만 반환.

### **GET /api/config**
.env에 설정된 API 키 여부 확인
```
응답: { "envKeys": { "anthropic": true, "google": false } }
```

### **POST /api/generate**
프롬프트 → AI 컴포넌트 코드 생성
```
요청:
{
  "prompt": "파란색 버튼",
  "apiKey": "sk-ant-...",        // 선택: env에 없으면 클라이언트 제공
  "provider": "anthropic"         // "anthropic" 또는 "google"
}

응답:
{
  "code": "const Button = () => { ... }; render(<Button />);"
}
```

**API 선택:**
- **Anthropic**: `callAnthropic()` → claude-haiku-4-5-20251001 호출
- **Google**: `callGoogle()` → gemini-2.5-flash 호출

---

## 🛠 개발 명령어

```bash
bun install              # 의존성 설치
bun run dev             # 서버 + Vite 동시 실행 (포트 3002 & 5173)
bun run server          # Bun 서버만 실행 (watch 모드)
bun run build           # TypeScript 컴파일 + Vite 빌드
bun run lint            # ESLint 검사
bun run preview         # 빌드 결과 미리보기
```

---

## 📋 AI 프롬프트 규칙 (server/index.ts)

**SYSTEM_PROMPT에 정의된 생성 규칙** (모든 AI 제공자 동일):

| 규칙 | 설명 |
|------|------|
| **1개 컴포넌트** | 정확히 1개의 React 함수 컴포넌트만 생성 |
| **인라인 스타일만** | CSS 파일/CSS Module 불가, 모든 스타일은 `style={{...}}` |
| **render 호출** | 마지막에 반드시 `render(<ComponentName />)` 필수 |
| **순수 JavaScript** | import/type 문법 불가, 타입 주석 불가 |
| **글로벌 React** | React는 전역 스코프에서 사용 가능 (`React.useState` 등) |
| **응답 형식** | 코드만 응답, 마크다운/설명 불포함 |

**예시 (SYSTEM_PROMPT에서):**
```javascript
const GradientButton = () => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button style={{ /* ... */ }} onMouseEnter={() => setHovered(true)} >
      Click me
    </button>
  );
};
render(<GradientButton />);
```

---

## ⚙️ 환경 설정

**.env 파일 구조**
```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

- `.env` 있을 때: 자동으로 서버가 사용 (UI에서 입력 불필요)
- `.env` 없을 때: UI에서 API 키 수동 입력 필요

---

## 🧠 상태 관리

### **App.tsx 상태**
- `apiKey` (string): 사용자 입력 API 키
- `provider` (Provider): 선택된 AI 제공자
- `envKeys` (Record<Provider, boolean>): .env 설정 여부
- `showKey` (boolean): 키 표시/숨김

### **useComponentGenerator.ts 상태**
- `components` (GeneratedComponent[]): 생성된 컴포넌트 목록
- `isLoading` (boolean): 생성 중 여부
- `error` (string | null): 에러 메시지

### **GeneratedComponent 타입** (src/types/index.ts)
```typescript
interface GeneratedComponent {
  id: string;
  prompt: string;
  code: string;
  createdAt: Date;
}
```

---

## 💾 Git 커밋 규칙

프로젝트에서는 `commit` 스킬을 사용하여 자동으로 커밋을 관리합니다.

**커밋 메시지 형식**: Conventional Commits (한국어)
```
type(scope): description

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

**타입 분류:**
- `feat`: 새로운 기능 추가 (UI 컴포넌트, API 엔드포인트)
- `fix`: 버그 수정 (성능 개선, 에러 처리)
- `refactor`: 코드 리팩토링 (기능 변경 없음)
- `chore`: 의존성, 설정, 빌드 도구 변경
- `docs`: 문서 변경 (README, 주석)
- `style`: 스타일/포맷 변경 (CSS, 레이아웃)
- `test`: 테스트 추가/수정

**커밋할 때:**
```bash
사용자가 "커밋해줄래" 또는 "커밋" 요청 시 commit 스킬 사용
→ 변경사항을 자동으로 분석하여 논리적 단위로 분리
→ 여러 개의 커밋 생성 (기능 단위)
→ 모든 커밋에 Co-Authored-By 라인 자동 추가
```

---

## 🔐 주의사항

1. `.env` 파일은 git에 무시됨 (`.gitignore`)
2. API 키 전송 시 CORS 헤더 설정됨 (`Access-Control-Allow-*`)
3. Bun 서버는 포트 3002에서 실행
4. Vite 개발 서버는 포트 5173에서 실행
5. react-live는 보안상 `dangerouslyAllowJs` 사용 (평가 기능 활성화)