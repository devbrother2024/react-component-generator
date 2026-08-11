---
name: create-pr
description: 현재 브랜치의 커밋 히스토리와 base 브랜치 대비 전체 diff를 분석해 PR 제목/본문 초안을 작성하고, 사용자 승인을 받은 뒤 push와 gh pr create로 PR을 생성한다. 사용자가 "PR 만들어줘", "PR 올려줘", "풀리퀘스트 만들어줘", "pull request 생성해줘", "이 브랜치로 PR 열어줘", "이거 리뷰 요청하고 싶어" 등 현재 브랜치의 변경사항을 PR로 올리려는 의도를 보이면 반드시 이 스킬을 사용하라. 이미 열려 있는 PR을 수정/머지하는 요청에는 사용하지 않는다.
context: fork
allowed-tools: Read, Grep, Glob, Bash
---

# Create PR

현재 브랜치의 커밋 히스토리와 diff 전체를 분석해 PR 제목/본문을 작성하고, 사용자 승인을 받아 push와 PR 생성까지 진행하는 스킬입니다.

핵심은 "리뷰어가 커밋을 하나하나 훑지 않고 PR 설명만 읽어도 무엇이, 왜 바뀌었는지 알 수 있어야 한다"는 것입니다. 최신 커밋 하나만 보고 요약하면 브랜치가 갈라진 뒤 쌓인 다른 커밋들을 놓치므로, 항상 **base 브랜치와의 전체 diff**를 기준으로 작성합니다.

## 절차

### 1. 현재 상태 파악

병렬로 확인합니다:
- `git status --short --branch` — 현재 브랜치, 스테이징/미스테이징 변경, untracked 파일 확인
- `git branch -vv` — 원격 추적 브랜치 존재 여부, ahead/behind 상태

현재 브랜치가 base 브랜치(main/master 등)와 같다면 **즉시 중단**하고 사용자에게 알립니다 — base에서 직접 PR을 만들 수 없으므로 새 브랜치가 필요합니다.

### 2. base 브랜치 판별

다음 중 되는 것을 사용합니다:
- `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`
- 실패하면 `git remote show origin`의 `HEAD branch` 라인
- 둘 다 안 되면 `git branch -r` 목록에서 `main`/`master`를 추정하고, 애매하면 사용자에게 확인

### 3. 커밋 히스토리·diff 전체 분석

**최신 커밋 하나만 보지 마세요.** 항상 브랜치가 base에서 갈라진 지점부터 전체를 봅니다:
- `git log --oneline <base>..HEAD` — 이 PR에 포함될 모든 커밋
- `git diff <base>...HEAD` — 실제로 합쳐질 전체 변경사항
- 스테이징되지 않았거나 커밋되지 않은 변경이 있다면 사용자에게 알립니다 — 그 변경은 PR에 포함되지 않습니다

### 4. 기존 PR 템플릿 확인 (저장소가 있으면 그것을 우선)

Glob으로 다음을 찾습니다:
- `.github/pull_request_template.md`
- `.github/PULL_REQUEST_TEMPLATE/*.md`

저장소 자체 템플릿이 있으면 그 구조를 따르세요. 없으면 이 스킬의 `references/pr-template.md`를 사용합니다. 저장소에 기존 PR들이 있다면 `gh pr list --state all --limit 5`로 제목/본문 스타일 관례도 함께 참고하세요.

### 5. PR 제목·본문 작성

- **제목**: 70자 이내, 무엇이 바뀌었는지 한 줄로. 저장소가 커밋 타입 프리픽스(`feat:`, `fix:` 등) 관례를 쓴다면 제목에도 맞추되, 강제하지는 않습니다.
- **본문**: 템플릿의 각 섹션을 실제 diff/로그에 근거해 채웁니다. bullet은 "무엇을 왜 바꿨는지" 관점으로 쓰고, diff나 파일 목록을 그대로 나열하지 않습니다.
- **Test plan**: 실제로 실행/확인한 것(lint, test, build 등 실행 결과)과 아직 확인하지 못해 리뷰어가 봐야 할 것을 체크박스로 구분합니다. 확인하지 않은 것을 확인했다고 쓰지 마세요.

### 6. 승인 요청 — 실행 전 반드시 확인

작성한 제목/본문 초안 전체와 함께, 다음을 사용자에게 보여주고 승인을 받습니다(AskUserQuestion 사용 가능):
- push가 필요한지 (브랜치가 원격에 없거나 뒤처져 있는 경우)
- 이 초안으로 PR을 생성해도 되는지

**승인 전에는 `git push`나 `gh pr create`를 실행하지 않습니다.** "PR 만들어줘"라는 최초 요청 자체가 초안 작성 이후의 실행까지 승인한 것은 아닙니다 — 초안을 보여주고 확인받는 단계를 항상 거칩니다.

### 7. 실행

승인받은 뒤:
1. 브랜치가 원격에 없으면 `git push -u origin <branch>`, 이미 있으면 `git push` (강제 push 금지)
2. PR 본문은 항상 heredoc으로 전달해 줄바꿈/특수문자 깨짐을 막습니다:
   ```bash
   gh pr create --title "<제목>" --body "$(cat <<'EOF'
   <본문>
   EOF
   )"
   ```
3. 생성된 PR URL을 사용자에게 전달하고 마무리합니다.

## 하지 말아야 할 것

- base 브랜치에서 직접 PR을 만들거나 push하지 않습니다.
- 사용자 승인 없이 `git push`나 `gh pr create`를 실행하지 않습니다.
- `--force` / `--force-with-lease` push를 사용하지 않습니다.
- Co-Authored-By나 "Generated with Claude Code" 같은 attribution을 임의로 추가하지 않습니다 — 전역 설정에서 이미 비활성화되어 있을 수 있고, 사용자가 명시적으로 요청한 경우에만 추가합니다.
- 최신 커밋 하나만 보고 PR 본문을 작성하지 않습니다 — 항상 base와의 전체 diff/로그를 기준으로 합니다.
- 이미 열려 있는 PR의 본문을 덮어쓰거나 머지하지 않습니다 — 이 스킬은 새 PR 생성 전용입니다.

## 참고

- PR 본문 기본 템플릿: `references/pr-template.md`
