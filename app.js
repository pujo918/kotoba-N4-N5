/* ============================================================
   Kotoba — PWA Hafal Kosakata JLPT N4, N3 & N2
   Active Recall + Spaced Repetition (Leitner). No backend.
   ============================================================ */
'use strict';

/* ---------- Storage keys & helpers ---------- */
const K = {
  settings: 'kotoba.settings',
  progress: 'kotoba.progress',
  streak: 'kotoba.streak',
  wrongSolved: 'kotoba.wrongSolved',
  customReadings: 'kotoba.customReadings',
  readCompleted: 'kotoba.readCompleted',
};
const load = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch { return def; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const now = () => Date.now();
const DAY = 86400000;

/* ---------- Global state ---------- */
const State = {
  vocab: [],
  readings: [],
  settings: load(K.settings, { furigana: true, theme: 'dark' }),
  progress: load(K.progress, {}),   // id -> {correct,wrong,last,box,due,seen}
  streak: load(K.streak, { current: 0, last: null, best: 0 }),
  route: 'home',
  wrongSolved: load(K.wrongSolved, {}),
  customReadings: load(K.customReadings, []),
  readCompleted: load(K.readCompleted, {}),
  materiTab: 'vocab',               // 'vocab' | 'reading'
  activeReading: null,
};
let listObserver = null;

function isReadingCompleted(id) {
  return !!(State.readCompleted && State.readCompleted[id]);
}

function toggleReadingCompleted(id) {
  if (!State.readCompleted) State.readCompleted = {};
  const isDone = !State.readCompleted[id];
  if (isDone) {
    State.readCompleted[id] = Date.now();
  } else {
    delete State.readCompleted[id];
  }
  save(K.readCompleted, State.readCompleted);
  return isDone;
}

function effectiveWrong(id) {
  const s = State.progress[id];
  if (!s) return 0;
  const solved = State.wrongSolved[id] || 0;
  return Math.max(0, (s.wrong || 0) - solved);
}

/* Leitner intervals (days) per box level 0..6 */
const BOX_DAYS = [0, 1, 2, 4, 8, 16, 30];
const MAX_BOX = BOX_DAYS.length - 1;
const MASTER_BOX = 5; // box >= 5 dianggap dikuasai

/* ---------- Progress utils ---------- */
function stat(id) {
  let s = State.progress[id];
  if (!s) { s = { correct: 0, wrong: 0, last: null, box: 0, due: 0, seen: false, lastIncorrect: false }; State.progress[id] = s; }
  return s;
}
function isLearned(id) { const s = State.progress[id]; return !!(s && (s.seen || s.correct + s.wrong > 0)); }
function isMastered(id) { const s = State.progress[id]; return !!(s && s.box >= MASTER_BOX); }
function masteryPct(id) { const s = State.progress[id]; return s ? Math.min(100, Math.round(s.box / MAX_BOX * 100)) : 0; }

function getMasteryStats(level = 'all') {
  const pool = State.vocab.filter(v => level === 'all' || v.level === level);
  let dikuasai = 0;
  let hampir = 0;
  let setengah = 0;
  let seperempat = 0;
  let belum = 0;

  for (let i = 0; i < pool.length; i++) {
    const v = pool[i];
    const s = State.progress[v.id];
    const box = s ? s.box || 0 : 0;
    const learned = s && (s.seen || s.correct + s.wrong > 0);

    if (box >= 5) {
      dikuasai++;
    } else if (box === 4) {
      hampir++;
    } else if (box === 3) {
      setengah++;
    } else if (box >= 1 && box <= 2) {
      seperempat++;
    } else {
      belum++;
    }
  }

  return { dikuasai, hampir, setengah, seperempat, belum };
}

function review(id, quality) {
  const s = stat(id);
  s.seen = true;
  if (quality === 'hard' || quality === false) {
    s.wrong++;
    s.box = Math.max(0, s.box - 1);
    s.lastIncorrect = true;
  } else if (quality === 'medium') {
    s.correct++;
    s.box = Math.min(MAX_BOX, s.box + 1);
    s.lastIncorrect = false;
  } else { // easy or true
    s.correct++;
    s.box = Math.min(MAX_BOX, s.box + 2);
    s.lastIncorrect = false;
  }
  s.last = new Date().toISOString();
  s.due = now() + BOX_DAYS[s.box] * DAY;
  save(K.progress, State.progress);
  bumpStreak();
}

/* ---------- Streak ---------- */
function bumpStreak() {
  const t = todayStr();
  const st = State.streak;
  if (st.last === t) { return; }
  const y = new Date(Date.now() - DAY);
  const yStr = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
  if (st.last === yStr) st.current += 1; else st.current = 1;
  st.last = t;
  if (st.current > (st.best || 0)) st.best = st.current;
  save(K.streak, st);
}
function currentStreak() {
  const st = State.streak;
  if (!st.last) return 0;
  const t = todayStr();
  const y = new Date(Date.now() - DAY);
  const yStr = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
  if (st.last === t || st.last === yStr) return st.current;
  return 0; // streak putus
}

/* ---------- Spaced-repetition study queue ---------- */
/* Cards that are due, never seen, or low box appear first; more wrong = higher priority */
function studyQueue(level) {
  let pool = State.vocab.slice();
  if (level && level !== 'all') pool = pool.filter(v => v.level === level);
  const t = now();
  return pool.map(v => {
    const s = State.progress[v.id];
    let prio;
    if (!s || !s.seen) {
      prio = 10000; // Unseen cards: Tier 4 (highest priority)
    } else if (s.lastIncorrect) {
      // Last answer was incorrect: Tier 3 (priority 8000+). More wrongs = higher priority.
      prio = 8000 + (s.wrong || 0) * 10;
    } else {
      // (t - s.due) / DAY gives how many days overdue the card is (positive if due, negative if not due yet)
      const daysOverdue = Math.min(100, (t - s.due) / DAY);
      if (s.due <= t) {
        // Due cards: Tier 2 (priority 5000+)
        prio = 5000 + daysOverdue - s.box * 10;
      } else {
        // Not due cards: Tier 1 (priority < 0)
        prio = daysOverdue - s.box * 10;
      }
    }
    return { v, prio, r: Math.random() };
  }).sort((a, b) => (b.prio - a.prio) || (a.r - b.r)).map(x => x.v);
}

/* ---------- Furigana / Theme ---------- */
function applySettings() {
  document.body.classList.toggle('furi-on', State.settings.furigana);
  document.body.classList.toggle('furi-off', !State.settings.furigana);
  document.documentElement.setAttribute('data-theme', State.settings.theme);
  const ft = document.getElementById('furiToggle');
  if (ft) ft.textContent = State.settings.furigana ? '📖 Furigana ON' : '📖 Furigana OFF';
  const tt = document.getElementById('themeToggle');
  if (tt) tt.textContent = State.settings.theme === 'dark' ? '🌙' : '☀️';
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.setAttribute('content', State.settings.theme === 'dark' ? '#0f1115' : '#6c5ce7');
}
function toggleFurigana() { State.settings.furigana = !State.settings.furigana; save(K.settings, State.settings); applySettings(); toast(State.settings.furigana ? 'Furigana ditampilkan' : 'Furigana disembunyikan'); }
function toggleTheme() { State.settings.theme = State.settings.theme === 'dark' ? 'light' : 'dark'; save(K.settings, State.settings); applySettings(); }

/* ---------- Helpers ---------- */
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* ruby element: kanji with furigana that follows global toggle */
function ruby(v) { return `<ruby>${esc(v.kanji)}<rt>${esc(v.furigana)}</rt></ruby>`; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function sample(arr, n, exclude) { const pool = arr.filter(x => x !== exclude); return shuffle(pool).slice(0, n); }

function speakJapanese(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.88;
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.error(e);
  }
}

let vocabMatcher = null;
function buildVocabMatcher() {
  if (vocabMatcher) return vocabMatcher;
  const isKanji = (str) => /[\u4e00-\u9faf]/.test(str);
  const isKatakana = (str) => /^[\u30a0-\u30ff]+$/.test(str);

  const map = new Map();
  for (let i = 0; i < State.vocab.length; i++) {
    const item = State.vocab[i];
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
  vocabMatcher = { map, keys };
  return vocabMatcher;
}

function countWordsInText(text) {
  const { map, keys } = buildVocabMatcher();
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
      if (!uniqueVocab.has(v.id)) {
        uniqueVocab.set(v.id, v);
      }
      i += matched.length;
    } else {
      i += 1;
    }
  }
  const words = Array.from(uniqueVocab.values());
  return {
    count: words.length,
    words: words
  };
}

/* ---------- Furigana for ALL kanji ----------
   Built-in readings carry precomputed data (scripts/generate_furigana.js):
   "start,end,reading;start,end,reading;..." per paragraph.
   Custom texts are analysed on demand with kuromoji (loaded from CDN once). */
function decodeFuri(str) {
  if (!str) return [];
  return str.split(';').map(u => {
    const parts = u.split(',');
    return [Number(parts[0]), Number(parts[1]), parts.slice(2).join(',')];
  });
}

function matchVocabAt(text, i) {
  const { map, keys } = buildVocabMatcher();
  for (let k = 0; k < keys.length; k++) {
    if (text.startsWith(keys[k], i)) return { key: keys[k], v: map.get(keys[k]) };
  }
  return null;
}

function renderParagraphWithHighlights(paragraph, furiStr, highlight = true) {
  // Fallback (no analysis available yet): only vocab-list words get furigana
  if (furiStr == null) return renderParagraphVocabOnly(paragraph);

  const units = decodeFuri(furiStr);
  const unitAt = new Map();
  const covered = new Uint8Array(paragraph.length + 1);
  for (const u of units) {
    unitAt.set(u[0], u);
    for (let k = u[0] + 1; k < u[1]; k++) covered[k] = 1;
  }

  let out = '';
  let i = 0;
  let spanEnd = -1;
  while (i < paragraph.length) {
    if (highlight && spanEnd < 0 && !covered[i]) {
      const m = matchVocabAt(paragraph, i);
      if (m) {
        out += `<span class="dokkai-word" data-vid="${m.v.id}" title="${esc(m.v.kanji)}: ${esc(m.v.arti)}">`;
        spanEnd = i + m.key.length;
      }
    }
    const u = unitAt.get(i);
    if (u) {
      out += `<ruby>${esc(paragraph.slice(u[0], u[1]))}<rt>${esc(u[2])}</rt></ruby>`;
      i = u[1];
    } else {
      out += esc(paragraph[i]);
      i += 1;
    }
    if (spanEnd >= 0 && i >= spanEnd) {
      out += '</span>';
      spanEnd = -1;
    }
  }
  if (spanEnd >= 0) out += '</span>';
  return out;
}

function renderParagraphVocabOnly(paragraph) {
  let i = 0;
  let out = '';
  while (i < paragraph.length) {
    const m = matchVocabAt(paragraph, i);
    if (m) {
      const v = m.v;
      const inner = (m.key === v.kanji && v.kanji !== v.furigana)
        ? `<ruby>${esc(m.key)}<rt>${esc(v.furigana)}</rt></ruby>`
        : esc(m.key);
      out += `<span class="dokkai-word" data-vid="${v.id}" title="${esc(v.kanji)}: ${esc(v.arti)}">${inner}</span>`;
      i += m.key.length;
    } else {
      out += esc(paragraph[i]);
      i += 1;
    }
  }
  return out;
}

/* Runtime analyser (same algorithm as scripts/generate_furigana.js) */
const KUROMOJI_CDN = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js';
const KUROMOJI_DICT = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/';
let kuromojiTokenizerPromise = null;

function getKuromojiTokenizer() {
  if (kuromojiTokenizerPromise) return kuromojiTokenizerPromise;
  kuromojiTokenizerPromise = new Promise((resolve, reject) => {
    const build = () => window.kuromoji.builder({ dicPath: KUROMOJI_DICT })
      .build((err, tk) => err ? reject(err) : resolve(tk));
    if (window.kuromoji) return build();
    const s = document.createElement('script');
    s.src = KUROMOJI_CDN;
    s.onload = build;
    s.onerror = () => reject(new Error('Gagal memuat kuromoji'));
    document.head.appendChild(s);
  }).catch(e => { kuromojiTokenizerPromise = null; throw e; });
  return kuromojiTokenizerPromise;
}

const FURI_KANJI_RUN = /[\u3005\u3400-\u4dbf\u4e00-\u9fff\u30f6]+|[^\u3005\u3400-\u4dbf\u4e00-\u9fff\u30f6]+/g;
const FURI_HAS_KANJI = /[\u3005\u3400-\u4dbf\u4e00-\u9fff]/;
const toHiragana = (s) => s.replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));

