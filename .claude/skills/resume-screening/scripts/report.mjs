// 집계가 끝난 데이터만 표시한다. 점수·등급·순위는 aggregate.mjs가 계산한다.
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const items = (values) => Array.isArray(values) ? values : [];
const mustNames = { experience: '경력 요건', api_db: 'API·DB 경험', production: '서비스 운영 경험' };
const number = (value) => Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 1 });

export function renderReport({ rows, weights, grades, cap, stamp, summary, problems }) {
  const text = escape;
  const list = (title, values) => `<section class="notes"><h4>${text(title)}</h4>${items(values).length ? `<ul>${items(values).map(v => `<li>${text(v)}</li>`).join('')}</ul>` : '<p class="muted">기록된 내용이 없습니다.</p>'}</section>`;
  const must = r => r.mustOk ? '필수 요건 충족' : r.capped ? '필수 요건 미충족 · 등급 상한 적용' : '필수 요건 미충족';
  const gradeBadge = r => `<span class="grade ${r.mustOk ? 'eligible' : 'limited'}">${text(r.grade)}</span>`;
  const distribution = grades.map(g => ({...g, count: rows.filter(r => r.grade === g.grade).length}));
  const tableRows = rows.map((r, i) => `<tr data-candidate="${i}" data-grade="${text(r.grade)}">
    <td class="rank">${i + 1}</td><th scope="row"><a class="candidate-link" href="#candidate-${i}">${text(r.d.name)}</a><small>${text(r.verdict)}</small></th>
    <td class="score">${text(number(r.total))}<small>/ 100</small></td><td>${gradeBadge(r)}</td>
    <td><span class="${r.mustOk ? 'muted' : 'attention'}">${text(must(r))}</span></td>
    <td>${items(r.d.anomalies).length ? `${items(r.d.anomalies).length}개 메모` : '없음'}</td>
  </tr>`).join('');
  const candidates = rows.map((r, i) => `<details class="candidate" id="candidate-${i}" data-candidate="${i}" data-grade="${text(r.grade)}"${i === 0 ? ' open' : ''}>
    <summary><span class="candidate-heading"><span class="rank">${i + 1}</span><span><strong>${text(r.d.name)}</strong><small>${text(r.verdict)} · ${text(must(r))}</small></span></span><span class="candidate-score"><b>${text(number(r.total))}<small>점</small></b>${gradeBadge(r)}<span class="disclosure" aria-hidden="true">＋</span></span></summary>
    <div class="candidate-body">
      <div class="requirements"><h4>필수 요건</h4><ul>${Object.entries(r.d.must_have ?? {}).map(([key, ok]) => `<li><span>${text(mustNames[key] ?? key)}</span><b class="${ok ? 'muted' : 'attention'}">${ok ? '충족' : '미충족'}</b></li>`).join('') || '<li>판정이 기록되지 않았습니다.</li>'}</ul></div>
      <h4 class="evidence-heading">역량별 점수와 근거</h4>
      <div class="competencies">${weights.map(w => `<section class="competency"><div class="competency-head"><h5>${text(w.name)}<small>가중치 ${w.weight}%</small></h5><b class="mono">${text(r.d.scores[w.name])}<small> / 5</small></b></div><div class="meter" aria-hidden="true"><span style="width:${Math.min(100, Math.max(0, Number(r.d.scores[w.name]) * 20))}%"></span></div><p>${text(r.d.evidence?.[w.name] || '기록된 근거가 없습니다.')}</p></section>`).join('')}</div>
      <div class="notes-grid">${list('강점', r.d.strengths)}${list('우려 · 면접 확인 필요', r.d.concerns)}</div>
      ${list('이상 징후 메모', r.d.anomalies)}${list('면접 확인 질문', r.d.interview_questions)}
      <p class="source">검토 서류: ${items(r.d.files).map(f => text(String(f).split(/[\\/]/).pop())).join(' · ') || '파일 목록이 기록되지 않았습니다.'}</p>
    </div>
  </details>`).join('');
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>서류 1차 검토 결과</title>
<style>
:root{color-scheme:light;--ink:#172B3A;--accent:#006F68;--bg:#EDF2F5;--muted:#536777;--paper:#FFFFFF;--line:#CFDAE1;--wash:#E5F1EF;--warning:#8B4A17;--focus:#006F68;--body:'Apple SD Gothic Neo','Malgun Gothic',system-ui,sans-serif;--data:Menlo,Consolas,monospace}
@media(prefers-color-scheme:dark){:root{color-scheme:dark;--ink:#E8F0F5;--accent:#71D2C4;--bg:#101D27;--muted:#AFBFCC;--paper:#172B3A;--line:#37505F;--wash:#213D41;--warning:#F4BF88;--focus:#71D2C4}}
:root[data-theme="light"]{color-scheme:light;--ink:#172B3A;--accent:#006F68;--bg:#EDF2F5;--muted:#536777;--paper:#FFFFFF;--line:#CFDAE1;--wash:#E5F1EF;--warning:#8B4A17;--focus:#006F68}
:root[data-theme="dark"]{color-scheme:dark;--ink:#E8F0F5;--accent:#71D2C4;--bg:#101D27;--muted:#AFBFCC;--paper:#172B3A;--line:#37505F;--wash:#213D41;--warning:#F4BF88;--focus:#71D2C4}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 var(--body);overflow-wrap:anywhere}main{max-width:1160px;margin:auto;padding:40px 32px 64px}h1,h2,h3,h4,h5,p{margin:0}h1{font-size:clamp(26px,4vw,36px);letter-spacing:-.045em;line-height:1.25;text-wrap:balance}h2{font-size:21px;letter-spacing:-.025em}h4{font-size:16px}h5{font-size:15px}small{font-size:12px;color:var(--muted)}.muted,.source{color:var(--muted)}.mono,.score,.rank,.candidate-score b,.stat strong{font-family:var(--data);font-variant-numeric:tabular-nums}.eyebrow{font-size:12px;font-weight:700;color:var(--accent);letter-spacing:.14em;margin-bottom:8px}.header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:24px;border-bottom:2px solid var(--ink)}.header p{color:var(--muted);margin-top:10px;font-size:13px}.actions{display:flex;gap:8px;flex-wrap:wrap}button,input,select{font:inherit;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:5px;padding:9px 13px}button{cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap}button:hover{border-color:var(--accent);background:var(--wash)}a{color:var(--accent);text-underline-offset:4px}a:hover{text-decoration-thickness:2px}:focus-visible{outline:3px solid var(--focus);outline-offset:4px}.overview{display:grid;grid-template-columns:1.6fr 1fr;gap:28px;margin:28px 0}.opinion{padding:24px;background:var(--paper);border:1px solid var(--line)}.opinion .paragraphs{margin-top:12px;white-space:pre-line;max-width:65ch}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px 0}.stat strong{font-size:29px;display:block;line-height:1.35}.stat span{color:var(--muted);font-size:12px}.distribution{display:flex;gap:7px;flex-wrap:wrap;padding-top:16px;border-top:1px solid var(--line)}.distribution span{display:flex;gap:9px;align-items:center;font-size:13px;padding:5px 10px;background:var(--paper);border:1px solid var(--line)}.section-heading{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:30px 0 12px}.section-heading p{font-size:13px;color:var(--muted)}.filters{display:flex;align-items:end;gap:12px;margin:14px 0}.filters label{display:grid;gap:4px;font-size:12px;color:var(--muted)}.filters input{width:250px;max-width:100%}.filters p{font-size:13px;color:var(--muted);padding-bottom:8px;margin-left:auto}.table-wrap{overflow-x:auto;border:1px solid var(--line);background:var(--paper)}table{border-collapse:collapse;width:100%;min-width:760px;font-size:14px}th,td{text-align:left;padding:14px 16px;border-bottom:1px solid var(--line);vertical-align:middle}thead th{font-size:12px;color:var(--muted);font-weight:500;background:var(--bg)}tbody th{font-weight:600}tbody tr:last-child>*{border-bottom:0}tbody tr:hover{background:var(--wash)}th small,.score small{display:block;margin-top:4px;font-weight:400}.rank{color:var(--muted);font-size:14px}.score{font-size:20px;font-weight:600}.grade{display:inline-flex;justify-content:center;align-items:center;min-width:32px;height:32px;border:1px solid var(--line);font-family:var(--data);font-size:16px;font-weight:700;border-radius:5px}.eligible{background:var(--wash);color:var(--accent)}.limited{color:var(--warning);border-style:dashed}.attention{color:var(--warning);font-weight:600;font-size:13px}.candidate{background:var(--paper);border:1px solid var(--line);margin-bottom:12px;scroll-margin-top:20px}.candidate>summary{list-style:none;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px 24px;cursor:pointer}.candidate>summary::-webkit-details-marker{display:none}.candidate-heading,.candidate-score{display:flex;align-items:center;gap:20px}.candidate-heading strong{display:block;font-size:19px}.candidate-heading small{display:block;margin-top:4px;line-height:1.5}.candidate-score b{font-size:25px;white-space:nowrap}.candidate-score small{font-family:var(--body);font-size:12px;margin-left:4px}.disclosure{font-size:23px;color:var(--accent);min-width:24px;text-align:center}.candidate[open] .disclosure{transform:rotate(45deg)}.candidate-body{padding:0 24px 24px;border-top:1px solid var(--line)}.requirements{display:flex;align-items:center;gap:20px;margin:20px 0 24px}.requirements ul{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0}.requirements li{display:flex;gap:10px;font-size:13px;padding:6px 10px;border:1px solid var(--line)}.evidence-heading{margin-bottom:14px}.competencies{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 28px}.competency-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.competency h5 small{display:block;font-size:11px;font-weight:400;margin-top:3px}.meter{height:5px;background:var(--bg);margin:9px 0 10px;border-radius:2px;overflow:hidden}.meter span{display:block;height:100%;background:var(--accent)}.competency p{font-size:14px;color:var(--muted);max-width:65ch}.notes-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}.notes{margin-top:24px;padding-top:18px;border-top:1px solid var(--line)}.notes ul{margin:10px 0 0;padding-left:20px;display:grid;gap:8px;font-size:14px;max-width:80ch}.notes p{font-size:14px;margin-top:10px}.source{font-size:12px;margin-top:24px;padding-top:14px;border-top:1px solid var(--line)}.empty{padding:20px;background:var(--paper);border:1px solid var(--line)}.problems{padding:20px;border:1px solid var(--warning);background:var(--paper);margin-top:28px}.problems h2{font-size:18px}.problems li{font-size:14px}.criteria{margin-top:32px;padding-top:22px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}.criteria h2{font-size:15px;color:var(--ink);margin-bottom:10px}.criteria p+p{margin-top:6px}footer{color:var(--muted);font-size:12px;margin-top:24px}[hidden]{display:none!important}.no-js{font-size:13px;color:var(--muted);margin:16px 0}
@media(max-width:700px){main{padding:24px 16px 40px}.header{display:grid;gap:16px}.overview{grid-template-columns:1fr;gap:10px;margin:22px 0}.opinion{padding:18px}.stats{padding-top:0}.filters{flex-wrap:wrap;gap:10px}.filters label:first-child{flex:1;min-width:170px}.filters input{width:100%}.filters p{width:100%;padding:0;margin:0}.section-heading{align-items:start}.candidate>summary{padding:16px;gap:10px}.candidate-heading{gap:10px;min-width:0}.candidate-heading strong{font-size:17px}.candidate-score{gap:8px;flex-shrink:0}.candidate-score b{font-size:20px}.candidate-score .grade{min-width:27px;height:27px;font-size:14px}.candidate-body{padding:0 16px 18px}.requirements{display:grid;gap:10px}.competencies,.notes-grid{grid-template-columns:1fr}.notes-grid{gap:0}.section-heading p{max-width:20ch;text-align:right}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
@media print{html:root,html:root[data-theme]{color-scheme:light;--ink:#172B3A;--accent:#006F68;--bg:#FFFFFF;--muted:#536777;--paper:#FFFFFF;--line:#CFDAE1;--wash:#EDF2F5;--warning:#8B4A17}body{font-size:10pt}main{max-width:none;padding:0}h1{font-size:23pt}h2{font-size:15pt}.actions,.filters,.detail-toggle,.disclosure{display:none!important}.overview{gap:20px}.opinion{padding:14px}.stat strong{font-size:22pt}.section-heading{margin-top:22px}table{min-width:0;font-size:9pt}th,td{padding:8px}.candidate{break-before:page;border:0}.candidate>summary{padding:0 0 12px}.candidate-body{padding:0}.competency,.notes,.requirements{break-inside:avoid}.competencies{gap:18px}.competency p,.notes ul{font-size:10pt}a{color:inherit;text-decoration:none}.table-wrap{overflow:visible}.candidate[hidden],tr[hidden]{display:revert!important}.grade{print-color-adjust:exact}.candidate:not([open])>:not(summary){display:block!important}@page{size:A4;margin:15mm}}
</style></head><body><main>
<header class="header"><div><p class="eyebrow">HIRING REVIEW</p><h1>서류 1차 검토 결과</h1><p>지원자 ${rows.length}명 · 생성 ${text(stamp)}</p></div><div class="actions" hidden><button id="theme" type="button">화면 테마 전환</button><button id="print" type="button">인쇄 · PDF 저장</button></div></header>
<div class="overview"><section class="opinion" aria-labelledby="opinion-title"><h2 id="opinion-title">종합 의견</h2><p class="paragraphs${summary ? '' : ' muted'}">${text(summary || '종합 의견 작성 전입니다. 아래 점수와 근거를 먼저 확인하세요.')}</p></section><section aria-label="검토 현황"><div class="stats"><div class="stat"><strong>${rows.length}</strong><span>검토한 지원자</span></div><div class="stat"><strong>${rows.filter(r => r.mustOk).length}</strong><span>필수 요건 충족</span></div><div class="stat"><strong>${rows.filter(r => r.capped).length}</strong><span>등급 상한 적용</span></div></div><div class="distribution" aria-label="등급 분포">${distribution.map(g => `<span><b>${text(g.grade)}</b>${g.count}명</span>`).join('')}</div></section></div>
<section aria-labelledby="ranking-title"><div class="section-heading"><h2 id="ranking-title">면접 검토 순위</h2><p>지원자를 누르면 상세 근거로 이동합니다.</p></div><div class="filters" hidden><label>지원자 검색<input id="search" type="search" placeholder="이름으로 검색" autocomplete="off"></label><label>등급<select id="grade-filter"><option value="">모든 등급</option>${grades.map(g => `<option value="${text(g.grade)}">${text(g.grade)} 등급</option>`).join('')}</select></label><p id="visible-count" role="status" aria-live="polite">${rows.length}명 표시 · 총 ${rows.length}명</p></div>
${rows.length ? `<div class="table-wrap" tabindex="0" role="region" aria-label="지원자 순위 비교 표"><table><thead><tr><th scope="col">순위</th><th scope="col">지원자 · 판정</th><th scope="col">총점</th><th scope="col">등급</th><th scope="col">필수 요건</th><th scope="col">이상 징후</th></tr></thead><tbody>${tableRows}</tbody></table></div><p id="no-match" class="empty" hidden>검색·등급 조건에 맞는 지원자가 없습니다.</p>` : '<p class="empty">집계할 수 있는 지원자가 없습니다. 처리하지 못한 결과를 확인하세요.</p>'}</section>
<section aria-labelledby="details-title"><div class="section-heading"><h2 id="details-title">지원자별 상세 검토</h2><button id="toggle-details" class="detail-toggle" type="button" hidden>모든 상세 펼치기</button></div>${candidates}</section>
${problems.length ? `<section class="problems"><h2>처리하지 못한 결과 · ${problems.length}개</h2><p>아래 파일을 수정한 뒤 다시 집계하세요. 이 파일들은 순위에 포함되지 않았습니다.</p><ul>${problems.map(p => `<li><b>${text(p.file)}</b>: ${text(p.error)}</li>`).join('')}</ul></section>` : ''}
<section class="criteria"><h2>적용한 평가 기준</h2><p>${weights.map(w => `${text(w.name)} ${w.weight}%`).join(' · ')}</p><p>총점 = 역량 점수(1~5)의 가중 평균 × 20. 필수 요건을 하나라도 충족하지 못하면 최대 ${text(cap.grade)} 등급.</p><p>${grades.map(g => `${text(g.grade)}: ${g.min}점 이상 (${text(g.verdict)})`).join(' · ')}</p><p>등급 순으로 정렬한 뒤 총점, 가중치가 높은 역량 점수 순으로 비교합니다. 점수가 높아도 필수 요건에 따라 순위가 낮을 수 있습니다.</p><p>이상 징후 수는 검토자가 남긴 메모 수입니다. 실제 판단은 메모 내용을 확인하세요.</p></section>
<noscript><p class="no-js">검색·테마 전환 없이도 모든 내용을 읽고 지원자별 상세를 펼칠 수 있습니다.</p></noscript><footer>서류에 기반한 1차 정리입니다. 최종 판단은 사람이 합니다.</footer>
</main><script>
(() => {
  const root = document.documentElement;
  const candidates = [...document.querySelectorAll('.candidate')];
  const tableRows = [...document.querySelectorAll('tbody tr')];
  const search = document.querySelector('#search');
  const grade = document.querySelector('#grade-filter');
  const toggle = document.querySelector('#toggle-details');
  document.querySelectorAll('.actions,.filters,.detail-toggle').forEach(e => e.hidden = false);
  function filter() {
    const query = search.value.normalize('NFC').trim().toLocaleLowerCase('ko-KR');
    let count = 0;
    tableRows.forEach(row => {
      const name = row.querySelector('a').textContent.normalize('NFC').toLocaleLowerCase('ko-KR');
      const hidden = !name.includes(query) || (grade.value && row.dataset.grade !== grade.value);
      row.hidden = Boolean(hidden);
      candidates[Number(row.dataset.candidate)].hidden = Boolean(hidden);
      if (!hidden) count++;
    });
    document.querySelector('#visible-count').textContent = count + '명 표시 · 총 ' + tableRows.length + '명';
    const empty = document.querySelector('#no-match');
    if (empty) empty.hidden = count !== 0;
  }
  search.addEventListener('input', filter); grade.addEventListener('change', filter);
  function updateToggle() {
    const visible = candidates.filter(c => !c.hidden);
    toggle.textContent = visible.length && visible.every(c => c.open) ? '모든 상세 접기' : '모든 상세 펼치기';
    toggle.disabled = !visible.length;
  }
  candidates.forEach(c => c.addEventListener('toggle', updateToggle));
  search.addEventListener('input', updateToggle); grade.addEventListener('change', updateToggle);
  toggle.addEventListener('click', () => {
    const visible = candidates.filter(c => !c.hidden);
    const open = !visible.every(c => c.open);
    visible.forEach(c => c.open = open); updateToggle();
  });
  document.querySelectorAll('.candidate-link').forEach(a => a.addEventListener('click', () => {
    const target = document.querySelector(a.getAttribute('href'));
    target.open = true;
    target.querySelector('summary').focus();
  }));
  document.querySelector('#theme').addEventListener('click', () => {
    const dark = getComputedStyle(root).colorScheme === 'dark';
    root.dataset.theme = dark ? 'light' : 'dark';
    document.querySelector('#theme').textContent = dark ? '다크 테마로 전환' : '라이트 테마로 전환';
  });
  const theme = document.querySelector('#theme');
  theme.textContent = getComputedStyle(root).colorScheme === 'dark' ? '라이트 테마로 전환' : '다크 테마로 전환';
  let printState;
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    printState = candidates.map(c => ({open:c.open,hidden:c.hidden}));
    candidates.forEach(c => {c.open=true;c.hidden=false});
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    candidates.forEach((c,i) => {c.open=printState[i].open;c.hidden=printState[i].hidden});
    printState=undefined;updateToggle();
  });
  document.querySelector('#print').addEventListener('click', () => window.print());
  updateToggle();
})();
</script></body></html>`;
}
