// Generate furigana (ruby) data for ALL kanji in readings, not only words in the vocab list.
// Usage (once):  npm install kuromoji@0.1.2   then:  node scripts/generate_furigana.js
// Adds per reading:
//   furi:      array (one string per paragraph) -> "start,end,reading;start,end,reading;..."
//   titleFuri: same format for the title
const fs = require('fs');
const path = require('path');
const kuromoji = require('kuromoji');

const ROOT = path.join(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'data', 'readings.json');
const JS_PATH = path.join(ROOT, 'data', 'readings.js');
const DIC_PATH = path.join(path.dirname(require.resolve('kuromoji')), '..', 'dict');

const KANJI_RUN = /[\u3005\u3400-\u4dbf\u4e00-\u9fff\u30f6]+|[^\u3005\u3400-\u4dbf\u4e00-\u9fff\u30f6]+/g;
const HAS_KANJI = /[\u3005\u3400-\u4dbf\u4e00-\u9fff]/;
const toHira = (s) => s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Split a token into ruby units so okurigana stays outside the ruby (食べる -> 食[た]べる)
function tokenUnits(surface, reading, offset) {
  if (!reading || reading === '*' || !HAS_KANJI.test(surface)) return [];
  const hira = toHira(reading);
  const runs = surface.match(KANJI_RUN);
  const pattern = runs.map((r) => (HAS_KANJI.test(r) ? '(.+?)' : escRe(toHira(r)))).join('');
  const m = new RegExp('^' + pattern + '$').exec(hira);
  if (!m) return [[offset, offset + surface.length, hira]];
  const out = [];
  let pos = offset;
  let g = 1;
  for (const r of runs) {
    if (HAS_KANJI.test(r)) out.push([pos, pos + r.length, m[g++]]);
    pos += r.length;
  }
  return out;
}

function encode(tokenizer, text) {
  const units = [];
  let pos = 0;
  for (const t of tokenizer.tokenize(text)) {
    const start = text.indexOf(t.surface_form, pos);
    if (start < 0) continue;
    units.push(...tokenUnits(t.surface_form, t.reading, start));
    pos = start + t.surface_form.length;
  }
  return units.map((u) => u.join(',')).join(';');
}

kuromoji.builder({ dicPath: DIC_PATH }).build((err, tokenizer) => {
  if (err) throw err;
  const readings = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  let unitCount = 0;
  for (const r of readings) {
    r.furi = (r.paragraphs || []).map((p) => encode(tokenizer, p));
    r.titleFuri = encode(tokenizer, r.title || '');
    unitCount += r.furi.reduce((n, s) => n + (s ? s.split(';').length : 0), 0);
  }
  fs.writeFileSync(JSON_PATH, JSON.stringify(readings, null, 2), 'utf8');
  fs.writeFileSync(JS_PATH, '// Preloaded readings fallback for file:// protocol\nwindow.READINGS = ' + JSON.stringify(readings, null, 2) + ';\n', 'utf8');
  console.log(`Done: ${readings.length} readings, ${unitCount} furigana units.`);
});