function furiTokenUnits(surface, reading, offset) {
  if (!reading || reading === '*' || !FURI_HAS_KANJI.test(surface)) return [];
  const hira = toHiragana(reading);
  const runs = surface.match(FURI_KANJI_RUN);
  const pattern = runs.map(r => FURI_HAS_KANJI.test(r) ? '(.+?)' : toHiragana(r).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
  const m = new RegExp('^' + pattern + '$').exec(hira);
  if (!m) return [[offset, offset + surface.length, hira]];
  const out = [];
  let pos = offset, g = 1;
  for (const r of runs) {
    if (FURI_HAS_KANJI.test(r)) out.push([pos, pos + r.length, m[g++]]);
    pos += r.length;
  }
  return out;
}

function encodeFurigana(tokenizer, text) {
  const units = [];
  let pos = 0;
  for (const t of tokenizer.tokenize(text)) {
    const start = text.indexOf(t.surface_form, pos);
    if (start < 0) continue;
    units.push(...furiTokenUnits(t.surface_form, t.reading, start));
    pos = start + t.surface_form.length;
  }
  return units.map(u => u.join(',')).join(';');
}

async function ensureFuriganaFor(item) {
  if (Array.isArray(item.furi)) return false;
  const tk = await getKuromojiTokenizer();
  item.furi = (item.paragraphs || []).map(p => encodeFurigana(tk, p));
  item.titleFuri = encodeFurigana(tk, item.title || '');
  if (item.isCustom) {
    const idx = (State.customReadings || []).findIndex(x => x.id === item.id);
    if (idx >= 0) {
      State.customReadings[idx] = item;
      save(K.customReadings, State.customReadings);
    }
  }
  return true;
}

function openKotobaModal(vocabId) {
  const v = State.vocab.find(x => x.id === Number(vocabId));
  if (!v) return;

  const s = State.progress[v.id];
  const box = s ? s.box || 0 : 0;
  let statusHTML = '';
  if (box >= MASTER_BOX) {
    statusHTML = `<span class="kb-status-chip" style="color:var(--green)"><span class="ico">🏆</span> Dikuasai (Box ${box})</span>`;
  } else if (isLearned(v.id)) {
    statusHTML = `<span class="kb-status-chip" style="color:var(--orange)"><span class="ico">📖</span> Sedang Dipelajari (Box ${box})</span>`;
  } else {
    statusHTML = `<span class="kb-status-chip" style="color:var(--text-dim)"><span class="ico">✨</span> Belum Dipelajari</span>`;
  }

  const modalBackdrop = document.getElementById('kotobaModalBackdrop');
  const modalContent = document.getElementById('kotobaModalContent');
  if (!modalBackdrop || !modalContent) return;

  modalContent.innerHTML = `
    <div class="kb-header">
      <div class="kb-kanji-wrap">
        <span class="kb-furigana">${esc(v.furigana)}</span>
        <div class="kb-kanji">${esc(v.kanji)}</div>
      </div>
      <div class="kb-actions">
        <button class="kb-icon-btn" id="kbSpeakBtn" title="Dengarkan pengucapan">🔊</button>
        <button class="kb-icon-btn" id="kbCloseBtn" title="Tutup">✕</button>
      </div>
    </div>
    <div class="kb-meaning">${esc(v.arti)}</div>
    <div class="kb-footer">
      <span class="kb-level-badge lv ${v.level}">${v.level}</span>
      ${statusHTML}
    </div>
  `;

  modalContent.querySelector('#kbSpeakBtn').onclick = () => speakJapanese(v.kanji);
  modalContent.querySelector('#kbCloseBtn').onclick = closeKotobaModal;

  modalBackdrop.classList.add('show');
}

function closeKotobaModal() {
  const modalBackdrop = document.getElementById('kotobaModalBackdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('show');
}

let toastTimer;
function toast(msg) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1800); }

function toggleBottomNav(show) {
  const nav = document.querySelector('.bottom-nav');
  if (nav) {
    if (show) {
      nav.style.transform = 'translateX(-50%)';
      nav.style.pointerEvents = '';
    } else {
      nav.style.transform = 'translateX(-50%) translateY(120px)';
      nav.style.pointerEvents = 'none';
    }
  }
}

/* ---------- Router ---------- */
const Views = {};
function navigate(route) {
  if (listObserver) {
    listObserver.disconnect();
    listObserver = null;
  }
  document.body.classList.remove('hide-nav');
  toggleBottomNav(true);
  State.route = route;
  let activeNav = route;
  if (route === 'statsDetail' || route === 'statsDetailQuiz') {
    activeNav = 'stats';
  } else if (route === 'reading' || route === 'readingDetail') {
    activeNav = 'list';
  }
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.nav === activeNav));
  const app = document.getElementById('app');
  app.innerHTML = '';
  const v = Views[route] || Views.home;
  v(app);
  window.scrollTo(0, 0);
}

/* ============================================================
   VIEW: BERANDA (Home)
   ============================================================ */
Views.home = (app) => {
  const total = State.vocab.length;
  const n4 = State.vocab.filter(v => v.level === 'N4').length;
  const n3 = State.vocab.filter(v => v.level === 'N3').length;
  const n2 = State.vocab.filter(v => v.level === 'N2').length;
  const learned = State.vocab.filter(v => isLearned(v.id)).length;
  const mastered = State.vocab.filter(v => isMastered(v.id)).length;
  const pct = total ? Math.round(learned / total * 100) : 0;
  const streak = currentStreak();

  app.innerHTML = `
    <div class="view">
      <h1 class="page-title">こんにちは, ${esc(greet())} 👋<span class="sub">Ayo lanjutkan menghafal kosakata hari ini</span></h1>

      <section>
        <div class="streak">
          <div class="flame">🔥</div>
          <div>
            <div class="big">${streak} Hari</div>
            <div class="cap">Streak Belajar</div>
          </div>
          <div class="right">Rekor terbaik<br><b style="font-size:18px">${State.streak.best || 0} hari</b></div>
        </div>
      </section>

      <section>
        <div class="grid stat-grid-levels">
          <div class="stat clickable" data-stat="N4"><span class="ico">🔵</span><div class="val">${n4}</div><div class="lbl">Kosakata N4</div></div>
          <div class="stat clickable" data-stat="N3"><span class="ico">🟢</span><div class="val">${n3}</div><div class="lbl">Kosakata N3</div></div>
          <div class="stat clickable" data-stat="N2"><span class="ico">🟠</span><div class="val">${n2}</div><div class="lbl">Kosakata N2</div></div>
        </div>
        <div class="grid stat-grid-summary" style="margin-top:12px">
          <div class="stat clickable" data-stat="learned"><span class="ico">📖</span><div class="val">${learned}</div><div class="lbl">Sudah dipelajari</div></div>
          <div class="stat clickable" data-stat="mastered"><span class="ico">🏆</span><div class="val">${mastered}</div><div class="lbl">Sudah dikuasai</div></div>
        </div>
      </section>

      <section>
        <div class="card progress-card">
          <div class="ring" style="--p:${pct}"><span>${pct}%</span></div>
          <div class="info">
            <h3>Progress Belajar</h3>
            <p>${learned} dari ${total} kosakata sudah kamu pelajari.</p>
            <p style="margin-top:4px">🏆 ${mastered} kosakata sudah dikuasai (${total ? Math.round(mastered / total * 100) : 0}%).</p>
          </div>
        </div>
      </section>

      <section style="margin-top:14px">
        <div class="card reading-banner-card" id="homeReadingBanner" style="cursor:pointer; display:flex; align-items:center; justify-content:space-between; padding:18px 20px; background:linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.1)); border:1px solid rgba(99,102,241,0.25);">
          <div style="display:flex; align-items:center; gap:14px;">
            <span style="font-size:30px;">📖</span>
            <div>
              <div style="font-weight:700; font-size:16px; color:var(--text);">Sistem Bacaan (読解)</div>
              <div style="font-size:13px; color:var(--text-soft); margin-top:2px;">Baca artikel kontekstual dengan deteksi kotoba otomatis</div>
            </div>
          </div>
          <span style="font-size:18px; color:var(--primary); font-weight:700; margin-left:8px;">→</span>
        </div>
      </section>

    </div>`;

  const banner = app.querySelector('#homeReadingBanner');
  if (banner) {
    banner.onclick = () => {
      State.materiTab = 'reading';
      navigate('list');
    };
  }

  app.querySelectorAll('[data-stat]').forEach(b => b.onclick = () => {
    const s = b.dataset.stat;
    if (s === 'N4' || s === 'N3' || s === 'N2') {
      ListState.level = s;
      ListState.filter = 'all';
    } else if (s === 'learned') {
      ListState.level = 'all';
      ListState.filter = 'learned';
    } else if (s === 'mastered') {
      ListState.level = 'all';
      ListState.filter = 'mastered';
    }
    ListState.q = '';
    ListState.limit = 60;
    navigate('list');
  });
};
function greet() { const h = new Date().getHours(); if (h < 11) return 'Selamat pagi'; if (h < 15) return 'Selamat siang'; if (h < 19) return 'Selamat sore'; return 'Selamat malam'; }

/* ============================================================
   VIEW: DAFTAR KOSAKATA (List)
   ============================================================ */
const ListState = { q: '', level: 'all', filter: 'all', limit: 60 };

Views.list = (app) => {
  if (State.materiTab === 'reading') {
    Views.reading(app);
    return;
  }
  const stats = getMasteryStats(ListState.level);
  let triggerText = `Dikuasai : ${stats.dikuasai}`;
  if (ListState.filter === 'hampir') triggerText = `Hampir : ${stats.hampir}`;
  else if (ListState.filter === 'setengah') triggerText = `Setengah : ${stats.setengah}`;
  else if (ListState.filter === 'seperempat') triggerText = `Seperempat : ${stats.seperempat}`;
  else if (ListState.filter === 'belum') triggerText = `Belum : ${stats.belum}`;

  app.innerHTML = `
    <div class="view">
      <div class="materi-tabs">
        <button class="materi-tab active" data-mtab="vocab"><span class="tab-ico">📚</span> Daftar Kosakata</button>
        <button class="materi-tab" data-mtab="reading"><span class="tab-ico">📖</span> Sistem Bacaan (読解)</button>
      </div>

      <h1 class="page-title">Daftar Kosakata<span class="sub">${State.vocab.length} kata · JLPT N4, N3 &amp; N2</span></h1>

      <div class="toolbar">
        <div class="search">
          <span class="si">🔍</span>
          <input id="q" type="text" placeholder="Cari kanji, furigana, atau arti..." value="${esc(ListState.q)}" />
        </div>
        <div class="toolbar-controls">
          <div class="segmented" id="lvFilter">
            <button data-lv="all" class="${ListState.level === 'all' ? 'active' : ''}">Semua</button>
            <button data-lv="N4" class="${ListState.level === 'N4' ? 'active' : ''}">N4</button>
            <button data-lv="N3" class="${ListState.level === 'N3' ? 'active' : ''}">N3</button>
            <button data-lv="N2" class="${ListState.level === 'N2' ? 'active' : ''}">N2</button>
          </div>

          <!-- DROPDOWN COUNTER TEPAT DI SAMPING SEMUA/N4/N3 -->
          <div class="counter-dropdown" id="counterDropdown">
            <button class="counter-dropdown-trigger" id="cdTrigger" type="button" title="Pilih status hafalan">
              <span>${triggerText}</span>
              <svg class="cdd-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div class="counter-dropdown-menu" id="cdMenu">
              <div class="cdd-item ${ListState.filter === 'all' ? 'active' : ''}" data-filter="all">
                <span class="cdd-lbl">Semua Status</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.dikuasai + stats.hampir + stats.setengah + stats.seperempat + stats.belum}</span>
              </div>
              <div class="cdd-divider"></div>
              <div class="cdd-item ${ListState.filter === 'dikuasai' ? 'active' : ''}" data-filter="dikuasai">
                <span class="cdd-lbl">Dikuasai</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.dikuasai}</span>
              </div>
              <div class="cdd-item ${ListState.filter === 'hampir' ? 'active' : ''}" data-filter="hampir">
                <span class="cdd-lbl">Hampir</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.hampir}</span>
              </div>
              <div class="cdd-item ${ListState.filter === 'setengah' ? 'active' : ''}" data-filter="setengah">
                <span class="cdd-lbl">Setengah</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.setengah}</span>
              </div>
              <div class="cdd-item ${ListState.filter === 'seperempat' ? 'active' : ''}" data-filter="seperempat">
                <span class="cdd-lbl">Seperempat</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.seperempat}</span>
              </div>
              <div class="cdd-item ${ListState.filter === 'belum' ? 'active' : ''}" data-filter="belum">
                <span class="cdd-lbl">Belum</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.belum}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="count-note" id="countNote"></p>
      <div class="vocab-grid" id="vgrid"></div>
      <div id="more" style="text-align:center;margin-top:18px"></div>
    </div>`;

  app.querySelectorAll('[data-mtab]').forEach(b => b.onclick = () => {
    State.materiTab = b.dataset.mtab;
    if (State.materiTab === 'reading') {
      Views.reading(app);
    } else {
      Views.list(app);
    }
  });

  const q = app.querySelector('#q');
  q.oninput = () => { ListState.q = q.value; ListState.limit = 60; renderList(); };

  app.querySelectorAll('#lvFilter button').forEach(b => b.onclick = () => {
    ListState.level = b.dataset.lv;
    ListState.limit = 60;
    navigate('list');
  });

  const dd = app.querySelector('#counterDropdown');
  const trigger = app.querySelector('#cdTrigger');
  if (trigger && dd) {
    trigger.onclick = (e) => {
      e.stopPropagation();
      dd.classList.toggle('open');
    };
    app.querySelectorAll('.cdd-item').forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        ListState.filter = item.dataset.filter;
        ListState.limit = 60;
        dd.classList.remove('open');
        navigate('list');
      };
    });
  }

  const closeMenu = (e) => {
    if (dd && !dd.contains(e.target)) {
      dd.classList.remove('open');
    }
  };
  document.addEventListener('click', closeMenu);

  renderList();
};

