// Merge horror readings, compute wordCount and generate furigana using kuromoji
const fs = require('fs');
const path = require('path');
const kuromoji = require('kuromoji');

const ROOT = path.join(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'data', 'readings.json');
const JS_PATH = path.join(ROOT, 'data', 'readings.js');
const DIC_PATH = path.join(path.dirname(require.resolve('kuromoji')), '..', 'dict');

const currentReadings = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const horrorN4 = JSON.parse(fs.readFileSync(path.join(__dirname, 'new_horror_n4.json'), 'utf8'));
const horrorN3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'new_horror_n3.json'), 'utf8'));
const horrorN2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'new_horror_n2.json'), 'utf8'));

console.log('Current readings:', currentReadings.length);
console.log('Horror N4:', horrorN4.length);
console.log('Horror N3:', horrorN3.length);
console.log('Horror N2:', horrorN2.length);

const allN4 = [...currentReadings.filter(r => r.level === 'N4'), ...horrorN4];
const allN3 = [...currentReadings.filter(r => r.level === 'N3'), ...horrorN3];
const allN2 = [...currentReadings.filter(r => r.level === 'N2'), ...horrorN2];

const combined = [...allN4, ...allN3, ...allN2];
console.log('Total combined readings target:', combined.length);

// 1. Validate IDs and structures
const ids = new Set();
let hasError = false;

combined.forEach((item, index) => {
  if (!item.id) {
    console.error(`Missing id at index ${index}`);
    hasError = true;
  }
  if (ids.has(item.id)) {
    console.error(`Duplicate ID found: ${item.id}`);
    hasError = true;
  }
  ids.add(item.id);

  if (!item.title || !item.titleArti) {
    console.error(`Missing title/titleArti for ${item.id}`);
    hasError = true;
  }
  if (!Array.isArray(item.paragraphs) || item.paragraphs.length === 0) {
    console.error(`Missing paragraphs for ${item.id}`);
    hasError = true;
  }
  if (!Array.isArray(item.translations) || item.translations.length !== item.paragraphs.length) {
    console.error(`Mismatched translations count for ${item.id}`);
    hasError = true;
  }
});

combined.forEach(item => {
  if (item.nextId && !ids.has(item.nextId)) {
    console.error(`Invalid nextId "${item.nextId}" in reading ${item.id}`);
    hasError = true;
  }
  if (item.prevId && !ids.has(item.prevId)) {
    console.error(`Invalid prevId "${item.prevId}" in reading ${item.id}`);
    hasError = true;
  }
});

if (hasError) {
  console.error('Validation failed! Exiting.');
  process.exit(1);
}

// 2. Vocab wordCount computation
const vocab = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'vocabulary.json'), 'utf8'));
const isKanji = (str) => /[\u4e00-\u9faf]/.test(str);
const isKatakana = (str) => /^[\u30a0-\u30ff]+$/.test(str);

const map = new Map();
for (let i = 0; i < vocab.length; i++) {
  const item = vocab[i];
  if (isKanji(item.kanji)) {
    if (!map.has(item.kanji)) map.set(item.kanji, item);
    const k = item.kanji;
    const last = k[k.length - 1];
    const stem = k.slice(0, -1);
    if (last === 'る') {
      const sufs = ['ます', 'ました', 'ません', 'て', 'た', 'ない', 'たい', 'ている', 'ています', 'られる', 'られた'];
      for (let s of sufs) if (!map.has(stem + s)) map.set(stem + s, item);
    } else if (last === 'く') {
      const sufs = ['きます', 'きました', 'いて', 'いた', 'かない', 'ける'];
      for (let s of sufs) if (!map.has(stem + s)) map.set(stem + s, item);
    } else if (last === 'す') {
      const sufs = ['します', 'しました', 'して', 'した', 'さない', 'せる'];
      for (let s of sufs) if (!map.has(stem + s)) map.set(stem + s, item);
    } else if (last === 'つ') {
      const sufs = ['ちます', 'ちました', 'って', 'った', 'たない'];
      for (let s of sufs) if (!map.has(stem + s)) map.set(stem + s, item);
    } else if (last === 'う') {
      const sufs = ['います', 'いました', 'って', 'った', 'わない'];
      for (let s of sufs) if (!map.has(stem + s)) map.set(stem + s, item);
    } else if (last === 'む') {
      const sufs = ['みます', 'みました', 'んで', 'んだ', 'まない'];
      for (let s of sufs) if (!map.has(stem + s)) map.set(stem + s, item);
    } else if (last === 'ぶ') {
      const sufs = ['びます', 'びました', 'んで', 'んだ', 'ばない'];
      for (let s of sufs) if (!map.has(stem + s)) map.set(stem + s, item);
    } else if (last === 'い') {
      const sufs = ['かった', 'くない', 'く'];
      for (let s of sufs) if (!map.has(stem + s)) map.set(stem + s, item);
    }
  } else if (isKatakana(item.kanji) && item.kanji.length >= 2) {
    if (!map.has(item.kanji)) map.set(item.kanji, item);
  } else if (item.kanji.length >= 3) {
    if (!map.has(item.kanji)) map.set(item.kanji, item);
  }
}
const keys = Array.from(map.keys()).sort((a, b) => b.length - a.length);

function countWordsInText(text) {
  let i = 0;
  const uniqueVocab = new Map();
  while (i < text.length) {
    let matched = null;
    for (let k = 0; k < keys.length; k++) {
      if (text.startsWith(keys[k], i)) {
        matched = keys[k];
        break;
      }
    }
    if (matched) {
      const v = map.get(matched);
      uniqueVocab.set(v.id, v);
      i += matched.length;
    } else {
      i++;
    }
  }
  return uniqueVocab.size;
}

for (let r of combined) {
  if (r.wordCount == null) {
    const fullText = (r.paragraphs || []).join('');
    r.wordCount = countWordsInText(fullText);
  }
}

// 3. Kuromoji Furigana generation
const KANJI_RUN = /[\u3005\u3400-\u4dbf\u4e00-\u9fff\u30f6]+|[^\u3005\u3400-\u4dbf\u4e00-\u9fff\u30f6]+/g;
const HAS_KANJI = /[\u3005\u3400-\u4dbf\u4e00-\u9fff]/;
const toHira = (s) => s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function tokenUnits(surface, reading, offset) {
  if (!reading || reading === '*' || !HAS_KANJI.test(surface)) return [];
  const hira = toHira(reading);
  const runs = surface.match(KANJI_RUN);
  if (!runs) return [];
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

console.log('Initializing Kuromoji builder...');
kuromoji.builder({ dicPath: DIC_PATH }).build((err, tokenizer) => {
  if (err) {
    console.error('Kuromoji build error:', err);
    process.exit(1);
  }

  console.log('Generating furigana for all readings where missing...');
  let genCount = 0;
  for (let r of combined) {
    if (!r.furi || !r.titleFuri) {
      r.furi = (r.paragraphs || []).map((p) => encode(tokenizer, p));
      r.titleFuri = encode(tokenizer, r.title || '');
      genCount++;
    }
  }
  console.log(`Furigana generated for ${genCount} readings.`);

  // Write outputs
  fs.writeFileSync(JSON_PATH, JSON.stringify(combined, null, 2), 'utf8');
  fs.writeFileSync(JS_PATH, '// Preloaded readings fallback for file:// protocol\nwindow.READINGS = ' + JSON.stringify(combined, null, 2) + ';\n', 'utf8');

  console.log(`SUCCESS: Total ${combined.length} readings written to readings.json and readings.js!`);
});
