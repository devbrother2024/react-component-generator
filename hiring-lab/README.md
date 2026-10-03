# 이력서 1차 검토 실습 (리더 과정)

`resumes/`의 이력서와 첨부 문서는 **강의 실습용 가상 서류**다. 등장하는 사람·회사·서비스는 지어냈으며 특정인의 이력을 담지 않았다.

- 서류: 지원자 5명 × 각 3개 = 15개 (PDF 6 · Markdown 5 · TXT 4)
- 스킬: `.claude/skills/resume-screening/` (평가 기준은 `references/criteria.md`)
- 리뷰어: `.claude/agents/resume-reviewer.md`
- 실행: Claude Code에서 `/resume-screening hiring-lab/resumes`
- 결과: `hiring-lab/results/` (실행 때 생성하며 git에는 올리지 않는다)

## 지원자별 서류

| 지원자 | 함께 검토할 서류 |
|---|---|
| 한서준 | [한서준_경력기술서.txt](resumes/한서준_경력기술서.txt) · [한서준_이력서.pdf](resumes/한서준_이력서.pdf) · [한서준_포트폴리오.md](resumes/한서준_포트폴리오.md) |
| 송하은 | [송하은_이력서.pdf](resumes/송하은_이력서.pdf) · [송하은_지원동기.txt](resumes/송하은_지원동기.txt) · [송하은_포트폴리오.md](resumes/송하은_포트폴리오.md) |
| 문지유 | [문지유_이력서.pdf](resumes/문지유_이력서.pdf) · [문지유_포트폴리오.pdf](resumes/문지유_포트폴리오.pdf) · [문지유_프로젝트노트.md](resumes/문지유_프로젝트노트.md) |
| 조현석 | [조현석_경력기술서.txt](resumes/조현석_경력기술서.txt) · [조현석_이력서.pdf](resumes/조현석_이력서.pdf) · [조현석_포트폴리오.md](resumes/조현석_포트폴리오.md) |
| 윤재민 | [윤재민_경력기술서.txt](resumes/윤재민_경력기술서.txt) · [윤재민_이력서.pdf](resumes/윤재민_이력서.pdf) · [윤재민_포트폴리오.md](resumes/윤재민_포트폴리오.md) |

## 묶기 결과 확인

파일 이름은 `지원자이름_서류종류.확장자`다. 확장자가 달라도 같은 이름으로 묶인다. 실행 직후 **지원자 5명·서류 15개·각 3개**가 잡혔는지 확인한다. 각 지원자의 서류 전체를 함께 읽어 근거·담당 범위·재직 기간을 확인한다.

## 결과 검토

`results/screening-result.html`을 브라우저에서 열어 순위·필수 요건·역량별 근거·면접 질문을 확인한다. 이름 검색·등급 필터·상세 펼침·전체 인쇄/PDF 저장을 지원하며 외부 네트워크 요청 없이 열린다.

같은 내용의 `results/screening-result.md`도 함께 생성된다. 종합 의견은 `results/summary.txt`에 저장하고 집계 명령의 `--summary` 옵션으로 전달해 두 형식에 함께 반영한다. 기준을 바꿔 재계산할 때는 새 집계 JSON으로 종합 의견도 다시 작성한다. 최종 판단은 사람이 한다.