function filteredVocab() {
  const q = ListState.q.trim().toLowerCase();
  const res = State.vocab.filter(v => {
    if (ListState.level !== 'all' && v.level !== ListState.level) return false;
    const s = State.progress[v.id];
    const box = s ? s.box || 0 : 0;
    const learned = s && (s.seen || s.correct + s.wrong > 0);

    if (ListState.filter === 'dikuasai' && box < 5) return false;
    if (ListState.filter === 'hampir' && box !== 4) return false;
    if (ListState.filter === 'setengah' && box !== 3) return false;
    if (ListState.filter === 'seperempat' && (box < 1 || box > 2)) return false;
    if (ListState.filter === 'belum' && (learned && box > 0)) return false;

    if (!q) return true;
    return v.kanji.toLowerCase().includes(q) || v.furigana.toLowerCase().includes(q) || v.arti.toLowerCase().includes(q);
  });
  return res.sort((a, b) => {
    const masteryA = masteryPct(a.id);
    const masteryB = masteryPct(b.id);
    return masteryB - masteryA;
  });
}
function renderList() {
  const target = document.getElementById('vgrid');
  const res = filteredVocab();
  const note = document.getElementById('countNote');
  if (note) {
    let filterName = '';
    if (ListState.filter === 'dikuasai') filterName = ' · Filter: Dikuasai';
    else if (ListState.filter === 'hampir') filterName = ' · Filter: Hampir';
    else if (ListState.filter === 'setengah') filterName = ' · Filter: Setengah';
    else if (ListState.filter === 'seperempat') filterName = ' · Filter: Seperempat';
    else if (ListState.filter === 'belum') filterName = ' · Filter: Belum';
    note.textContent = `${res.length} kosakata ditemukan${filterName}`;
  }
  const slice = res.slice(0, ListState.limit);
  target.innerHTML = slice.length
    ? slice.map(cardHTML).join('')
    : `<div class="empty" style="grid-column:1/-1"><div class="big">🔍</div>Tidak ada kosakata yang cocok.</div>`;
  const more = document.getElementById('more');
  if (!more) return;

  if (listObserver) {
    listObserver.disconnect();
    listObserver = null;
  }

  if (res.length > ListState.limit) {
    more.innerHTML = `<div style="padding:20px 0;color:var(--text-dim);font-size:13.5px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px">
      <span class="spinner"></span>
      Memuat lebih banyak...
    </div>`;
    listObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        ListState.limit += 60;
        renderList();
      }
    }, { rootMargin: '200px' });
    listObserver.observe(more);
  } else {
    more.innerHTML = res.length > 0 ? `<div style="padding:20px 0;color:var(--text-dim);font-size:13.5px;font-weight:600">✨ Semua kosakata telah ditampilkan</div>` : '';
  }
}
function cardHTML(v) {
  const m = masteryPct(v.id);
  return `<div class="vocab-card">
    <span class="lv ${v.level}">${v.level}</span>
    <div class="kanji">${esc(v.kanji)}</div>
    <div class="furi">${esc(v.furigana)}</div>
    <div class="arti">${esc(v.arti)}</div>
    ${m > 0 ? `<div class="mastery"><i style="width:${m}%"></i></div>` : ''}
  </div>`;
}

/* ============================================================
   VIEW: SISTEM BACAAN (Dokkai / Reading)
   ============================================================ */
const ReadingState = {
  level: 'all', // 'all', 'N4', 'N3', 'N2', 'custom'
  searchQuery: '',
  expandedSeries: {}, // seriesKey -> boolean
};

Views.reading = (app) => {
  State.materiTab = 'reading';
  const customList = State.customReadings || [];
  const allReadings = [...State.readings, ...customList];

  let pool = allReadings;
  if (ReadingState.level === 'custom') {
    pool = customList;
  } else if (ReadingState.level !== 'all') {
    pool = allReadings.filter(r => r.level === ReadingState.level);
  }

  // Filter by search query if any
  const q = (ReadingState.searchQuery || '').trim().toLowerCase();
  let filteredPool = pool;
  if (q) {
    filteredPool = pool.filter(r => {
      const matchTitle = (r.title || '').toLowerCase().includes(q);
      const matchArti = (r.titleArti || '').toLowerCase().includes(q);
      const matchSeries = (r.series || '').toLowerCase().includes(q);
      return matchTitle || matchArti || matchSeries;
    });
  }

  // Group readings by series / bab utama
  const seriesMap = new Map();
  filteredPool.forEach(r => {
    const sName = r.series || (r.isCustom ? 'Teks Mandiri Saya' : 'Bacaan Tambahan');
    const sKey = (r.level || 'all') + '::' + sName;
    if (!seriesMap.has(sKey)) {
      seriesMap.set(sKey, {
        key: sKey,
        name: sName,
        level: r.level || 'N4',
        items: [],
        isCustom: !!r.isCustom
      });
    }
    seriesMap.get(sKey).items.push(r);
  });

  // Sort items in each series by seriesPart ascending (Bab 1, Bab 2, etc.)
  for (const s of seriesMap.values()) {
    s.items.sort((a, b) => {
      const pA = a.seriesPart != null ? Number(a.seriesPart) : 999;
      const pB = b.seriesPart != null ? Number(b.seriesPart) : 999;
      if (pA !== pB) return pA - pB;
      return (a.id || '').localeCompare(b.id || '');
    });
  }

  const seriesList = Array.from(seriesMap.values());
  const totalChapters = filteredPool.length;
  const totalCompleted = filteredPool.filter(r => isReadingCompleted(r.id)).length;

  app.innerHTML = `
    <div class="view">
      <div class="materi-tabs">
        <button class="materi-tab" data-mtab="vocab"><span class="tab-ico">📚</span> Daftar Kosakata</button>
        <button class="materi-tab active" data-mtab="reading"><span class="tab-ico">📖</span> Sistem Bacaan (読解)</button>
      </div>

      <h1 class="page-title">Sistem Bacaan (読解)<span class="sub">Latih pemahaman kotoba dalam konteks cerita bersambung &amp; artikel</span></h1>

      <div class="toolbar" style="margin-bottom:12px;">
        <div class="segmented" id="readingLvFilter">
          <button data-rlv="all" class="${ReadingState.level === 'all' ? 'active' : ''}">Semua</button>
          <button data-rlv="N4" class="${ReadingState.level === 'N4' ? 'active' : ''}">N4</button>
          <button data-rlv="N3" class="${ReadingState.level === 'N3' ? 'active' : ''}">N3</button>
          <button data-rlv="N2" class="${ReadingState.level === 'N2' ? 'active' : ''}">N2</button>
          <button data-rlv="custom" class="${ReadingState.level === 'custom' ? 'active' : ''}">➕ Teks Mandiri</button>
        </div>
      </div>

      <!-- Controls & Search Bar -->
      <div class="reading-controls-bar">
        <div class="reading-search-box">
          <span class="reading-search-ico">🔍</span>
          <input type="text" id="readingSearchInput" placeholder="Cari judul cerita, topik, atau kata..." value="${esc(ReadingState.searchQuery || '')}" />
          ${ReadingState.searchQuery ? '<button type="button" class="reading-search-clear" id="readingSearchClear">✕</button>' : ''}
        </div>
        <div class="reading-overview-row">
          <div class="reading-overview-stat">
            <span>📖 <strong>${seriesList.length}</strong> Seri (${totalChapters} Bab)</span>
            <span class="overview-sep">•</span>
            <span style="color:var(--green-text,#34d399);">✅ <strong id="globalDoneCount">${totalCompleted}</strong> dipelajari</span>
          </div>
          <div class="reading-expand-btns">
            <button type="button" class="reading-ctrl-btn" id="expandAllSeriesBtn">Buka Semua</button>
            <button type="button" class="reading-ctrl-btn" id="collapseAllSeriesBtn">Tutup Semua</button>
          </div>
        </div>
      </div>

      ${ReadingState.level === 'custom' ? `
        <div class="custom-reading-box">
          <div style="font-weight:700; font-size:16px; color:var(--text); display:flex; align-items:center; gap:8px;">
            <span>✍️</span> Tempel / Masukkan Teks Jepang Sendiri
          </div>
          <p style="font-size:13.5px; color:var(--text-soft); margin:0;">
            Salin artikel berita (seperti NHK Easy), dialog anime, atau bacaan apa saja. Sistem akan mendeteksi kosakata yang cocok dengan database Kotoba dan mengelompokkannya sesuai level pilihanmu.
          </p>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <label style="font-size:13px; font-weight:600; color:var(--text-soft);">Tentukan Level Target Teks Ini:</label>
            <div class="segmented" id="customLevelSelect" style="max-width:320px;">
              <button type="button" data-clv="N4" class="clv-btn">N4</button>
              <button type="button" data-clv="N3" class="clv-btn active">N3</button>
              <button type="button" data-clv="N2" class="clv-btn">N2</button>
              <button type="button" data-clv="Mandiri" class="clv-btn">Umum</button>
            </div>
          </div>
          <input type="text" class="input-title" id="customTitle" placeholder="Judul Teks (opsional, contoh: Berita NHK Hari Ini)" />
          <textarea id="customContent" placeholder="Tempel teks bahasa Jepang di sini..."></textarea>
          <button class="submit-btn" id="customSubmitBtn">
            <span>🚀</span> Analisis &amp; Mulai Membaca
          </button>
        </div>
      ` : ''}

      <div class="reading-series-container" id="readingSeriesContainer">
        ${seriesList.length > 0 ? seriesList.map(s => renderSeriesCard(s, !!q)).join('') : (
          ReadingState.level === 'custom'
            ? '<div style="margin-top:20px; color:var(--text-dim); text-align:center; font-size:14px; padding:30px 10px;">Belum ada teks mandiri yang disimpan. Masukkan teks di atas untuk mulai membaca!</div>'
            : '<div class="empty"><div class="big">📖</div>Tidak ada bacaan yang cocok dengan filter atau pencarian.</div>'
        )}
      </div>
    </div>
  `;

  // Attach tabs
  app.querySelectorAll('[data-mtab]').forEach(b => b.onclick = () => {
    State.materiTab = b.dataset.mtab;
    if (State.materiTab === 'vocab') {
      Views.list(app);
    } else {
      Views.reading(app);
    }
  });

  // Attach level filters
  app.querySelectorAll('#readingLvFilter button').forEach(b => b.onclick = () => {
    ReadingState.level = b.dataset.rlv;
    Views.reading(app);
  });

  // Level selector for custom reading
  let chosenLevel = 'N3';
  app.querySelectorAll('.clv-btn').forEach(btn => {
    btn.onclick = () => {
      app.querySelectorAll('.clv-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chosenLevel = btn.dataset.clv;
    };
  });

  // Custom text submit
  const submitBtn = app.querySelector('#customSubmitBtn');
  if (submitBtn) {
    submitBtn.onclick = () => {
      const content = (app.querySelector('#customContent').value || '').trim();
      if (!content) {
        toast('Silakan masukkan teks Jepang terlebih dahulu');
        return;
      }
      let title = (app.querySelector('#customTitle').value || '').trim();
      if (!title) title = 'Teks Mandiri #' + (customList.length + 1);

      const paragraphs = content.split(/\n+/).map(p => p.trim()).filter(Boolean);
      const customItem = {
        id: 'c-' + Date.now(),
        level: chosenLevel,
        title: title,
        titleArti: 'Teks Mandiri Pengguna (' + chosenLevel + ')',
        paragraphs: paragraphs,
        translations: [],
        isCustom: true
      };

      State.customReadings = [customItem, ...State.customReadings];
      save(K.customReadings, State.customReadings);
      toast(`Teks berhasil disimpan sebagai level ${chosenLevel}!`);
      openReadingDetail(customItem);
    };
  }

  // Search input with debounce
  const searchInp = app.querySelector('#readingSearchInput');
  if (searchInp) {
    let timer = null;
    searchInp.oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ReadingState.searchQuery = searchInp.value;
        Views.reading(app);
        const refocused = app.querySelector('#readingSearchInput');
        if (refocused) {
          refocused.focus();
          refocused.setSelectionRange(refocused.value.length, refocused.value.length);
        }
      }, 250);
    };
  }

  const searchClear = app.querySelector('#readingSearchClear');
  if (searchClear) {
    searchClear.onclick = () => {
      ReadingState.searchQuery = '';
      Views.reading(app);
    };
  }

  // Expand / Collapse all
  const expAllBtn = app.querySelector('#expandAllSeriesBtn');
  if (expAllBtn) {
    expAllBtn.onclick = () => {
      seriesList.forEach(s => ReadingState.expandedSeries[s.key] = true);
      app.querySelectorAll('.reading-series-card').forEach(card => {
        card.classList.add('expanded');
        card.classList.remove('collapsed');
        const ch = card.querySelector('.series-chevron');
        if (ch) ch.classList.add('open');
        const b = card.querySelector('.reading-series-body');
        if (b) b.style.display = '';
      });
    };
  }

  const colAllBtn = app.querySelector('#collapseAllSeriesBtn');
  if (colAllBtn) {
    colAllBtn.onclick = () => {
      seriesList.forEach(s => ReadingState.expandedSeries[s.key] = false);
      app.querySelectorAll('.reading-series-card').forEach(card => {
        card.classList.remove('expanded');
        card.classList.add('collapsed');
        const ch = card.querySelector('.series-chevron');
        if (ch) ch.classList.remove('open');
        const b = card.querySelector('.reading-series-body');
        if (b) b.style.display = 'none';
      });
    };
  }

  // Toggle series accordion collapse/expand
  app.querySelectorAll('.reading-series-header').forEach(hdr => {
    hdr.onclick = () => {
      const skey = hdr.dataset.toggleSeries;
      const card = hdr.closest('.reading-series-card');
      const body = card.querySelector('.reading-series-body');
      const chevron = hdr.querySelector('.series-chevron');

      const isNowExpanded = !card.classList.contains('expanded');
      ReadingState.expandedSeries[skey] = isNowExpanded;

      card.classList.toggle('expanded', isNowExpanded);
      card.classList.toggle('collapsed', !isNowExpanded);
      if (chevron) chevron.classList.toggle('open', isNowExpanded);
      if (body) body.style.display = isNowExpanded ? '' : 'none';
    };
  });

  // Status check circle button click (toggle complete)
  app.querySelectorAll('.subbab-check-circle').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation(); // Don't navigate to reading detail
      const rid = btn.dataset.circleRid;
      const isDone = toggleReadingCompleted(rid);

      btn.classList.toggle('completed', isDone);
      btn.innerHTML = isDone ? '✓' : '';
      btn.title = isDone ? 'Tandai belum dipelajari' : 'Tandai sudah dipelajari';

      const row = btn.closest('.subbab-item');
      if (row) row.classList.toggle('is-completed', isDone);

      // Update series header progress count
      const card = btn.closest('.reading-series-card');
      if (card) {
        const skey = card.dataset.skey;
        const s = seriesMap.get(skey);
        if (s) {
          const completedInSeries = s.items.filter(x => isReadingCompleted(x.id)).length;
          const numEl = card.querySelector('.progress-num');
          if (numEl) numEl.textContent = `${completedInSeries}/${s.items.length} dipelajari`;
        }
      }

      // Update global count
      const doneTotal = filteredPool.filter(x => isReadingCompleted(x.id)).length;
      const globDone = app.querySelector('#globalDoneCount');
      if (globDone) globDone.textContent = doneTotal;

      toast(isDone ? 'Bab ditandai selesai dipelajari! ✓' : 'Status bab diubah ke belum selesai');
    };
  });

  // Delete custom reading
  app.querySelectorAll('.custom-del-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const delId = btn.dataset.delid;
      if (confirm('Hapus teks mandiri ini dari daftar simpanan?')) {
        State.customReadings = (State.customReadings || []).filter(x => x.id !== delId);
        save(K.customReadings, State.customReadings);
        toast('Teks mandiri berhasil dihapus');
        Views.reading(app);
      }
    };
  });

  // Sub-bab row click -> open reading detail
  app.querySelectorAll('.subbab-item').forEach(row => {
    row.onclick = (e) => {
      if (e.target.closest('.subbab-check-circle') || e.target.closest('.custom-del-btn')) return;
      const rid = row.dataset.rid;
      const r = allReadings.find(x => x.id === rid);
      if (r) {
        // Keep this series open when navigating back
        const sName = r.series || (r.isCustom ? 'Teks Mandiri Saya' : 'Bacaan Tambahan');
        const sKey = (r.level || 'all') + '::' + sName;
        ReadingState.expandedSeries[sKey] = true;
        openReadingDetail(r);
      }
    };
  });
};

