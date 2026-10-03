// 지원 서류를 지원자별로 묶는다.
// 파일 이름의 첫 조각(구분자 _ - 공백 앞)을 지원자 이름으로 본다. 예: 김가상_이력서.md, 김가상_포트폴리오.md → 김가상
// 사용: bun group.mjs <이력서 폴더 또는 파일>
import { readdirSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const SUPPORTED = new Set([".md", ".pdf", ".docx", ".doc", ".txt"]);
const input = process.argv[2];
if (!input) {
  console.error("사용법: bun group.mjs <이력서 폴더 또는 파일>");
  process.exit(1);
}
const root = resolve(input);

function listFiles(path) {
  if (statSync(path).isFile()) return [path];
  const out = [];
  for (const entry of readdirSync(path)) {
    if (entry.startsWith(".") || entry === "results" || /^readme\.(md|txt)$/i.test(entry)) continue;
    const full = join(path, entry);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else if (SUPPORTED.has(extname(entry).toLowerCase())) out.push(full);
  }
  return out;
}

function applicantName(file) {
  const stem = basename(file, extname(file)).normalize("NFC");
  const first = stem.split(/[_\-\s]+/).find((part) => part.length > 0);
  return first || stem;
}

const groups = new Map();
for (const file of listFiles(root).sort()) {
  const name = applicantName(file);
  if (!groups.has(name)) groups.set(name, []);
  groups.get(name).push(file);
}

const applicants = [...groups.entries()].map(([name, files]) => ({ name, files }));
console.log(
  JSON.stringify(
    {
      input: root,
      total_files: applicants.reduce((sum, a) => sum + a.files.length, 0),
      total_applicants: applicants.length,
      applicants,
    },
    null,
    2,
  ),
);
