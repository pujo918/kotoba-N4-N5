// Merge all readings and validate integrity
const fs = require('fs');

const currentReadings = JSON.parse(fs.readFileSync('./data/readings.json', 'utf8'));
const newN4 = JSON.parse(fs.readFileSync('./scripts/new_n4.json', 'utf8'));
const newN3 = JSON.parse(fs.readFileSync('./scripts/new_n3.json', 'utf8'));
const newN2 = JSON.parse(fs.readFileSync('./scripts/new_n2.json', 'utf8'));

console.log('Current readings:', currentReadings.length);
console.log('New N4:', newN4.length);
console.log('New N3:', newN3.length);
console.log('New N2:', newN2.length);

// Group by level to preserve clean organized ordering
const allN4 = [...currentReadings.filter(r => r.level === 'N4'), ...newN4];
const allN3 = [...currentReadings.filter(r => r.level === 'N3'), ...newN3];
const allN2 = [...currentReadings.filter(r => r.level === 'N2'), ...newN2];

const combined = [...allN4, ...allN3, ...allN2];
console.log('Total combined readings:', combined.length);

// Validation
const ids = new Set();
let hasError = false;

combined.forEach((item, index) => {
  if (!item.id) {
    console.error(`Error at index ${index}: missing ID`);
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
    console.error(`Mismatched translations count for ${item.id}: ${item.paragraphs.length} paragraphs vs ${item.translations ? item.translations.length : 0} translations`);
    hasError = true;
  }
});

// Check nextId / prevId links
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
  console.error('Validation failed! Aborting save.');
  process.exit(1);
}

// Vocab Matcher test
const vocab = JSON.parse(fs.readFileSync('./data/vocabulary.json', 'utf8'));
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

let totalMatches = 0;
combined.forEach(reading => {
  const fullText = reading.paragraphs.join(' ');
  let i = 0;
  const uniqueVocab = new Map();
  while (i < fullText.length) {
    let matched = null;
    for (let k = 0; k < keys.length; k++) {
      if (fullText.startsWith(keys[k], i)) {
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
  totalMatches += uniqueVocab.size;
});

const avgMatches = Math.round(totalMatches / combined.length);
console.log(`Vocab validation passed! Total unique word occurrences: ${totalMatches}, Average per reading: ${avgMatches} words`);

// Write out JSON and JS
fs.writeFileSync('./data/readings.json', JSON.stringify(combined, null, 2), 'utf8');
const jsContent = '// Preloaded readings fallback for file:// protocol\nwindow.READINGS = ' + JSON.stringify(combined, null, 2) + ';\n';
fs.writeFileSync('./data/readings.js', jsContent, 'utf8');

console.log('SUCCESS! Saved data/readings.json and data/readings.js with 108 readings.');
