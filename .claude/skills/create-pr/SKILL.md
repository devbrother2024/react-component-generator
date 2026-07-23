---
name: create-pr
description: |
  현재 브랜치의 변경사항으로 GitHub Pull Request를 생성한다. 커밋과 diff를 분석해 PR 제목·본문을 채우고, 프로젝트 언어에 맞는 템플릿(영문/한국어)을 골라 draft PR을 연다.
  "PR 만들어줘", "PR 생성해줘", "풀 리퀘스트 열어줘", "이 브랜치 PR 올려줘", "create a PR", "open a pull request", "/create-pr" 요청 시 사용한다.
  단순 커밋만 필요할 때(→ commit 스킬)나 이미 열린 PR의 리뷰 코멘트 반영(→ autofix 스킬)에는 사용하지 않는다.
context: fork
allowed-tools: Bash, Read, Write, Grep, Glob
argument-hint: "[--en|--ko] [--ready] [base 브랜치]"
---

# create-pr

현재 작업 브랜치의 변경사항을 정리해 GitHub Pull Request를 생성한다. `context: fork`로 서브 에이전트에서 자율 실행되므로, 이 문서의 절차만으로 사람 개입 없이 PR URL까지 도달할 수 있어야 한다.

기본은 **draft PR** 생성이다. Draft로 열면 사람이 최종 검토 후 ready로 전환할 수 있어, 자율 실행이 성급하게 리뷰를 요청하는 사고를 막는다. `--ready` 인자가 있으면 곧바로 리뷰 요청 상태로 연다.

## 인자

- `--en` / `--ko` — 템플릿 언어를 강제 지정 (자동 감지 override).
- `--ready` — draft가 아닌 ready-for-review 상태로 생성.
- 마지막 위치 인자 — base 브랜치 지정 (미지정 시 리포지토리 기본 브랜치).

## 절차

### 1. 컨텍스트 수집 (병렬 실행)

파일명만 보지 말고 실제 커밋과 diff를 읽어야 정확한 본문을 쓸 수 있다. 아래를 한 번에 실행한다:

```bash
git branch --show-current
git status
gh repo view --json nameWithOwner,defaultBranchRef,url
```

base 브랜치를 정한다: 사용자가 위치 인자로 줬으면 그것, 아니면 `defaultBranchRef`(보통 `main`/`master`). base를 정한 뒤 PR 범위를 파악한다:

```bash
git log <base>..HEAD --oneline
git diff <base>...HEAD --stat
```

### 2. 사전 점검 (가드레일)

- **현재 브랜치가 base와 같으면 중단**한다. PR은 feature 브랜치에서만 연다 — base(=`main` 등)에서 직접 PR을 만들 수 없다. 이 경우 "먼저 작업 브랜치를 만들어 커밋하라"고 안내하고 종료한다.
- `git log <base>..HEAD`가 비어 있으면(커밋 차이 없음) PR 만들 것이 없으므로 중단하고 알린다.
- 커밋되지 않은 변경이 남아 있으면 사용자에게 알린다. 임의로 커밋하지 않는다 — 커밋은 `commit` 스킬의 몫이다.

### 3. 브랜치 push

원격에 브랜치가 없거나 로컬이 앞서 있으면 push 해야 PR을 만들 수 있다:

```bash
git push -u origin <현재 브랜치>
```

base 브랜치로는 절대 직접 push 하지 않는다.

### 4. 템플릿 선택

`--en`/`--ko`가 있으면 그대로 따른다. 없으면 **프로젝트 성격으로 자동 감지**한다 — 해외 오픈소스는 영문, 한국 프로젝트는 한국어가 자연스럽기 때문이다. 다음 신호를 종합해 판단한다:

- README/문서 본문 언어 (한글 비중이 높으면 한국어).
- `git log <base>..HEAD` 및 최근 기존 커밋 메시지 언어.
- `gh repo view`의 owner/nameWithOwner (한국 조직·개인 vs 해외 오픈소스 조직).

애매하면 **최근 커밋 메시지 언어를 우선**한다 — PR을 읽을 사람과 가장 가깝기 때문이다. 판단 근거를 한 줄로 남긴다.

선택한 템플릿을 읽는다 (이 스킬 디렉토리 기준 상대 경로):

- 한국어: `references/template-ko.md`
- 영문: `references/template-en.md`

### 5. 본문·제목 작성

읽어들인 템플릿의 `< >` 자리표시자를 실제 내용으로 채운다. 해당 없는 섹션은 삭제한다.

- **요약/Summary**: 커밋 전체를 관통하는 "무엇을·왜"를 1~2문장으로.
- **변경 사항/Changes**: 커밋 목록과 diff stat을 사람이 읽을 단위로 묶어 나열. 커밋 메시지를 그대로 붙여넣지 말고 의미 단위로 정리.
- **테스트 방법/Test plan**: 프로젝트의 검증 명령을 찾아(`package.json` scripts, `Makefile`, CI 설정 등) 실제 실행 결과를 적는다. 실행하지 않았거나 결과를 모르면 통과했다고 지어내지 말고, 무엇을 실행해야 하는지만 적는다.
- **제목**: 리포지토리 커밋 컨벤션을 따른다(`git log`로 확인). Conventional Commits면 `feat: ...` 형식, 한국어 프로젝트면 한국어 요약. 템플릿 언어와 제목 언어를 일치시킨다.

본문은 임시 파일로 쓴 뒤 `--body-file`로 넘긴다(따옴표 이스케이프 문제를 피하기 위해). scratchpad 등 작업 디렉토리에 작성한다.

### 6. PR 생성

```bash
gh pr create --draft --base <base> --head <현재 브랜치> --title "<제목>" --body-file <본문 파일>
```

- `--ready` 인자가 있으면 `--draft`를 뺀다.
- 성공하면 출력된 **PR URL을 최종 결과로 반환**한다.
- 이미 열린 PR이 있으면(`gh pr create`가 알려줌) 중복 생성하지 말고 기존 PR URL을 반환한다.

## 가드레일 요약

- base/보호 브랜치에서 PR을 만들거나 그쪽으로 push하지 않는다.
- 미실행 테스트를 통과했다고 본문에 적지 않는다.
- 커밋 자체는 이 스킬이 하지 않는다(→ `commit` 스킬).
- 리포지토리에 이미 `.github/pull_request_template.md`가 있으면 그 존재를 결과에 언급한다 — 프로젝트 고유 템플릿이 우선일 수 있다.
