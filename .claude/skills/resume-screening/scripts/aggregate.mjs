// 지원자별 검토 결과를 모아 순위표를 만든다. 총점과 등급은 여기서만 계산한다.
// 가중치와 등급 기준은 ../references/criteria.md 의 표를 읽는다.
// 사용: bun aggregate.mjs <results 폴더>   (results/individual/*.md 를 읽고 results/screening-result.md 를 쓴다)
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const resultsDir = process.argv[2] && resolve(process.argv[2]);
if (!resultsDir) {
  console.error("사용법: bun aggregate.mjs <results 폴더>");
  process.exit(1);
}
const individualDir = join(resultsDir, "individual");
const criteriaPath = fileURLToPath(new URL("../references/criteria.md", import.meta.url));
const criteria = readFileSync(criteriaPath, "utf8").normalize("NFC");

// criteria.md 의 "평가 역량" 표에서 가중치를, "등급" 표에서 등급 기준을 읽는다.
function section(title) {
  const start = criteria.indexOf(`## ${title}`);
  if (start < 0) throw new Error(`criteria.md 에 '## ${title}' 섹션이 없습니다`);
  const rest = criteria.slice(start + 3);
  const end = rest.search(/\n## /);
  return end < 0 ? rest : rest.slice(0, end);
}
const weights = [...section("평가 역량").matchAll(/^\|\s*([^|]+?)\s*\|\s*(\d+)%\s*\|/gm)].map((m) => ({
  name: m[1],
  weight: Number(m[2]),
}));
const grades = [...section("등급").matchAll(/^\|\s*([A-Z])\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/gm)]
  .map((m) => ({ grade: m[1], min: Number(m[2]), verdict: m[3] }))
  .sort((a, b) => b.min - a.min);
const weightSum = weights.reduce((sum, w) => sum + w.weight, 0);
if (weights.length === 0 || grades.length === 0) throw new Error("criteria.md 에서 가중치 또는 등급 표를 읽지 못했습니다");
if (weightSum !== 100) console.error(`경고: 가중치 합이 ${weightSum}% 입니다 (100% 권장)`);
const CAP = grades.find((g) => g.grade === "C") ?? grades[grades.length - 1];

function readResult(file) {
  const text = readFileSync(file, "utf8").normalize("NFC");
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return { file, error: "JSON 블록 없음" };
  try {
    return { file, data: JSON.parse(match[1]) };
  } catch (e) {
    return { file, error: `JSON 파싱 실패: ${e.message}` };
  }
}

const files = existsSync(individualDir)
  ? readdirSync(individualDir).filter((f) => f.endsWith(".md")).map((f) => join(individualDir, f))
  : [];
if (files.length === 0) throw new Error(`${individualDir} 에 결과 파일이 없습니다`);

const rows = [];
const problems = [];
for (const r of files.map(readResult)) {
  if (r.error) {
    problems.push({ file: basename(r.file), error: r.error });
    continue;
  }
  const d = r.data;
  const missing = weights.filter((w) => typeof d.scores?.[w.name] !== "number").map((w) => w.name);
  if (missing.length) {
    problems.push({ file: basename(r.file), error: `점수 누락: ${missing.join(", ")}` });
    continue;
  }
  const avg = weights.reduce((sum, w) => sum + d.scores[w.name] * w.weight, 0) / weightSum;
  const total = Math.round(avg * 20 * 10) / 10;
  let g = grades.find((x) => total >= x.min) ?? grades[grades.length - 1];
  const mustHave = d.must_have ?? {};
  const mustOk = Object.values(mustHave).length > 0 && Object.values(mustHave).every(Boolean);
  let capped = false;
  if (!mustOk && g.min > CAP.min) {
    g = CAP;
    capped = true;
  }
  rows.push({ d, total, grade: g.grade, verdict: g.verdict, mustOk, capped });
}

// 등급 순(A → D), 같은 등급 안에서는 총점 내림차순, 동점이면 가중치가 큰 역량 점수 순
const gradeRank = (g) => grades.findIndex((x) => x.grade === g);
rows.sort((a, b) => {
  if (a.grade !== b.grade) return gradeRank(a.grade) - gradeRank(b.grade);
  if (b.total !== a.total) return b.total - a.total;
  for (const w of [...weights].sort((x, y) => y.weight - x.weight)) {
    const diff = b.d.scores[w.name] - a.d.scores[w.name];
    if (diff) return diff;
  }
  return 0;
});

const stamp = new Date().toLocaleString("sv-SE").slice(0, 16); // 로컬 시각 YYYY-MM-DD HH:MM
const lines = [];
lines.push(`# 서류 1차 검토 결과`, ``, `- 생성: ${stamp}`, `- 기준: references/criteria.md (${weights.map((w) => `${w.name} ${w.weight}%`).join(" · ")})`);
lines.push(`- 총점은 역량 점수의 가중 평균 × 20. 필수 요건을 하나라도 충족하지 못하면 최대 ${CAP.grade}.`, `- 1차 정리다. 최종 판단은 사람이 한다.`, ``);
lines.push(`## 순위`, ``, `| 순위 | 지원자 | 총점 | 등급 | 판정 | 필수 요건 | 이상 징후 |`, `|---|---|---|---|---|---|---|`);
rows.forEach((row, i) => {
  const anomalies = row.d.anomalies?.length ? `⚠ ${row.d.anomalies.length}건` : "-";
  const must = row.mustOk ? "충족" : row.capped ? "미충족 (등급 상한 적용)" : "미충족";
  lines.push(`| ${i + 1} | ${row.d.name} | ${row.total} | ${row.grade} | ${row.verdict} | ${must} | ${anomalies} |`);
});
lines.push(``, `## 종합 의견`, ``, `<!-- 종합 의견 -->`, ``);
for (const row of rows) {
  const d = row.d;
  lines.push(`## ${d.name} · ${row.total}점 · ${row.grade}`, ``, `| 역량 | 점수 | 근거 |`, `|---|---|---|`);
  for (const w of weights) lines.push(`| ${w.name} (${w.weight}%) | ${d.scores[w.name]} | ${d.evidence?.[w.name] ?? ""} |`);
  const list = (title, items) => {
    if (!items?.length) return;
    lines.push(``, `**${title}**`, ...items.map((x) => `- ${x}`));
  };
  list("강점", d.strengths);
  list("우려", d.concerns);
  list("이상 징후", d.anomalies);
  list("면접 확인 질문", d.interview_questions);
  lines.push(``);
}
if (problems.length) {
  lines.push(`## 처리하지 못한 결과`, ``, ...problems.map((p) => `- ${p.file}: ${p.error}`), ``);
}

const outFile = join(resultsDir, "screening-result.md");
writeFileSync(outFile, lines.join("\n"));

const distribution = {};
for (const row of rows) distribution[row.grade] = (distribution[row.grade] ?? 0) + 1;
console.log(
  JSON.stringify(
    {
      output_file: outFile,
      total_applicants: rows.length,
      ranking: rows.map((row, i) => ({
        rank: i + 1,
        name: row.d.name,
        total: row.total,
        grade: row.grade,
        verdict: row.verdict,
        must_have_ok: row.mustOk,
        strengths: row.d.strengths?.slice(0, 2) ?? [],
        concerns: row.d.concerns?.slice(0, 2) ?? [],
        anomalies: row.d.anomalies ?? [],
      })),
      grade_distribution: distribution,
      problems,
    },
    null,
    2,
  ),
);
