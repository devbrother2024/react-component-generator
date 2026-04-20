# React 컴포넌트 생성기 - 프로젝트 구조

## 📌 프로젝트 개요

AI 프롬프트를 입력하면 React 컴포넌트를 자동 생성하고 실시간 미리보기를 제공하는 웹 애플리케이션.

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Bun 런타임 (API 프록시 서버)
- **AI 제공자**: Anthropic Claude / Google Gemini
- **실시간 렌더링**: react-live 라이브러리

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

## 🔌 API 엔드포인트

### **GET /api/config**
env에 설정된 API 키 여부 확인
```json
{ "envKeys": { "anthropic": true, "google": false } }
```

### **POST /api/generate**
프롬프트 → AI 컴포넌트 코드 생성
```json
요청:
{
  "prompt": "파란색 버튼",
  "apiKey": "sk-ant-...",
  "provider": "anthropic"
}

응답:
{
  "code": "const Button = () => { ... }; render(<Button />);"
}
```

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

## 📋 AI 프롬프트 규칙

**server/index.ts의 SYSTEM_PROMPT:**
- 반드시 React 컴포넌트 1개만 생성
- 인라인 스타일 전용 (CSS 파일 금지)
- `render(<ComponentName />)` 호출 필수
- 순수 JavaScript (TypeScript 문법 불가)
- import 금지 (React는 글로벌 스코프)

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

## 🔐 주의사항

1. `.env` 파일은 git에 무시됨 (`.gitignore`)
2. API 키 전송 시 CORS 헤더 설정됨 (`Access-Control-Allow-*`)
3. Bun 서버는 포트 3002에서 실행
4. Vite 개발 서버는 포트 5173에서 실행
5. react-live는 보안상 `dangerouslyAllowJs` 사용 (평가 기능 활성화)

---

## 📝 최근 커밋

- `7bc0c28`: Anthropic 모델 변경
- `7f586d0`: CLAUDE.md 삭제
- `6fe8540`: PR 병합 #2
- `5c18a4f`: README 업데이트 (멀티 프로바이더)
- `304ec1b`: 프로젝트 설정 파일 업데이트

---

## 🎨 제안 개선사항

- [ ] 컴포넌트 코드 복사 기능 추가
- [ ] 생성 이력 로컬스토리지 저장
- [ ] 다크모드 지원
- [ ] 컴포넌트 공유 기능 (URL 인코딩)
- [ ] 코드 문법 강조 (Prism.js 또는 Shiki)
