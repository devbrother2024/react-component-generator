---
name: create-pr
description: >
  현재 브랜치의 변경사항을 정리해 GitHub PR을 생성한다. 커밋되지 않은 변경사항이 있으면
  자동으로 스테이징·커밋·push까지 마친 뒤 PR을 연다. "PR 만들어줘", "PR 생성해줘",
  "pull request 열어줘", "이 브랜치 PR 올려줘", "create a PR", "PR 올려줘" 같은 요청에
  반드시 사용한다. 이미 열려 있는 PR의 리뷰 코멘트를 반영하는 작업은 이 스킬이 아니라
  autofix 스킬을 쓴다.
argument-hint: "[--draft] [base-branch]"
context: fork
agent: general-purpose
allowed-tools:
  - Bash(git status:*)
  - Bash(git branch:*)
  - Bash(git rev-parse:*)
  - Bash(git symbolic-ref:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git add:*)
  - Bash(git commit:*)
  - Bash(git push:*)
  - Bash(gh pr create:*)
  - Bash(gh pr view:*)
  - Bash(gh pr list:*)
  - Bash(gh repo view:*)
  - Bash(gh auth status:*)
  - Read
  - Glob
  - Grep
---

# create-pr: GitHub PR 생성

현재 작업 디렉토리의 git 저장소를 기준으로, 브랜치의 변경사항을 정리해 GitHub PR을 생성한다.
이 스킬은 **포크된 서브에이전트**에서 실행되며 메인 대화 히스토리에 접근할 수 없으므로,
필요한 정보는 전부 저장소 상태(git, gh)에서 직접 읽어 판단한다.

## 워크플로우

### Step 0: 저장소 지침 로드

저장소 루트의 `AGENTS.md`(없으면 `CLAUDE.md`)를 찾아 읽는다. 있으면 커밋 메시지 컨벤션과
빌드/린트/테스트 명령을 이후 단계에서 따른다. 없으면 아래 기본 규칙을 사용한다.

- 커밋 메시지 기본 규칙: `<type>: <한국어 요약>` (`feat`/`fix`/`refactor`/`chore`)
- `gh auth status`로 GitHub CLI 인증 여부를 확인한다. 인증되어 있지 않으면 사용자에게
  `gh auth login`이 필요하다고 안내하고 종료한다.

### Step 1: 브랜치 확인

`git branch --show-current`으로 현재 브랜치를 확인한다.

- **base 브랜치(main/master 등)에 있는 경우**: base 브랜치에서 직접 PR을 열 수 없다.
  변경사항 요약을 근거로 브랜치 이름을 제안하고(예: `feat/provider-fallback`), 사용자에게
  확인받은 뒤 `git checkout -b <브랜치명>`으로 새 브랜치를 만든다. 인자로 브랜치명이 주어졌다면
  그것을 사용하고 다시 묻지 않는다.
- **이미 feature 브랜치에 있는 경우**: 그대로 진행한다.

base 브랜치는 인자로 주어진 `base-branch`가 있으면 그것을, 없으면
`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`으로 저장소의 기본 브랜치를 사용한다.

### Step 2: 변경사항 커밋

`git status`로 unstaged/untracked 파일이 있는지 확인한다. 있으면:

1. `.env`, `.env.*`, 자격증명·시크릿으로 보이는 파일은 **스테이징하지 않는다**. 그런 파일이
   보이면 이름만 사용자에게 알리고 나머지만 진행한다.
2. 나머지 변경 파일을 `git add`로 스테이징한다.
3. `git diff --staged`로 변경 내용을 분석해 커밋 메시지를 생성한다 (Step 0의 컨벤션 사용).
4. `git commit`으로 커밋한다.

이미 base 브랜치 대비 커밋이 있고 unstaged 변경사항이 없으면 이 단계는 건너뛴다.

### Step 3: Push

현재 브랜치를 origin에 push한다. 리모트 추적 브랜치가 없으면 `-u`를 붙인다.

```bash
git push -u origin <브랜치명>
```

### Step 4: PR 정보 수집

다음을 확인해 PR 제목·본문 작성 근거로 삼는다.

- `git log <base>..HEAD --oneline` — base 브랜치 분기 이후의 전체 커밋 목록. 커밋 하나만
  있다면 그 제목을 PR 제목으로 재사용해도 된다.
- `git diff <base>...HEAD --stat` — 변경 파일 범위 파악.
- 이미 같은 브랜치로 열린 PR이 있는지 `gh pr list --head <브랜치명>`으로 확인한다. 있으면
  새로 만들지 않고 기존 PR 정보를 사용자에게 알리고 종료한다.

### Step 5: PR 본문 작성

`references/template.md`를 읽고, 그 구조를 그대로 따라 아래 자리표시자를 채운다.

- `{{SUMMARY}}`: 이 PR이 **왜** 필요한지 1~3개의 불릿. "무엇을 바꿨다"가 아니라 "왜 바꿨는지"
  중심으로 쓴다.
- `{{CHANGES}}`: 커밋 로그와 diff를 근거로 한 주요 변경사항 불릿 목록.
- `{{TEST_PLAN}}`: 저장소에서 감지된 검증 수단(테스트/린트/빌드 명령, Step 0에서 확인한 것)을
  기준으로 한 체크리스트. 실행했다면 결과를, 실행하지 못했다면 그 사실을 명시한다
  (하지 않은 검증을 했다고 쓰지 않는다).

섹션에 채울 내용이 전혀 없으면 그 섹션째로 생략한다.

PR 제목은 70자 이내, 요약형으로 작성한다 (본문에 상세를 담고 제목은 짧게).

### Step 6: PR 생성

`gh pr create`로 PR을 만든다. 본문은 반드시 **heredoc으로 전달**한다 (커밋 메시지·파일 내용에
포함된 특수문자가 셸에서 깨지는 것을 방지하기 위함).

```bash
gh pr create --title "<제목>" --base <base 브랜치> --body "$(cat <<'EOF'
<Step 5에서 채운 본문>
EOF
)"
```

`--draft` 인자가 주어졌으면 `--draft` 플래그를 추가한다.

### Step 7: 결과 보고

`gh pr create`가 출력하는 PR URL을 그대로 전달한다. 추가 설명 없이 URL과 제목만 간단히
보고한다.

## Edge Cases

- **변경사항이 전혀 없고 커밋도 base와 동일**: PR을 열 이유가 없으므로 사용자에게 알리고 종료한다.
- **이미 같은 브랜치로 열린 PR이 있음**: 새로 만들지 않고 기존 PR URL을 알린다.
- **push 거부(리모트에 새 커밋 존재)**: 강제 push를 임의로 시도하지 않는다. 상황을 알리고
  `git pull --rebase` 등 정리가 필요함을 사용자에게 안내한 뒤 중단한다.
- **`gh` 미인증 또는 리모트 저장소 미설정**: 원인을 알리고 종료한다.

## 안전 규칙

- **강제 push(`--force`), base 브랜치 직접 push는 하지 않는다.** 이 스킬은 새 PR을 여는
  용도로 한정한다.
- 커밋·push는 이 실행에서 실제로 변경한 파일에만 한정한다. 무관한 unstaged 변경이 있다면
  Step 2에서 사용자에게 알린 뒤 포함 여부를 확인한다.
- PR 본문에는 자체적으로 생성한 요약만 담는다. 시크릿·자격증명류 문자열은 어떤 경우에도
  포함하지 않는다.
