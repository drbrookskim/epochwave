import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const web = p => readFileSync(join(ROOT, 'web', p), 'utf8');

const JS_FILES = ['splash.js', 'timeline.js', 'card.js', 'chat.js'];

const css = web('styles.css');
const js = JS_FILES.map(f => `/* ── ${f} ── */\n${web(f)}`).join('\n');

const eventsJson = readFileSync(join(ROOT, 'content/events.json'), 'utf8');
const eventsData = JSON.parse(eventsJson);

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateNoscript(data) {
  const parts = [];
  parts.push('<noscript>');
  parts.push('<div class="noscript-content" style="padding:24px;max-width:920px;margin:0 auto;color:#e2e8f0;background:#0d0f14;font-family:sans-serif;line-height:1.65;">');
  parts.push('<h1>EpochWave - 대한민국 현대 경제사 & 금융 시장 타임라인</h1>');
  parts.push('<p>1955년부터 현재까지 7대 시대와 48개 주요 역사적 사건, 그리고 코스피·외환·금리 등 금융 시장의 흐름을 조망하는 아카이브입니다. 자바스크립트를 활성화하시면 레트로 퓨처리즘 타임서킷과 대화형 인터랙티브 차트를 이용하실 수 있습니다.</p>');

  if (data && data.eras && Array.isArray(data.eras)) {
    for (const era of data.eras) {
      parts.push(`<section style="margin-top:36px;border-top:1px solid #334155;padding-top:16px;">`);
      parts.push(`<h2>${escapeHtml(era.label)} (${era.startYear} ~ ${era.endYear})</h2>`);
      if (era.summary) parts.push(`<p style="color:#94a3b8;"><em>${escapeHtml(era.summary)}</em></p>`);

      const eraEvents = (data.events || []).filter(e => e.eraId === era.id);
      if (eraEvents.length > 0) {
        for (const ev of eraEvents) {
          parts.push(`<article style="margin:20px 0;padding:16px;background:#151922;border-radius:8px;border-left:4px solid #f59e0b;">`);
          parts.push(`<h3>[${escapeHtml(ev.date || '')}] ${escapeHtml(ev.title || '')}</h3>`);
          if (ev.category || ev.macro) {
            parts.push(`<p style="color:#f59e0b;font-size:0.9em;margin:4px 0 10px;"><strong>유형:</strong> ${escapeHtml(ev.category || '-')} | <strong>거시환경:</strong> ${escapeHtml(ev.macro || '-')}</p>`);
          }
          if (ev.description) {
            parts.push(`<p style="margin-bottom:8px;">${escapeHtml(ev.description)}</p>`);
          }
          if (ev.marketFlow) {
            parts.push(`<p style="color:#cbd5e1;font-size:0.95em;background:#1e293b;padding:10px 12px;border-radius:6px;"><strong>당시 시장 흐름 및 역사적 맥락:</strong><br>${escapeHtml(ev.marketFlow)}</p>`);
          }
          parts.push('</article>');
        }
      }
      parts.push('</section>');
    }
  }

  parts.push('</div>');
  parts.push('</noscript>');
  return parts.join('\n');
}

const noscriptHtml = generateNoscript(eventsData);
const dataScript = `<script id="timeline-data" type="application/json">\n${eventsJson.replace(/<\/script>/gi, '<\\/script>')}\n</script>`;

const html = web('index.html')
  .replace('/*INJECT:CSS*/', () => css)
  .replace('/*INJECT:JS*/', () => js)
  .replace('<body>', () => `<body>\n${noscriptHtml}`)
  .replace('</body>', () => `${dataScript}\n</body>`);

if (html.includes('/*INJECT:')) {
  console.error('✗ 주입 마커가 남아 있습니다 — index.html 의 플레이스홀더를 확인하세요.');
  process.exit(1);
}

mkdirSync(join(ROOT, 'dist'), { recursive: true });
writeFileSync(join(ROOT, 'dist/index.html'), html, 'utf8');
// 저장소 루트의 index.html 은 dist/index.html 의 거울 — 둘이 따로 놀지 않도록 매 빌드마다 같이 갱신한다
writeFileSync(join(ROOT, 'index.html'), html, 'utf8');

writeFileSync(join(ROOT, 'dist/events.json'), eventsJson, 'utf8');
writeFileSync(join(ROOT, 'events.json'), eventsJson, 'utf8');
mkdirSync(join(ROOT, 'dist/content'), { recursive: true });
writeFileSync(join(ROOT, 'dist/content/events.json'), eventsJson, 'utf8');

const kb = n => (n / 1024).toFixed(1) + ' KB';
console.log(`✓ dist/index.html + index.html  ${kb(Buffer.byteLength(html))}  (CSS ${kb(css.length)} · JS ${kb(js.length)} 인라인)`);
console.log(`✓ dist/events.json + events.json 동기화 완료`);