function renderSeriesCard(s, isSearching) {
  // If user searched, auto-expand; otherwise check state (default to true if undefined)
  const isExpanded = isSearching
    ? true
    : (ReadingState.expandedSeries[s.key] !== false);

  const completedCount = s.items.filter(item => isReadingCompleted(item.id)).length;
  const totalCount = s.items.length;
  const levelBadgeClass = s.level === 'Mandiri' ? 'N4' : s.level;

  return `
    <div class="reading-series-card ${isExpanded ? 'expanded' : 'collapsed'}" data-skey="${esc(s.key)}">
      <div class="reading-series-header" data-toggle-series="${esc(s.key)}">
        <div class="series-header-left">
          <span class="series-chevron ${isExpanded ? 'open' : ''}">▼</span>
          <div class="series-title-wrap">
            <span class="series-name">${esc(s.name)}</span>
            <span class="lv ${levelBadgeClass}">${esc(s.level)}</span>
          </div>
        </div>
        <div class="series-header-right">
          <span class="series-progress-badge">
            <span class="progress-dot"></span>
            <span class="progress-num">${completedCount}/${totalCount} dipelajari</span>
          </span>
        </div>
      </div>

      <div class="reading-series-body" style="${isExpanded ? '' : 'display:none;'}">
        <div class="subbab-list">
          ${s.items.map(r => renderSubbabItem(r)).join('')}
        </div>
      </div>
    </div>
  `;
}

const wordCountCache = new Map();
function getReadingWordCount(r) {
  if (r.wordCount != null) return r.wordCount;
  if (r._wordCount != null) return r._wordCount;
  if (wordCountCache.has(r.id)) return wordCountCache.get(r.id);
  const fullText = (r.paragraphs || []).join('');
  const c = countWordsInText(fullText).count;
  wordCountCache.set(r.id, c);
  r._wordCount = c;
  return c;
}

function renderSubbabItem(r) {
  const isDone = isReadingCompleted(r.id);
  const count = getReadingWordCount(r);
  const babNum = r.seriesPart ? `Bab ${r.seriesPart}` : '';

  return `
    <div class="subbab-item ${isDone ? 'is-completed' : ''}" data-rid="${esc(r.id)}">
      <div class="subbab-info">
        <div class="subbab-title">
          ${babNum ? `<span class="subbab-badge">${babNum}</span>` : ''}
          <span class="subbab-jp-text">${esc(r.title)}</span>
        </div>
        ${r.titleArti ? `<div class="subbab-subtitle" title="${esc(r.titleArti)}">${esc(r.titleArti)}</div>` : ''}
      </div>

      <div class="subbab-actions">
        <span class="subbab-pill" title="Kosakata terdeteksi dalam bacaan">
          ${count} Kotoba
        </span>
        <button type="button" class="subbab-check-circle ${isDone ? 'completed' : ''}" data-circle-rid="${esc(r.id)}" title="${isDone ? 'Tandai belum dipelajari' : 'Tandai sudah dipelajari'}">
          ${isDone ? '✓' : ''}
        </button>
        ${r.isCustom ? `
          <button type="button" class="custom-del-btn" data-delid="${esc(r.id)}" title="Hapus teks ini">🗑️</button>
        ` : ''}
      </div>
    </div>
  `;
}

function openReadingDetail(readingItem) {
  State.activeReading = readingItem;
  navigate('readingDetail');
}

Views.readingDetail = (app) => {
  const r = State.activeReading;
  if (!r) {
    Views.reading(app);
    return;
  }

  // Ensure furigana exists for custom reading or any uncomputed reading
  if (!Array.isArray(r.furi)) {
    ensureFuriganaFor(r).then(changed => {
      if (changed && State.activeReading && State.activeReading.id === r.id) {
        Views.readingDetail(app);
      }
    }).catch(err => console.warn('Kuromoji furigana fallback error:', err));
  }

  const allReadings = [...State.readings, ...(State.customReadings || [])];
  const prevChapter = r.prevId ? allReadings.find(x => x.id === r.prevId) : null;
  const nextChapter = r.nextId ? allReadings.find(x => x.id === r.nextId) : null;

  if (!r._detectedWords) {
    const fullText = (r.paragraphs || []).join('');
    r._detectedWords = countWordsInText(fullText);
  }
  const detected = r._detectedWords;
  const levelBadgeClass = r.level === 'Mandiri' ? 'N4' : r.level;
  const hasTranslations = Array.isArray(r.translations) && r.translations.length > 0;
  const isDone = isReadingCompleted(r.id);

  app.innerHTML = `
    <div class="view reader-wrap">
      <button class="reader-back" id="readerBackBtn">
        ← Kembali ke Daftar Seri Bacaan
      </button>

      <div class="reader-title-box">
        ${r.series ? `
          <div class="reading-card-series" style="font-size:13px; margin-bottom:6px;">
            <span>📖</span> Seri: ${esc(r.series)}${r.seriesPart ? ` (Bab ${r.seriesPart})` : ''}
          </div>
        ` : ''}
        <div class="reader-title">${renderParagraphWithHighlights(r.title, r.titleFuri, false)}</div>
        ${r.titleArti ? `<div class="reader-subtitle">${esc(r.titleArti)}</div>` : ''}
        <div class="reader-badge-row">
          <span class="lv ${levelBadgeClass}">${esc(r.level)}</span>
          <span class="reading-card-chip">✨ ${detected.count} Kotoba Cocok di Database</span>
          <button type="button" class="reader-complete-toggle-btn ${isDone ? 'completed' : ''}" id="detailCompleteToggleBtn">
            <span>${isDone ? '✓ Sudah Dipelajari' : '◯ Tandai Selesai'}</span>
          </button>
        </div>
      </div>

      <div class="reader-article">
        ${r.paragraphs.map((p, idx) => `<p class="reader-paragraph">${renderParagraphWithHighlights(p, r.furi ? r.furi[idx] : null, true)}</p>`).join('')}
      </div>

      ${hasTranslations ? `
        <button class="reader-trans-toggle" id="transToggleBtn">
          <span>👁️</span> Tampilkan Terjemahan Bahasa Indonesia
        </button>
        <div class="reader-trans-box" id="transBox">
          <div style="font-weight:700; font-size:15px; margin-bottom:12px; color:var(--text);">🇮🇩 Terjemahan Cerita / Artikel:</div>
          ${r.translations.map(t => `<p class="reader-trans-p">${esc(t)}</p>`).join('')}
        </div>
      ` : ''}

      <div class="reader-finish-banner">
        <div class="finish-info">
          <div class="finish-title">🎉 Selesai Membaca Bab Ini?</div>
          <div class="finish-desc">Tandai progresmu agar tercatat rapi di daftar seri dan bab materi.</div>
        </div>
        <button type="button" class="finish-action-btn ${isDone ? 'completed' : ''}" id="readerFinishBtn">
          ${isDone ? '✓ Bab Selesai Dipelajari' : 'Tandai Selesai Dibaca ✓'}
        </button>
      </div>

      ${(prevChapter || nextChapter) ? `
        <div class="reader-nav-row">
          ${prevChapter ? `
            <button class="reader-nav-btn" id="prevChapterBtn">
              <span>←</span> Bab Sebelumnya
            </button>
          ` : '<div></div>'}
          ${nextChapter ? `
            <button class="reader-nav-btn" id="nextChapterBtn" style="background:var(--primary); color:#ffffff; border-color:var(--primary);">
              Bab Berikutnya: ${esc(nextChapter.title.slice(0, 15))}... <span>→</span>
            </button>
          ` : ''}
        </div>
      ` : ''}

      ${detected.words.length > 0 ? `
        <div class="reader-vocab-summary">
          <h3>
            <span>📚</span> Kosakata dalam Bacaan Ini (${detected.words.length})
          </h3>
          <div class="reader-vocab-grid">
            ${detected.words.map(w => `
              <div class="reader-mini-chip" data-vid="${w.id}">
                <div class="top">
                  <span class="kj">${esc(w.kanji)}</span>
                  <span class="lv ${w.level}" style="font-size:10px; padding:1px 6px;">${w.level}</span>
                </div>
                <div class="ar">${esc(w.arti)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Back button
  app.querySelector('#readerBackBtn').onclick = () => {
    Views.reading(app);
  };

  // Completion toggle buttons
  const detailToggleBtn = app.querySelector('#detailCompleteToggleBtn');
  const finishBtn = app.querySelector('#readerFinishBtn');
  const updateDetailCompleteUI = (done) => {
    if (detailToggleBtn) {
      detailToggleBtn.classList.toggle('completed', done);
      detailToggleBtn.innerHTML = `<span>${done ? '✓ Sudah Dipelajari' : '◯ Tandai Selesai'}</span>`;
    }
    if (finishBtn) {
      finishBtn.classList.toggle('completed', done);
      finishBtn.innerHTML = done ? '✓ Bab Selesai Dipelajari' : 'Tandai Selesai Dibaca ✓';
    }
  };

  const handleToggle = () => {
    const done = toggleReadingCompleted(r.id);
    updateDetailCompleteUI(done);
    toast(done ? 'Bab ditandai selesai dipelajari! ✓' : 'Status bab diubah ke belum selesai');
  };

  if (detailToggleBtn) detailToggleBtn.onclick = handleToggle;
  if (finishBtn) finishBtn.onclick = handleToggle;

  // Chapter navigation buttons
  const prevBtn = app.querySelector('#prevChapterBtn');
  if (prevBtn && prevChapter) {
    prevBtn.onclick = () => openReadingDetail(prevChapter);
  }
  const nextBtn = app.querySelector('#nextChapterBtn');
  if (nextBtn && nextChapter) {
    nextBtn.onclick = () => openReadingDetail(nextChapter);
  }

  // Translation toggle
  const transBtn = app.querySelector('#transToggleBtn');
  const transBox = app.querySelector('#transBox');
  if (transBtn && transBox) {
    let showTrans = false;
    transBtn.onclick = () => {
      showTrans = !showTrans;
      transBox.classList.toggle('show', showTrans);
      transBtn.innerHTML = showTrans
        ? '<span>🙈</span> Sembunyikan Terjemahan Bahasa Indonesia'
        : '<span>👁️</span> Tampilkan Terjemahan Bahasa Indonesia';
    };
  }

  // Click on any dokkai-word
  app.querySelectorAll('.dokkai-word').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      openKotobaModal(el.dataset.vid);
    };
  });

  // Click on mini chip
  app.querySelectorAll('.reader-mini-chip').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      openKotobaModal(el.dataset.vid);
    };
  });
};

/* ============================================================
   VIEW: FLASHCARD
   ============================================================ */
const FC = { queue: [], idx: 0, flipped: false, level: 'all', done: 0 };
Views.flashcard = (app) => {
  if (!FC.queue.length || FC.idx >= FC.queue.length) { startFlashcards(FC.level); }
  renderFlashcard(app);
};
function startFlashcards(level) { FC.level = level; FC.queue = studyQueue(level).slice(0, 30); FC.idx = 0; FC.flipped = false; FC.done = 0; }
function renderFlashcard(app) {
  if (!FC.queue.length) { app.innerHTML = emptyState('Belum ada kartu.'); return; }
  if (FC.idx >= FC.queue.length) { renderFlashDone(app); return; }
  const v = FC.queue[FC.idx];
  app.innerHTML = `
    <div class="view fc-wrap">
      <h1 class="page-title">Flashcard<span class="sub">Active recall · ketuk kartu untuk membalik</span></h1>
      <div class="toolbar" style="justify-content:center">
        <div class="segmented" id="fcLv">
          <button data-lv="all" class="${FC.level === 'all' ? 'active' : ''}">Semua</button>
          <button data-lv="N4" class="${FC.level === 'N4' ? 'active' : ''}">N4</button>
          <button data-lv="N3" class="${FC.level === 'N3' ? 'active' : ''}">N3</button>
          <button data-lv="N2" class="${FC.level === 'N2' ? 'active' : ''}">N2</button>
        </div>
      </div>
      <div class="fc-top"><span>Kartu ${FC.idx + 1} / ${FC.queue.length}</span><span>${v.level}</span></div>
      <div class="flashcard ${FC.flipped ? 'flipped' : ''}" id="card">
        <div class="inner">
          <div class="face front">
            <span class="lv ${v.level}">${v.level}</span>
            <div class="kanji">${esc(v.kanji)}</div>
            <div class="furi">${esc(v.furigana)}</div>
            <div class="hint">Ketuk untuk lihat arti</div>
          </div>
          <div class="face back">
            <div class="arti">${esc(v.arti)}</div>
            <div class="sub">${esc(v.kanji)} · ${esc(v.furigana)}</div>
            <div class="hint" style="color:rgba(255,255,255,.7)">Seberapa baik kamu mengingatnya?</div>
          </div>
        </div>
      </div>
      <div class="fc-buttons ${FC.flipped ? '' : 'locked'}" id="fcBtns">
        <button class="fc-btn hard" data-q="hard"><span class="e">😵</span>Sulit</button>
        <button class="fc-btn med" data-q="medium"><span class="e">🤔</span>Lumayan</button>
        <button class="fc-btn easy" data-q="easy"><span class="e">😎</span>Mudah</button>
      </div>
    </div>`;
  const card = app.querySelector('#card');
  card.onclick = () => { FC.flipped = !FC.flipped; card.classList.toggle('flipped', FC.flipped); app.querySelector('#fcBtns').classList.toggle('locked', !FC.flipped); };
  app.querySelectorAll('#fcLv button').forEach(b => b.onclick = (e) => { e.stopPropagation(); startFlashcards(b.dataset.lv); renderFlashcard(app); });

  app.querySelectorAll('#fcBtns .fc-btn').forEach(b => b.onclick = () => {
    if (!FC.flipped) return;
    review(v.id, b.dataset.q);
    FC.done++;
    FC.idx++; FC.flipped = false;
    renderFlashcard(app);
  });
};
function renderFlashDone(app) {
  app.innerHTML = `
    <div class="view fc-wrap">
      <div class="result">
        <div class="big">���</div>
        <h2>Sesi selesai!</h2>
        <p>Kamu mereview <b>${FC.done}</b> kartu. Mantap, terus pertahankan!</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn" id="again">Sesi baru</button>
          <button class="btn ghost" id="home">Beranda</button>
        </div>
      </div>
    </div>`;
  app.querySelector('#again').onclick = () => { startFlashcards(FC.level); renderFlashcard(app); };
  app.querySelector('#home').onclick = () => navigate('home');
}

/* ============================================================
   VIEW: QUIZ
   ============================================================ */
const QZ = { mode: null, level: 'all', limit: 10, queue: [], idx: 0, correct: 0, wrong: 0, answered: false, q: null };
const MODES = {
  1: { name: 'Kanji → Arti', icon: '🇯🇵', desc: 'Tebak arti dari kanji' },
  2: { name: 'Kanji → Furigana', icon: '🔤', desc: 'Tebak cara baca kanji' },
  3: { name: 'Arti → Kanji', icon: '🔄', desc: 'Tebak kanji dari arti' },
  4: { name: 'Random Campuran', icon: '🎲', desc: 'Campuran semua tipe' },
};
Views.quiz = (app) => {
  if (!QZ.mode) { renderQuizMenu(app); return; }
  if (QZ.idx >= QZ.queue.length) { renderQuizResult(app); return; }
  renderQuizQuestion(app);
};
function renderQuizMenu(app) {
  document.body.classList.remove('hide-nav');
  toggleBottomNav(true);
  app.innerHTML = `
    <div class="view quiz-wrap">
      <h1 class="page-title">Quiz<span class="sub">Uji ingatanmu · Pilih level dan jumlah soal</span></h1>
      
      <div class="quiz-setup card">
        <div class="setup-group">
          <label class="section-label">Materi Quiz</label>
          <div class="segmented full" id="qzLv">
            <button data-lv="all" class="${QZ.level === 'all' ? 'active' : ''}">Semua</button>
            <button data-lv="N4" class="${QZ.level === 'N4' ? 'active' : ''}">N4</button>
            <button data-lv="N3" class="${QZ.level === 'N3' ? 'active' : ''}">N3</button>
            <button data-lv="N2" class="${QZ.level === 'N2' ? 'active' : ''}">N2</button>
          </div>
        </div>
        <div class="setup-group" style="margin-top:14px">
          <label class="section-label">Jumlah Soal</label>
          <div class="segmented full" id="qzLimit">
            <button data-lim="5" class="${QZ.limit === 5 ? 'active' : ''}">5</button>
            <button data-lim="10" class="${QZ.limit === 10 ? 'active' : ''}">10</button>
            <button data-lim="20" class="${QZ.limit === 20 ? 'active' : ''}">20</button>
            <button data-lim="30" class="${QZ.limit === 30 ? 'active' : ''}">30</button>
          </div>
        </div>
      </div>

      <p class="section-label">Pilih Mode Quiz</p>
      <div class="grid mode-grid">
        ${Object.entries(MODES).map(([k, m]) => `
          <button class="mode-card" data-mode="${k}">
            <span class="ico">${m.icon}</span>
            <h3>Mode ${k}</h3>
            <p>${m.name}</p>
            <p style="margin-top:6px;color:var(--text-dim)">${m.desc}</p>
          </button>`).join('')}
      </div>
    </div>`;

  app.querySelectorAll('#qzLv button').forEach(b => {
    b.onclick = () => {
      QZ.level = b.dataset.lv;
      app.querySelectorAll('#qzLv button').forEach(btn => btn.classList.toggle('active', btn.dataset.lv === QZ.level));
    };
  });

  app.querySelectorAll('#qzLimit button').forEach(b => {
    b.onclick = () => {
      QZ.limit = +b.dataset.lim;
      app.querySelectorAll('#qzLimit button').forEach(btn => btn.classList.toggle('active', +btn.dataset.lim === QZ.limit));
    };
  });


  app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => startQuiz(+b.dataset.mode, app));
}
function startQuiz(mode, app) {
  QZ.mode = mode; QZ.idx = 0; QZ.correct = 0; QZ.wrong = 0; QZ.answered = false;
  QZ.queue = studyQueue(QZ.level).slice(0, QZ.limit);
  if (QZ.queue.length < 4) { toast('Kosakata belum cukup untuk quiz.'); QZ.mode = null; return; }
  buildQuestion();
  renderQuizQuestion(app);
}

/* ---------- Quiz Distractors Generators ---------- */
const DAKUTEN_MAP = {
  'か': ['が'], 'き': ['ぎ'], 'く': ['ぐ'], 'け': ['げ'], 'こ': ['ご'],
  'さ': ['ざ'], 'し': ['じ'], 'す': ['ず'], 'せ': ['ぜ'], 'そ': ['ぞ'],
  'ta': ['だ'], 'ち': ['ぢ'], 'つ': ['づ'], 'て': ['で'], 'と': ['ど'], // wait, 'ta' -> 'た'
  'は': ['ば', 'ぱ'], 'ひ': ['び', 'ぴ'], 'ふ': ['ぶ', 'ぷ'], 'へ': ['べ', 'ぺ'], 'ほ': ['ぼ', 'ぽ'],
  'が': ['か'], 'ぎ': ['き'], 'ぐ': ['く'], 'げ': ['け'], 'ご': ['こ'],
  'ざ': ['さ'], 'じ': ['し'], 'ず': ['す'], 'ぜ': ['ぜ'], 'ぞ': ['そ'],
  'だ': ['た'], 'ぢ': ['ち'], 'づ': ['つ'], 'de': ['て'], 'ど': ['と'],
  'ば': ['は', 'ぱ'], 'ぱ': ['は', 'ba'],
  'び': ['ひ', 'ぴ'], 'ぴ': ['ひ', 'bi'],
  'ぶ': ['ふ', 'ぷ'], 'ぷ': ['ふ', 'ぶ'],
  'べ': ['へ', 'ぺ'], 'ぺ': ['へ', 'べ'],
  'ぼ': ['ほ', 'ぽ'], 'ぽ': ['ほ', 'ぼ']
};
// Clean DAKUTEN_MAP with no typos
const DAKUTEN_MAP_CLEAN = {
  'か': ['が'], 'き': ['ぎ'], 'く': ['ぐ'], 'け': ['げ'], 'こ': ['ご'],
  'さ': ['ざ'], 'し': ['じ'], 'す': ['ず'], 'せ': ['ぜ'], 'そ': ['ぞ'],
  'た': ['だ'], 'ち': ['ぢ'], 'つ': ['づ'], 'て': ['で'], 'と': ['ど'],
  'は': ['ば', 'ぱ'], 'ひ': ['び', 'ぴ'], 'ふ': ['ぶ', 'ぷ'], 'へ': ['べ', 'ぺ'], 'ほ': ['ぼ', 'ぽ'],
  'が': ['か'], 'ぎ': ['き'], 'ぐ': ['く'], 'げ': ['け'], 'ご': ['こ'],
  'ざ': ['さ'], 'じ': ['し'], 'ず': ['す'], 'ぜ': ['ぜ'], 'ぞ': ['そ'],
  'だ': ['た'], 'ぢ': ['ち'], 'づ': ['つ'], 'で': ['て'], 'ど': ['と'],
  'ば': ['は', 'ぱ'], 'ぱ': ['は', 'ば'],
  'び': ['ひ', 'ぴ'], 'ぴ': ['ひ', 'び'],
  'ぶ': ['ふ', 'ぷ'], 'ぷ': ['ふ', 'ぶ'],
  'べ': ['へ', 'ぺ'], 'ぺ': ['へ', 'べ'],
  'ぼ': ['ほ', 'ぽ'], 'ぽ': ['ほ', 'ぼ']
};

const SIMILAR_HIRAGANA = {
  'あ': ['お', 'め', 'ぬ'], 'お': ['あ', 'め', 'む'],
  'い': ['り', 'こ', 'に'], 'り': ['い', 'こ', 'に'],
  'う': ['ら', 'る', 'ろ'], 'ら': ['う', 'ち', 'る'],
  'え': ['ん', 'る', 'れ'], 'ん': ['え', 'そ', 'わ'],
  'か': ['が', 'お'],
  'き': ['さ', 'ち', 'ぎ'], 'さ': ['き', 'ち', 'ざ'],
  'く': ['ぐ', 'へ', 'し'],
  'け': ['は', 'ほ', 'げ'], 'は': ['け', 'ほ', 'ば', 'ぱ'], 'ほ': ['は', 'け', 'ぼ', 'ぽ'],
  'こ': ['い', 'り', 'ご'],
  'し': ['じ', 'つ', 'も'], 'つ': ['し', 'づ', 'っ'],
  'す': ['む', 'ず', 'お'], 'む': ['す', 'お'],
  'せ': ['ぜ', 'ya'],
  'そ': ['ぞ', 'ん'],
  'た': ['だ', 'na', 'に'],
  'な': ['た', 'に', 'ぬ'], 'に': ['た', 'na', 'こ'],
  'ち': ['ら', 'sa', 'き', 'ぢ'],
  'て': ['で', 'そ', 'と'], 'と': ['ど', 'て', 'そ'],
  'ぬ': ['め', 'ne', 'の'],
  'め': ['ぬ', 'の', 'あ'], 'の': ['め', 'ぬ', 'お'],
  'ね': ['れ', 'わ', 'ぬ'], 'れ': ['ne', 'わ', 'me'],
  'わ': ['れ', 'ne'],
  'ま': ['よ', 'ほ'], 'よ': ['ま', 'は', 'ほ'],
  'mi': ['ひ', 'め'], 'ひ': ['み', 'bi', 'pi'],
  'も': ['し', 'ま', 'を'],
  'ya': ['せ', 'ゆ', 'よ'], 'ゆ': ['ya', 'yo', 'o'],
  'る': ['ro', 'u'], 'ろ': ['ru', 'u', 'o'],
  'を': ['o', 'mo']
};
// Clean SIMILAR_HIRAGANA with no typos
const SIMILAR_HIRAGANA_CLEAN = {
  'あ': ['お', 'め', 'ぬ'], 'お': ['あ', 'め', 'む'],
  'い': ['り', 'こ', 'に'], 'り': ['い', 'こ', 'ni'],
  'う': ['ら', 'る', 'ろ'], 'ら': ['う', 'ち', 'る'],
  'え': ['ん', 'る', 'れ'], 'ん': ['え', 'そ', 'わ'],
  'か': ['が', 'お'],
  'き': ['さ', 'ち', 'ぎ'], 'さ': ['き', 'ち', 'ざ'],
  'く': ['ぐ', 'へ', 'し'],
  'け': ['は', 'ほ', 'げ'], 'は': ['け', 'ほ', 'ば', 'ぱ'], 'ほ': ['は', 'け', 'ぼ', 'ぽ'],
  'こ': ['い', 'り', 'ご'],
  'し': ['じ', 'つ', 'も'], 'つ': ['し', 'づ', 'っ'],
  'す': ['む', 'ず', 'お'], 'む': ['す', 'お'],
  'せ': ['ぜ', 'ya'],
  'そ': ['ぞ', 'ん'],
  'た': ['だ', 'な', 'に'], 'な': ['た', 'に', 'ぬ'], 'に': ['た', 'な', 'こ'],
  'ち': ['ら', 'さ', 'き', 'ぢ'],
  'て': ['で', 'そ', 'と'], 'と': ['ど', 'て', 'そ'],
  'ぬ': ['め', 'ね', 'の'], 'め': ['ぬ', 'の', 'あ'], 'の': ['め', 'ぬ', 'お'],
  'ね': ['れ', 'わ', 'ぬ'], 'れ': ['ね', 'わ', 'め'], 'わ': ['れ', 'ね'],
  'ま': ['よ', 'ほ'], 'よ': ['ま', 'は', 'ほ'],
  'み': ['ひ', 'め'], 'ひ': ['み', 'bi', 'pi'],
  'も': ['し', 'ま', 'を'],
  'や': ['se', 'ゆ', 'よ'], 'ゆ': ['ya', 'yo', 'o'],
  'る': ['ro', 'u'], 'ろ': ['ru', 'u', 'o'],
  'を': ['o', 'mo']
};
const SIMILAR_HIRAGANA_FINAL = {
  'あ': ['お', 'め', 'ぬ'], 'お': ['あ', 'め', 'む'],
  'い': ['り', 'こ', 'に'], 'り': ['い', 'こ', 'に'],
  'う': ['ら', 'る', 'ろ'], 'ら': ['う', 'ち', 'る'],
  'え': ['ん', 'る', 'れ'], 'ん': ['え', 'そ', 'わ'],
  'か': ['が', 'お'],
  'き': ['さ', 'ち', 'ぎ'], 'さ': ['き', 'ち', 'ざ'],
  'く': ['ぐ', 'へ', 'し'],
  'け': ['は', 'ほ', 'げ'], 'は': ['け', 'ほ', 'ば', 'ぱ'], 'ほ': ['は', 'け', 'ぼ', 'ぽ'],
  'こ': ['い', 'り', 'ご'],
  'し': ['じ', 'つ', 'も'], 'つ': ['し', 'づ', 'っ'],
  'す': ['む', 'ず', 'お'], 'む': ['す', 'お'],
  'せ': ['ぜ', 'や'],
  'そ': ['ぞ', 'ん'],
  'た': ['だ', 'な', 'に'], 'な': ['た', 'に', 'ぬ'], 'に': ['た', 'な', 'こ'],
  'ち': ['ら', 'sa', 'き', 'ぢ'],
  'て': ['で', 'そ', 'と'], 'と': ['ど', 'て', 'そ'],
  'ぬ': ['め', 'ね', 'の'], 'め': ['ぬ', 'の', 'あ'], 'の': ['め', 'ぬ', 'お'],
  'ね': ['れ', 'わ', 'ぬ'], 'れ': ['ね', 'わ', 'め'], 'わ': ['れ', 'ね'],
  'ま': ['よ', 'ほ'], 'よ': ['ま', 'は', 'ほ'],
  'み': ['ひ', 'め'], 'ひ': ['み', 'び', 'pi'],
  'も': ['し', 'ま', 'を'],
  'や': ['せ', 'ゆ', 'よ'], 'ゆ': ['や', 'よ', 'お'],
  'る': ['ろ', 'う'], 'ろ': ['る', 'う', 'お'],
  'を': ['お', 'も']
};

function mutateHiragana(word) {
  const mutations = new Set();
  const chars = Array.from(word);

  // 1. Dakuten/Handakuten toggling
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (DAKUTEN_MAP_CLEAN[char]) {
      for (const replacement of DAKUTEN_MAP_CLEAN[char]) {
        const copy = [...chars];
        copy[i] = replacement;
        mutations.add(copy.join(''));
      }
    }
  }

  // 2. Similar Hiragana replacement
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (SIMILAR_HIRAGANA_FINAL[char]) {
      for (const replacement of SIMILAR_HIRAGANA_FINAL[char]) {
        const copy = [...chars];
        copy[i] = replacement;
        mutations.add(copy.join(''));
      }
    }
  }

  // 3. Sokuon / Yoon toggling
  const sokuonYoonMap = {
    'っ': 'つ', 'つ': 'っ',
    'ゃ': 'や', 'や': 'ゃ',
    'ゅ': 'ゆ', 'ゆ': 'ゅ',
    'ょ': 'よ', 'よ': 'ょ'
  };
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (sokuonYoonMap[char]) {
      const copy = [...chars];
      copy[i] = sokuonYoonMap[char];
      mutations.add(copy.join(''));
    }
  }

  // 4. Swap adjacent characters
  for (let i = 0; i < chars.length - 1; i++) {
    const copy = [...chars];
    const temp = copy[i];
    copy[i] = copy[i + 1];
    copy[i + 1] = temp;
    mutations.add(copy.join(''));
  }

  // 5. Vowel extensions (long vowels) or adding/removing characters
  if (chars.length > 1) {
    const last = chars[chars.length - 1];
    if (last === 'う' || last === 'い' || last === 'ん') {
      const copy = chars.slice(0, -1);
      mutations.add(copy.join(''));
    }
    mutations.add(word + 'う');
    mutations.add(word + 'い');
    mutations.add(word + 'っ');
  }

  mutations.delete(word);
  return Array.from(mutations);
}

function getFuriganaDistractors(answer, level) {
  const distractors = new Set();
  const mutations = mutateHiragana(answer);

  shuffle(mutations).forEach(m => {
    if (m !== answer && m.trim().length > 0) distractors.add(m);
  });

  const pool = State.vocab.filter(v => v.furigana !== answer && v.level === level);

  if (distractors.size < 3) {
    const sameStart = pool.filter(v => v.furigana.startsWith(answer.charAt(0)));
    shuffle(sameStart).forEach(v => distractors.add(v.furigana));
  }

  if (distractors.size < 3) {
    const sameLength = pool.filter(v => Math.abs(v.furigana.length - answer.length) <= 1);
    shuffle(sameLength).forEach(v => distractors.add(v.furigana));
  }

  if (distractors.size < 3) {
    shuffle(pool).forEach(v => distractors.add(v.furigana));
  }

  if (distractors.size < 3) {
    const allPool = State.vocab.filter(v => v.furigana !== answer);
    shuffle(allPool).forEach(v => distractors.add(v.furigana));
  }

  return Array.from(distractors).slice(0, 3);
}

function isKanji(char) {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(char);
}

function getKanjiDistractors(answer, level) {
  const distractors = new Set();
  const answerKanji = Array.from(answer).filter(isKanji);

  if (answerKanji.length === 0) {
    const mutations = mutateHiragana(answer);
    shuffle(mutations).forEach(m => {
      if (m !== answer && m.trim().length > 0) distractors.add(m);
    });
  } else {
    const pool = State.vocab.filter(v => v.kanji !== answer && v.level === level);
    const sharingKanji = pool.filter(v => {
      return Array.from(v.kanji).some(char => answerKanji.includes(char));
    });
    shuffle(sharingKanji).forEach(v => distractors.add(v.kanji));

    if (distractors.size < 3) {
      const sameLengthKanji = pool.filter(v => {
        return v.kanji.length === answer.length && Array.from(v.kanji).some(isKanji);
      });
      shuffle(sameLengthKanji).forEach(v => distractors.add(v.kanji));
    }
  }

  if (distractors.size < 3) {
    const pool = State.vocab.filter(v => v.kanji !== answer && v.level === level);
    const anyKanji = pool.filter(v => Array.from(v.kanji).some(isKanji));
    shuffle(anyKanji).forEach(v => distractors.add(v.kanji));
  }

  if (distractors.size < 3) {
    const pool = State.vocab.filter(v => v.kanji !== answer);
    const anyKanji = pool.filter(v => Array.from(v.kanji).some(isKanji));
    shuffle(anyKanji).forEach(v => distractors.add(v.kanji));
  }

  if (distractors.size < 3) {
    const pool = State.vocab.filter(v => v.kanji !== answer && v.level === level);
    shuffle(pool).forEach(v => distractors.add(v.kanji));
  }

  if (distractors.size < 3) {
    const pool = State.vocab.filter(v => v.kanji !== answer);
    shuffle(pool).forEach(v => distractors.add(v.kanji));
  }

  return Array.from(distractors).slice(0, 3);
}

function getArtiDistractors(answer, level) {
  const distractors = new Set();

  const clean = s => s.toLowerCase().replace(/[(),;.?\/!]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  const answerWords = clean(answer);

  const pool = State.vocab.filter(v => v.arti !== answer && v.level === level);

  if (answerWords.length > 0) {
    const sharingWords = pool.filter(v => {
      const vWords = clean(v.arti);
      return vWords.some(w => answerWords.includes(w));
    });
    shuffle(sharingWords).forEach(v => distractors.add(v.arti));
  }

  if (distractors.size < 3) {
    shuffle(pool).forEach(v => distractors.add(v.arti));
  }

  if (distractors.size < 3 && answerWords.length > 0) {
    const allPool = State.vocab.filter(v => v.arti !== answer);
    const sharingWordsAny = allPool.filter(v => {
      const vWords = clean(v.arti);
      return vWords.some(w => answerWords.includes(w));
    });
    shuffle(sharingWordsAny).forEach(v => distractors.add(v.arti));
  }

  if (distractors.size < 3) {
    const allPool = State.vocab.filter(v => v.arti !== answer);
    shuffle(allPool).forEach(v => distractors.add(v.arti));
  }

  return Array.from(distractors).slice(0, 3);
}

function buildQuestion() {
  const v = QZ.queue[QZ.idx];
  let type = QZ.mode;
  if (type === 4) type = 1 + Math.floor(Math.random() * 3);
  let prompt, promptFuri = '', tag, answer, field;
  if (type === 1) { field = 'arti'; prompt = v.kanji; promptFuri = v.furigana; tag = 'Apa arti kata ini?'; answer = v.arti; }
  else if (type === 2) { field = 'furigana'; prompt = v.kanji; tag = 'Bagaimana cara bacanya?'; answer = v.furigana; }
  else { field = 'kanji'; prompt = v.arti; tag = 'Kanji mana yang tepat?'; answer = v.kanji; promptFuri = ''; }

  let distract;
  if (type === 1) {
    distract = getArtiDistractors(answer, v.level);
  } else if (type === 2) {
    distract = getFuriganaDistractors(answer, v.level);
  } else {
    distract = getKanjiDistractors(answer, v.level);
  }

  const options = shuffle([answer, ...distract]).slice(0, 4);
  if (!options.includes(answer)) options[0] = answer;
  QZ.q = { v, type, prompt, promptFuri, tag, answer, options, field, big: type !== 3 };
  QZ.answered = false;
}


function renderQuizQuestion(app) {
  document.body.classList.add('hide-nav');
  toggleBottomNav(false);
  const q = QZ.q;
  const prog = Math.round(QZ.idx / QZ.queue.length * 100);
  app.innerHTML = `
    <div class="view quiz-wrap">
      <div class="toolbar" style="margin-bottom: 20px;">
        <button class="btn ghost" id="exitQuiz" style="height: 40px; padding: 0 16px; border-radius: 12px; font-size: 14px;">
          🔕 Keluar Kuis
        </button>
      </div>
      <div class="quiz-meta"><span>Soal ${QZ.idx + 1} / ${QZ.queue.length}</span><span><span class="ok">✔ ${QZ.correct}</span> · <span class="no">✖ ${QZ.wrong}</span></span></div>
      <div class="quiz-progress"><i style="width:${prog}%"></i></div>
      <div class="quiz-q">
        <div class="tag">${esc(q.tag)}</div>
        ${q.big ? `<div class="big">${esc(q.prompt)}</div>${q.type === 1 ? `<div class="furi">${esc(q.promptFuri)}</div>` : ''}` : `<div class="med">${esc(q.prompt)}</div>`}
      </div>
      <div class="options" id="opts">
        ${q.options.map(o => `<button class="opt" data-val="${esc(o)}">${esc(o)}</button>`).join('')}
      </div>
      <div id="qnext"></div>
    </div>`;

  app.querySelector('#exitQuiz').onclick = () => {
    if (confirm('Yakin ingin membatalkan kuis ini?')) {
      QZ.mode = null;
      QZ.queue = [];
      QZ.idx = 0;
      renderQuizMenu(app);
    }
  };
  app.querySelectorAll('#opts .opt').forEach(b => b.onclick = () => answerQuiz(b.dataset.val, app));
}
function answerQuiz(val, app) {
  if (QZ.answered) return;
  QZ.answered = true;
  const q = QZ.q;
  const correct = val === q.answer;
  if (correct) { QZ.correct++; review(q.v.id, 'easy'); } else { QZ.wrong++; review(q.v.id, 'hard'); }
  app.querySelectorAll('#opts .opt').forEach(b => {
    b.disabled = true;
    if (b.dataset.val === q.answer) {
      b.classList.add('correct');
      let extra = '';
      if (q.field === 'furigana') {
        extra = q.v.arti;
      } else if (q.field === 'kanji') {
        extra = q.v.furigana;
      } else if (q.field === 'arti') {
        extra = q.v.kanji === q.v.furigana ? q.v.furigana : `${q.v.kanji} (${q.v.furigana})`;
      }
      if (extra) {
        b.innerHTML = `<div style="display:flex; flex-direction:column; gap:2px; flex:1;">
          <div>${esc(q.answer)}</div>
          <div style="font-size: 13px; font-weight: 500; opacity: 0.8; line-height: 1.25;">${esc(extra)}</div>
        </div><span class="badge">✔</span>`;
      } else {
        b.innerHTML = `${esc(q.answer)}<span class="badge">✔</span>`;
      }
    }
    else if (b.dataset.val === val) { b.classList.add('wrong'); b.innerHTML += '<span class="badge">✖</span>'; }
  });
  const next = document.getElementById('qnext');
  next.innerHTML = `<button class="quiz-next">${QZ.idx + 1 >= QZ.queue.length ? 'Lihat Hasil' : 'Soal Berikutnya →'}</button>`;
  next.firstElementChild.onclick = () => {
    QZ.idx++;
    if (QZ.idx >= QZ.queue.length) { renderQuizResult(app); }
    else { buildQuestion(); renderQuizQuestion(app); }
  };
}
function renderQuizResult(app) {
  document.body.classList.remove('hide-nav');
  toggleBottomNav(true);
  const total = QZ.correct + QZ.wrong;
  const pct = total ? Math.round(QZ.correct / total * 100) : 0;
  const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪';
  const msg = pct >= 80 ? 'Luar biasa! Kamu menguasai sesi ini.' : pct >= 50 ? 'Bagus! Terus berlatih.' : 'Tetap semangat, ulangi lagi ya!';
  app.innerHTML = `
    <div class="view quiz-wrap">
      <div class="result">
        <div class="big">${emoji}</div>
        <div class="score">${QZ.correct}/${total}</div>
        <h2>${pct}% Benar</h2>
        <p>${msg}</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn" id="retry">Main Lagi</button>
          <button class="btn ghost" id="menu">Pilih Mode</button>
        </div>
      </div>
    </div>`;
  app.querySelector('#retry').onclick = () => startQuiz(QZ.mode, app);
  app.querySelector('#menu').onclick = () => { QZ.mode = null; renderQuizMenu(app); };
}

/* ============================================================
   VIEW: STATISTIK
   ============================================================ */
Views.stats = (app) => {
  const total = State.vocab.length;
  const learned = State.vocab.filter(v => isLearned(v.id)).length;
  const mastered = State.vocab.filter(v => isMastered(v.id)).length;
  const notyet = total - learned;
  const a = total ? learned / total * 100 : 0;       // learned (incl mastered)
  const b = total ? mastered / total * 100 : 0;       // mastered portion
  // donut: green=mastered, orange=learned-not-mastered, rest=belum
  const segMaster = total ? mastered / total * 100 : 0;
  const segLearned = total ? learned / total * 100 : 0;

  const levels = ['N4', 'N3', 'N2'].map(lv => {
    const arr = State.vocab.filter(v => v.level === lv);
    const l = arr.filter(v => isLearned(v.id)).length;
    const m = arr.filter(v => isMastered(v.id)).length;
    return { lv, tot: arr.length, l, m, lp: arr.length ? Math.round(l / arr.length * 100) : 0, mp: arr.length ? Math.round(m / arr.length * 100) : 0 };
  });

  let totalReviews = 0, totalCorrect = 0, totalWrong = 0;
  Object.values(State.progress).forEach(s => { totalCorrect += s.correct || 0; totalWrong += s.wrong || 0; });
  totalReviews = totalCorrect + totalWrong;
  const acc = totalReviews ? Math.round(totalCorrect / totalReviews * 100) : 0;

  app.innerHTML = `
    <div class="view">
      <h1 class="page-title">Statistik<span class="sub">Pantau perkembangan belajarmu</span></h1>

      <section>
        <div class="grid stat-grid">
          <div class="stat clickable" data-stat="learned"><span class="ico">📖</span><div class="val">${learned}</div><div class="lbl">Total dipelajari</div></div>
          <div class="stat clickable" data-stat="mastered"><span class="ico">🏆</span><div class="val">${mastered}</div><div class="lbl">Total dikuasai</div></div>
          <div class="stat" data-stat="notyet"><span class="ico">💭</span><div class="val">${notyet}</div><div class="lbl">Belum dipelajari</div></div>
          <div class="stat" data-stat="accuracy"><span class="ico">🎯</span><div class="val">${acc}%</div><div class="lbl">Akurasi review</div></div>
        </div>
      </section>

      <section>
        <p class="section-label">Ringkasan Penguasaan</p>
        <div class="card donut-wrap">
          <div class="donut" style="--a:${segMaster}%;--b:${segLearned}%">
            <div class="mid"><b>${total ? Math.round(learned / total * 100) : 0}%</b><small>dipelajari</small></div>
          </div>
          <div class="legend">
            <div class="row"><span class="dot" style="background:var(--green)"></span> Dikuasai <b>${mastered}</b></div>
            <div class="row"><span class="dot" style="background:var(--orange)"></span> Dipelajari <b>${learned - mastered}</b></div>
            <div class="row"><span class="dot" style="background:var(--bg-soft)"></span> Belum <b>${notyet}</b></div>
          </div>
        </div>
      </section>

      <section>
        <p class="section-label">Progress per Level</p>
        <div class="card progress-level-card" style="padding:24px">
          ${levels.map(x => `
            <div class="bar-row">
              <div class="top"><span>${x.lv} <span class="muted">· ${x.tot} kata</span></span><span>${x.lp}%</span></div>
              <div class="bar ${x.lv.toLowerCase()}"><i style="width:${x.lp}%"></i></div>
              <div class="top" style="margin-top:6px;font-size:12px;color:var(--text-dim)"><span>Dikuasai: ${x.m}</span><span>${x.mp}%</span></div>
            </div>`).join('')}
        </div>
      </section>

      <section>
        <p class="section-label">Aktivitas Review (Klik untuk detail)</p>
        <div class="grid stat-grid">
          <div class="stat" data-stat="reviews"><span class="ico">🔁</span><div class="val">${totalReviews}</div><div class="lbl">Total review</div></div>
          <div class="stat clickable" id="btnCorrectReviews" data-stat="correct"><span class="ico">✅</span><div class="val">${totalCorrect}</div><div class="lbl">Jawaban benar</div></div>
          <div class="stat clickable" id="btnWrongReviews" data-stat="wrong"><span class="ico">❌</span><div class="val">${totalWrong}</div><div class="lbl">Jawaban salah</div></div>
          <div class="stat" data-stat="streak"><span class="ico">🔥</span><div class="val">${currentStreak()}</div><div class="lbl">Streak (hari)</div></div>
        </div>
      </section>

      <section>
        <button class="btn ghost block" id="reset">🗑️ Reset semua progress</button>
      </section>
    </div>`;

  app.querySelectorAll('[data-stat]').forEach(b => b.onclick = () => {
    const s = b.dataset.stat;
    if (s === 'learned') {
      ListState.level = 'all';
      ListState.filter = 'learned';
    } else if (s === 'mastered') {
      ListState.level = 'all';
      ListState.filter = 'mastered';
    }
    ListState.q = '';
    ListState.limit = 60;
    navigate('list');
  });

  app.querySelector('#btnCorrectReviews').onclick = () => {
    StatsDetailState.type = 'correct';
    navigate('statsDetail');
  };
  app.querySelector('#btnWrongReviews').onclick = () => {
    StatsDetailState.type = 'wrong';
    navigate('statsDetail');
  };
  app.querySelector('#reset').onclick = () => {
    if (confirm('Yakin ingin menghapus semua progress belajar? Tindakan ini tidak bisa dibatalkan.')) {
      State.progress = {}; State.streak = { current: 0, last: null, best: 0 }; State.wrongSolved = {};
      save(K.progress, State.progress); save(K.streak, State.streak); save(K.wrongSolved, State.wrongSolved);
      toast('Progress direset'); navigate('stats');
    }
  };
};

/* ============================================================
   VIEW: DETAIL STATISTIK (Correct/Wrong list)
   ============================================================ */
const StatsDetailState = { type: 'correct' };
Views.statsDetail = (app) => {
  const type = StatsDetailState.type;
  const isCorrect = type === 'correct';
  const title = isCorrect ? 'Daftar Jawaban Benar' : 'Daftar Jawaban Salah';
  const subtitle = isCorrect ? 'Kosakata yang dijawab benar setidaknya satu kali' : 'Kosakata yang dijawab salah setidaknya satu kali';
  const label = isCorrect ? 'Benar' : 'Salah';
  const color = isCorrect ? 'var(--green)' : 'var(--red)';
  const icon = isCorrect ? '✅' : '❌';

  const filtered = State.vocab.filter(v => {
    if (isCorrect) {
      const s = State.progress[v.id];
      return s && s.correct > 0;
    } else {
      return effectiveWrong(v.id) > 0;
    }
  }).sort((a, b) => {
    if (isCorrect) {
      const sA = State.progress[a.id];
      const sB = State.progress[b.id];
      return (sB ? sB.correct || 0 : 0) - (sA ? sA.correct || 0 : 0);
    } else {
      return effectiveWrong(b.id) - effectiveWrong(a.id);
    }
  });

  app.innerHTML = `
    <div class="view">
      <div class="toolbar" style="margin-bottom: 20px; justify-content: space-between; align-items: center; width: 100%; display: flex; flex-wrap: wrap; gap: 10px;">
        <button class="btn ghost" id="backToStats" style="height: 40px; padding: 0 16px; border-radius: 12px; font-size: 14px;">
          ← Kembali ke Statistik
        </button>
        ${!isCorrect && filtered.length > 0 ? `
        <button class="btn" id="startWrongQuiz" style="height: 40px; padding: 0 16px; border-radius: 12px; font-size: 14px; background: linear-gradient(135deg, var(--red), #ff7e5f); color: white; border: none; box-shadow: 0 4px 10px var(--red-soft); font-weight: 700;">
          🎯 Latihan Soal Salah
        </button>` : ''}
      </div>

      <h1 class="page-title">${esc(title)}<span class="sub">${esc(subtitle)}</span></h1>
      
      <p class="count-note">${filtered.length} kosakata ditemukan</p>
      
      <div class="vocab-grid">
        ${filtered.length ? filtered.map(v => {
    const s = State.progress[v.id];
    const count = isCorrect ? (s ? s.correct : 0) : effectiveWrong(v.id);
    return `
            <div class="vocab-card">
              <span class="lv ${v.level}">${v.level}</span>
              <div class="kanji">${esc(v.kanji)}</div>
              <div class="furi">${esc(v.furigana)}</div>
              <div class="arti">${esc(v.arti)}</div>
              <div style="margin-top:10px; font-size:12.5px; font-weight:700; color:${color}; display:flex; align-items:center; gap:6px; border-top:1px solid var(--border-soft); padding-top:8px;">
                <span>${icon} ${count}x ${label}</span>
              </div>
            </div>`;
  }).join('') : `
          <div class="empty" style="grid-column: 1 / -1">
            <div class="big">💭</div>
            Belum ada data review.
          </div>
        `}
      </div>
    </div>`;

  app.querySelector('#backToStats').onclick = () => navigate('stats');
  const startBtn = app.querySelector('#startWrongQuiz');
  if (startBtn) {
    startBtn.onclick = () => navigate('statsDetailQuiz');
  }
};

/* ============================================================
   VIEW: DETAIL STATISTIK - KUIS KHUSUS JAWABAN SALAH
   ============================================================ */
const WQ = { queue: [], idx: 0, correct: 0, wrong: 0, answered: false, q: null };

Views.statsDetailQuiz = (app) => {
  if (!WQ.queue.length || WQ.idx >= WQ.queue.length) {
    const wrongVocab = State.vocab.filter(v => {
      return effectiveWrong(v.id) > 0;
    }).sort((a, b) => {
      return effectiveWrong(b.id) - effectiveWrong(a.id);
    });

    WQ.queue = wrongVocab.slice(0, 10);
    WQ.idx = 0;
    WQ.correct = 0;
    WQ.wrong = 0;
    WQ.answered = false;

    if (WQ.queue.length === 0) {
      navigate('statsDetail');
      return;
    }
    buildWrongQuestion();
  }
  renderWrongQuestion(app);
};

function startWrongQuiz(app) {
  const wrongVocab = State.vocab.filter(v => {
    return effectiveWrong(v.id) > 0;
  }).sort((a, b) => {
    return effectiveWrong(b.id) - effectiveWrong(a.id);
  });

  WQ.queue = wrongVocab.slice(0, 10);
  WQ.idx = 0;
  WQ.correct = 0;
  WQ.wrong = 0;
  WQ.answered = false;

  if (WQ.queue.length === 0) {
    navigate('statsDetail');
    return;
  }
  buildWrongQuestion();
  renderWrongQuestion(app);
}

function buildWrongQuestion() {
  const v = WQ.queue[WQ.idx];
  let type = 1 + Math.floor(Math.random() * 3);
  let prompt, promptFuri = '', tag, answer, field;
  if (type === 1) { field = 'arti'; prompt = v.kanji; promptFuri = v.furigana; tag = 'Apa arti kata ini?'; answer = v.arti; }
  else if (type === 2) { field = 'furigana'; prompt = v.kanji; tag = 'Bagaimana cara bacanya?'; answer = v.furigana; }
  else { field = 'kanji'; prompt = v.arti; tag = 'Kanji mana yang tepat?'; answer = v.kanji; promptFuri = ''; }

  let distract;
  if (type === 1) {
    distract = getArtiDistractors(answer, v.level);
  } else if (type === 2) {
    distract = getFuriganaDistractors(answer, v.level);
  } else {
    distract = getKanjiDistractors(answer, v.level);
  }

  const options = shuffle([answer, ...distract]).slice(0, 4);
  if (!options.includes(answer)) options[0] = answer;
  WQ.q = { v, type, prompt, promptFuri, tag, answer, options, field, big: type !== 3 };
  WQ.answered = false;
}

function renderWrongQuestion(app) {
  document.body.classList.add('hide-nav');
  toggleBottomNav(false);
  const q = WQ.q;
  const prog = Math.round(WQ.idx / WQ.queue.length * 100);
  app.innerHTML = `
    <div class="view quiz-wrap">
      <div class="toolbar" style="margin-bottom: 20px;">
        <button class="btn ghost" id="exitWrongQuiz" style="height: 40px; padding: 0 16px; border-radius: 12px; font-size: 14px;">
          🔕 Keluar Latihan
        </button>
      </div>
      <h1 class="page-title" style="font-size:20px;margin-bottom:10px">Latihan Kosakata Salah<span class="sub">Prioritas kata yang sering salah</span></h1>
      <div class="quiz-meta" style="margin-top:10px"><span>Soal ${WQ.idx + 1} / ${WQ.queue.length}</span><span><span class="ok">✔ ${WQ.correct}</span> · <span class="no">✖ ${WQ.wrong}</span></span></div>
      <div class="quiz-progress"><i style="width:${prog}%"></i></div>
      <div class="quiz-q">
        <div class="tag">${esc(q.tag)}</div>
        ${q.big ? `<div class="big">${esc(q.prompt)}</div>${q.type === 1 ? `<div class="furi">${esc(q.promptFuri)}</div>` : ''}` : `<div class="med">${esc(q.prompt)}</div>`}
      </div>
      <div class="options" id="opts">
        ${q.options.map(o => `<button class="opt" data-val="${esc(o)}">${esc(o)}</button>`).join('')}
      </div>
      <div id="qnext" style="margin-top:18px"></div>
    </div>`;

  app.querySelector('#exitWrongQuiz').onclick = () => {
    if (confirm('Yakin ingin membatalkan latihan ini?')) {
      WQ.queue = [];
      WQ.idx = 0;
      navigate('statsDetail');
    }
  };
  app.querySelectorAll('#opts .opt').forEach(b => b.onclick = () => answerWrongQuiz(b.dataset.val, app));
}

function answerWrongQuiz(val, app) {
  if (WQ.answered) return;
  WQ.answered = true;
  const q = WQ.q;
  const correct = val === q.answer;
  if (correct) {
    WQ.correct++;
    State.wrongSolved[q.v.id] = (State.wrongSolved[q.v.id] || 0) + 1;
    save(K.wrongSolved, State.wrongSolved);
  } else {
    WQ.wrong++;
  }
  app.querySelectorAll('#opts .opt').forEach(b => {
    b.disabled = true;
    if (b.dataset.val === q.answer) {
      b.classList.add('correct');
      let extra = '';
      if (q.field === 'furigana') {
        extra = q.v.arti;
      } else if (q.field === 'kanji') {
        extra = q.v.furigana;
      } else if (q.field === 'arti') {
        extra = q.v.kanji === q.v.furigana ? q.v.furigana : `${q.v.kanji} (${q.v.furigana})`;
      }
      if (extra) {
        b.innerHTML = `<div style="display:flex; flex-direction:column; gap:2px; flex:1;">
          <div>${esc(q.answer)}</div>
          <div style="font-size: 13px; font-weight: 500; opacity: 0.8; line-height: 1.25;">${esc(extra)}</div>
        </div><span class="badge">✔</span>`;
      } else {
        b.innerHTML = `${esc(q.answer)}<span class="badge">✔</span>`;
      }
    }
    else if (b.dataset.val === val) { b.classList.add('wrong'); b.innerHTML += '<span class="badge">✖</span>'; }
  });
  const next = document.getElementById('qnext');
  next.innerHTML = `<button class="quiz-next">${WQ.idx + 1 >= WQ.queue.length ? 'Lihat Hasil' : 'Soal Berikutnya →'}</button>`;
  next.firstElementChild.onclick = () => {
    WQ.idx++;
    if (WQ.idx >= WQ.queue.length) { renderWrongQuizResult(app); }
    else { buildWrongQuestion(); renderWrongQuestion(app); }
  };
}

function renderWrongQuizResult(app) {
  document.body.classList.remove('hide-nav');
  toggleBottomNav(true);
  const total = WQ.correct + WQ.wrong;
  const pct = total ? Math.round(WQ.correct / total * 100) : 0;
  const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪';
  const msg = pct >= 80 ? 'Luar biasa! Kamu menguasai sesi latihan ini.' : pct >= 50 ? 'Bagus! Terus latih kata yang salah.' : 'Tetap semangat, ulangi latihan lagi ya!';
  app.innerHTML = `
    <div class="view quiz-wrap">
      <div class="result">
        <div class="big">${emoji}</div>
        <div class="score">${WQ.correct}/${total}</div>
        <h2>${pct}% Benar</h2>
        <p>${msg}</p>
        <p style="font-size:12px;color:var(--text-dim);margin-top:-10px;margin-bottom:20px;">Latihan ini bersifat mandiri dan tidak mengubah progress belajar utama Anda.</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn" id="retryWrong">Latih Lagi</button>
          <button class="btn ghost" id="backToDetail">Kembali</button>
        </div>
      </div>
    </div>`;
  app.querySelector('#retryWrong').onclick = () => {
    startWrongQuiz(app);
  };
  app.querySelector('#backToDetail').onclick = () => {
    WQ.queue = [];
    WQ.idx = 0;
    navigate('statsDetail');
  };
}

function emptyState(msg) { return `<div class="view"><div class="empty"><div class="big">💭</div>${esc(msg)}</div></div>`; }

/* ============================================================
   BOOT
   ============================================================ */
async function boot() {
  applySettings();
  document.getElementById('furiToggle').onclick = toggleFurigana;
  document.getElementById('themeToggle').onclick = toggleTheme;

  // Global dismiss for kotoba modal
  const modalBackdrop = document.getElementById('kotobaModalBackdrop');
  if (modalBackdrop) {
    modalBackdrop.onclick = (e) => {
      if (e.target === modalBackdrop) closeKotobaModal();
    };
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeKotobaModal();
  });

  document.querySelectorAll('.nav-item').forEach(b => b.onclick = () => {
    if (b.dataset.nav === 'list') {
      ListState.level = 'all';
      ListState.filter = 'all';
      ListState.q = '';
    }
    navigate(b.dataset.nav);
  });

  try {
    const res = await fetch('data/vocabulary.json');
    if (!res.ok) throw new Error('http ' + res.status);
    State.vocab = await res.json();
  } catch (e) {
    // Fallback to embedded data (works even on file://)
    if (Array.isArray(window.VOCAB) && window.VOCAB.length) {
      State.vocab = window.VOCAB;
    } else {
      document.getElementById('app').innerHTML = `<div class="view"><div class="empty"><div class="big">⚠️</div>Gagal memuat data kosakata.<br><small>Coba jalankan lewat server: “python3 -m http.server”</small></div></div>`;
      return;
    }
  }

  // Load readings (curated passages)
  try {
    const rRes = await fetch('data/readings.json');
    if (!rRes.ok) throw new Error('http ' + rRes.status);
    State.readings = await rRes.json();
  } catch (e) {
    if (Array.isArray(window.READINGS) && window.READINGS.length) {
      State.readings = window.READINGS;
    } else {
      State.readings = [];
    }
  }

  navigate('home');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => { }));
  }
}
boot();
