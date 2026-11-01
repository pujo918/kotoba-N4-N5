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
const save = (k, v) => {
  localStorage.setItem(k, JSON.stringify(v));
  if (typeof CloudSync !== 'undefined' && CloudSync && typeof CloudSync.schedulePush === 'function') {
    CloudSync.schedulePush();
  }
};
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const now = () => Date.now();
const DAY = 86400000;

/* ---------- Global state ---------- */
const State = {
  vocab: [],
  readings: [],
  settings: load(K.settings, { furigana: true, theme: 'dark', lang: 'ja' }),
  progress: load(K.progress, {}),   // id -> {correct,wrong,last,box,due,seen}
  streak: load(K.streak, { current: 0, last: null, best: 0 }),
  route: 'home',
  wrongSolved: load(K.wrongSolved, {}),
  customReadings: load(K.customReadings, []),
  readCompleted: load(K.readCompleted, {}),
  materiTab: 'vocab',               // 'vocab' | 'reading'
  activeReading: null,
};
if (!State.settings.lang) State.settings.lang = 'ja';
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

/* ==========================================================
   STREAK FLAME TIERS & ANIMATIONS (TIKTOK STYLE)
   ========================================================== */
const STREAK_TIERS = [
  {
    id: 'yellow',
    level: 1,
    minDays: 0,
    maxDays: 3,
    nameId: 'Api Kuning (Awal)',
    nameJa: '黄色の炎',
    descId: 'Api awal yang hangat. Pertahankan konsistensi 3 hari pertama!',
    descJa: '学習を始めたばかりの暖かい炎。まずは3日間の継続を目指しましょう！',
    cardClass: 'streak-tier-yellow',
    grad: ['#fef08a', '#fbbf24', '#d97706'],
    core: '#ffffff',
    glow: '#f59e0b'
  },
  {
    id: 'red',
    level: 2,
    minDays: 4,
    maxDays: 7,
    nameId: 'Api Merah (Membara)',
    nameJa: '深紅の炎',
    descId: 'Membara kuat menuju 1 minggu belajar penuh!',
    descJa: '1週間の習慣化へ向けて勢いよく燃え盛る赤い炎！',
    cardClass: 'streak-tier-red',
    grad: ['#fecdd3', '#f43f5e', '#dc2626'],
    core: '#ffffff',
    glow: '#f43f5e'
  },
  {
    id: 'blue',
    level: 3,
    minDays: 8,
    maxDays: 14,
    nameId: 'Api Biru (Suhu Tinggi)',
    nameJa: '蒼炎',
    descId: 'Api biru suhu tinggi >1400°C. Konsistensi belajar mengakar!',
    descJa: '1400℃を超える完全燃焼の青い炎。学習習慣が定着しています！',
    cardClass: 'streak-tier-blue',
    grad: ['#e0f2fe', '#38bdf8', '#0284c7'],
    core: '#ffffff',
    glow: '#38bdf8'
  },
  {
    id: 'green',
    level: 4,
    minDays: 15,
    maxDays: 29,
    nameId: 'Api Hijau (Plasma Kimia)',
    nameJa: '翠炎',
    descId: 'Energi plasma hijau menembus 2 minggu belajar aktif!',
    descJa: '半月の壁を突破した高エネルギーの神秘的な緑炎！',
    cardClass: 'streak-tier-green',
    grad: ['#d1fae5', '#34d399', '#059669'],
    core: '#ffffff',
    glow: '#34d399'
  },
  {
    id: 'purple',
    level: 5,
    minDays: 30,
    maxDays: 59,
    nameId: 'Api Ungu (Mistis)',
    nameJa: '紫炎',
    descId: 'Prestasi 1 bulan lebih! Memancarkan aura api ungu ultra-energi.',
    descJa: '1ヶ月以上の偉業！神秘的な紫外線スペクトルの炎を纏っています。',
    cardClass: 'streak-tier-purple',
    grad: ['#f3e8ff', '#c084fc', '#7c3aed'],
    core: '#ffffff',
    glow: '#c084fc'
  },
  {
    id: 'white',
    level: 6,
    minDays: 60,
    maxDays: 99,
    nameId: 'Api Putih (Inti Bintang)',
    nameJa: '白熱の炎',
    descId: 'Suhu ekstrem putih cemerlang melebihi inti bintang!',
    descJa: '太陽の表面をも凌駕する純白の極限温度！',
    cardClass: 'streak-tier-white',
    grad: ['#ffffff', '#bae6fd', '#38bdf8'],
    core: '#ffffff',
    glow: '#ffffff'
  },
  {
    id: 'black',
    level: 7,
    minDays: 100,
    maxDays: 99999,
    nameId: 'Api Hitam (Legenda Amaterasu)',
    nameJa: '黒炎・天照',
    descId: 'Legenda 100+ hari! Api hitam kosmik abadi yang tak pernah padam.',
    descJa: '100日以上の伝説！暗黒の空間を焼き尽くす不滅の神炎。',
    cardClass: 'streak-tier-black',
    grad: ['#c084fc', '#2e1065', '#000000'],
    core: '#e879f9',
    glow: '#a855f7'
  }
];

function getStreakTier(days) {
  const d = Math.max(0, Number(days) || 0);
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (d >= STREAK_TIERS[i].minDays) {
      return STREAK_TIERS[i];
    }
  }
  return STREAK_TIERS[0];
}

function renderStreakFlameSVG(tier, size = 52, prefix = '') {
  const gId = 'flame_' + (prefix ? prefix + '_' : '') + tier.id;
  const glowId = 'glow_' + (prefix ? prefix + '_' : '') + tier.id;
  return `
    <svg class="streak-flame-svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gId}_outer" x1="32" y1="62" x2="32" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${tier.grad[2]}"/>
          <stop offset="55%" stop-color="${tier.grad[1]}"/>
          <stop offset="100%" stop-color="${tier.grad[0]}"/>
        </linearGradient>
        <linearGradient id="${gId}_mid" x1="32" y1="58" x2="32" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${tier.grad[2]}"/>
          <stop offset="60%" stop-color="${tier.grad[0]}"/>
          <stop offset="100%" stop-color="${tier.core}"/>
        </linearGradient>
        <linearGradient id="${gId}_core" x1="32" y1="56" x2="32" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${tier.grad[1]}"/>
          <stop offset="40%" stop-color="${tier.grad[0]}"/>
          <stop offset="100%" stop-color="${tier.core}"/>
        </linearGradient>
        <filter id="${glowId}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${tier.glow}" flood-opacity="0.6"/>
        </filter>
      </defs>
      <!-- Base/Aura -->
      <path class="flame-outer" d="M32 2 C32 2 40 14 40 22 C40 26 38 29 36 31 C42 27 49 33 49 43 C49 54 41 62 32 62 C23 62 15 54 15 43 C15 32 22 25 25 18 C27 14 27 9 27 5 C27 2 32 2 32 2Z"
            fill="url(#${gId}_outer)" filter="url(#${glowId})"/>
      <!-- Mid tongue -->
      <path class="flame-mid" d="M33 12 C35 18 41 24 39 31 C37 34 33 35 30 38 C28 34 27 29 30 24 C31 19 33 15 33 12Z"
            fill="url(#${gId}_mid)" opacity="0.85"/>
      <!-- Inner flame -->
      <path class="flame-inner" d="M32 24 C35 24 40 33 40 42 C40 49 36 55 32 55 C28 55 24 49 24 42 C24 34 29 28 32 24Z"
            fill="url(#${gId}_core)"/>
      <!-- Intense hot core bead -->
      <ellipse class="flame-core" cx="32" cy="46" rx="4" ry="6.5" fill="${tier.core}" opacity="0.95"/>
    </svg>
  `;
}

function playFlameIgniteSound(level = 1) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const lvl = Math.max(1, Math.min(7, level));

    const dur = 0.28 + (lvl - 1) * 0.08;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = lvl >= 5 ? 'lowpass' : 'bandpass';
    const baseFreq = Math.max(70, 320 - (lvl * 32));
    const peakFreq = 600 + (lvl * 130);
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.frequency.exponentialRampToValueAtTime(peakFreq, now + dur * 0.25);
    filter.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + dur);
    filter.Q.setValueAtTime(1.5 + (lvl * 0.5), now);

    const gain = ctx.createGain();
    const peakGain = Math.min(0.48, 0.16 + (lvl * 0.045));
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + dur * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Punch sub-bass for Level 3+
    if (lvl >= 3) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = lvl >= 6 ? 'sawtooth' : 'sine';
      const startPitch = lvl === 7 ? 95 : (lvl === 6 ? 135 : 175);
      const endPitch = lvl === 7 ? 35 : 45;
      osc.frequency.setValueAtTime(startPitch, now);
      osc.frequency.exponentialRampToValueAtTime(endPitch, now + dur * 0.7);

      oscGain.gain.setValueAtTime(0.01, now);
      oscGain.gain.linearRampToValueAtTime(lvl >= 6 ? 0.35 : 0.2, now + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.85);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur * 0.85);
    }

    noise.start(now);
    noise.stop(now + dur);
  } catch (e) {
    // Ignore audio restrictions
  }
}

function spawnVfxSparks(container, x, y, count, color, maxDist, dur) {
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'vfx-spark';
    const size = 4 + Math.random() * 5;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.backgroundColor = color;
    s.style.boxShadow = '0 0 8px ' + color;
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.setProperty('--dur', dur + 's');
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * maxDist;
    s.style.setProperty('--tx', (Math.cos(angle) * dist) + 'px');
    s.style.setProperty('--ty', (Math.sin(angle) * dist) + 'px');
    container.appendChild(s);
  }
}

function spawnVfxRing(container, x, y, color, targetSize) {
  const ring = document.createElement('div');
  ring.className = 'vfx-shockwave-ring';
  ring.style.left = x + 'px';
  ring.style.top = y + 'px';
  ring.style.borderColor = color;
  ring.style.borderStyle = 'solid';
  ring.style.boxShadow = '0 0 16px ' + color;
  ring.style.setProperty('--target-size', targetSize + 'px');
  container.appendChild(ring);
}

const TIER_CANVAS_COLORS = {
  1: { outer: 'rgba(217, 119, 6, 0.4)', mid: 'rgba(245, 158, 11, 0.85)', core: 'rgba(254, 240, 138, 1)', ember: '#fbbf24' },
  2: { outer: 'rgba(185, 28, 28, 0.4)', mid: 'rgba(239, 68, 68, 0.85)', core: 'rgba(254, 205, 211, 1)', ember: '#f87171' },
  3: { outer: 'rgba(3, 105, 161, 0.4)', mid: 'rgba(14, 165, 233, 0.85)', core: 'rgba(224, 242, 254, 1)', ember: '#38bdf8' },
  4: { outer: 'rgba(4, 120, 87, 0.4)', mid: 'rgba(16, 185, 129, 0.85)', core: 'rgba(209, 250, 229, 1)', ember: '#34d399' },
  5: { outer: 'rgba(109, 40, 217, 0.4)', mid: 'rgba(168, 85, 247, 0.85)', core: 'rgba(243, 232, 255, 1)', ember: '#c084fc' },
  6: { outer: 'rgba(51, 65, 85, 0.4)', mid: 'rgba(147, 197, 253, 0.85)', core: 'rgba(255, 255, 255, 1)', ember: '#ffffff' },
  7: { outer: 'rgba(15, 15, 20, 0.6)', mid: 'rgba(126, 34, 206, 0.85)', core: 'rgba(10, 10, 15, 1)', ember: '#a855f7' }
};

const BOTTOM_FLAME_PROFILES = {
  1: { minVy: -2.5, maxVy: -4.5, minLife: 18, maxLife: 26, minR: 20, maxR: 30, spawn: 14 },
  2: { minVy: -4.5, maxVy: -7.5, minLife: 24, maxLife: 32, minR: 28, maxR: 40, spawn: 22 },
  3: { minVy: -7.5, maxVy: -11.5, minLife: 30, maxLife: 40, minR: 36, maxR: 50, spawn: 28 },
  4: { minVy: -11.0, maxVy: -15.5, minLife: 36, maxLife: 46, minR: 42, maxR: 58, spawn: 34 },
  5: { minVy: -14.0, maxVy: -19.5, minLife: 40, maxLife: 52, minR: 48, maxR: 66, spawn: 40 },
  6: { minVy: -17.5, maxVy: -24.5, minLife: 46, maxLife: 60, minR: 54, maxR: 74, spawn: 46 }
};

// GPU texture cache for 60FPS smoothness (zero per-frame gradient allocation)
const _flameTextureCache = {};

function getPreRenderedFlameTexture(lvl, isDark, colors) {
  const key = lvl + '_' + isDark;
  if (_flameTextureCache[key]) return _flameTextureCache[key];

  const size = 128;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const octx = off.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  const grad = octx.createRadialGradient(cx, cy, 0, cx, cy, r);
  if (isDark) {
    grad.addColorStop(0, 'rgba(5, 5, 10, 0.95)');
    grad.addColorStop(0.4, 'rgba(40, 10, 70, 0.85)');
    grad.addColorStop(0.75, 'rgba(168, 85, 247, 0.7)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
  } else {
    grad.addColorStop(0, colors.core);
    grad.addColorStop(0.45, colors.mid);
    grad.addColorStop(0.8, colors.outer);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
  }

  octx.fillStyle = grad;
  octx.beginPath();
  octx.arc(cx, cy, r, 0, Math.PI * 2);
  octx.fill();

  _flameTextureCache[key] = off;
  return off;
}

let _fireCanvasAnimId = null;

function launchProceduralScreenFire(lvl, tier, ox, oy) {
  let canvas = document.getElementById('fireCanvasOverlay');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'fireCanvasOverlay';
    document.body.appendChild(canvas);
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  if (_fireCanvasAnimId) {
    cancelAnimationFrame(_fireCanvasAnimId);
    _fireCanvasAnimId = null;
  }

  const colors = TIER_CANVAS_COLORS[lvl] || TIER_CANVAS_COLORS[1];
  const isDark = (lvl === 7);
  const profile = BOTTOM_FLAME_PROFILES[lvl] || BOTTOM_FLAME_PROFILES[1];
  const texture = getPreRenderedFlameTexture(lvl, isDark, colors);

  const animStartTime = performance.now();
  const ANIM_DURATION = 1800;
  const fireParticles = [];

  class FireTongue {
    constructor(x, y, vx, vy, maxLife, baseRadius) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.life = 0;
      this.maxLife = maxLife;
      this.baseRadius = baseRadius;
      this.wigglePhase = Math.random() * Math.PI * 2;
    }
    update() {
      this.life++;
      this.wigglePhase += 0.12;
      this.x += this.vx + Math.sin(this.wigglePhase) * 1.5;
      this.y += this.vy + Math.cos(this.wigglePhase) * 1.5;
    }
    draw(ctx, intensity) {
      const t = this.life / this.maxLife;
      if (t >= 1) return;
      const r = this.baseRadius * (1 - t * 0.72) * (0.8 + Math.sin(this.life * 0.3) * 0.2) * intensity;
      if (r <= 1) return;

      ctx.globalAlpha = (1 - t) * intensity;
      ctx.drawImage(texture, this.x - r, this.y - r, r * 2, r * 2);
    }
  }

  class FloatingEmber {
    constructor(x, y, vx, vy) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.life = 0;
      this.maxLife = 35 + Math.random() * 35;
      this.size = 2 + Math.random() * 3.5;
    }
    update() {
      this.life++;
      this.x += this.vx + (Math.random() - 0.5) * 1.5;
      this.y += this.vy;
    }
    draw(ctx, intensity) {
      const t = this.life / this.maxLife;
      if (t >= 1) return;
      ctx.globalAlpha = (1 - t) * intensity;
      ctx.fillStyle = colors.ember;
      ctx.shadowColor = colors.ember;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frameLoop(now) {
    const elapsed = now - animStartTime;
    if (elapsed > ANIM_DURATION) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      _fireCanvasAnimId = null;
      return;
    }

    const progress = elapsed / ANIM_DURATION;
    let intensity = 1;
    if (progress < 0.15) intensity = progress / 0.15;
    else if (progress > 0.65) intensity = 1 - (progress - 0.65) / 0.35;

    const W = canvas.width;
    const H = canvas.height;

    // 1. Procedural Living Flame Tongues on the Logo Icon (Level 1 style) for ALL levels!
    for (let k = 0; k < 6; k++) {
      const lx = (ox || W / 2) + (Math.random() - 0.5) * 40;
      const ly = (oy || H / 2) + (Math.random() - 0.5) * 40;
      const lvx = (Math.random() - 0.5) * 2.5;
      const lvy = -2.8 - Math.random() * 4.5;
      const lbaseR = 18 + Math.random() * 24;
      const llife = 18 + Math.random() * 20;
      fireParticles.push(new FireTongue(lx, ly, lvx, lvy, llife, lbaseR));
      if (Math.random() > 0.5) {
        fireParticles.push(new FloatingEmber(lx, ly, lvx * 0.8, lvy * 0.8 - 1));
      }
    }

    if (lvl === 7) {
      const edges = ['top', 'bottom', 'left', 'right'];
      for (let i = 0; i < 30; i++) {
        edges.forEach(edge => {
          let x, y, vx, vy;
          if (edge === 'bottom') { x = Math.random() * W; y = H + 10; vx = (Math.random() - 0.5) * 2; vy = -4 - Math.random() * 9; }
          else if (edge === 'top') { x = Math.random() * W; y = -10; vx = (Math.random() - 0.5) * 2; vy = 4 + Math.random() * 9; }
          else if (edge === 'left') { x = -10; y = Math.random() * H; vx = 4 + Math.random() * 9; vy = (Math.random() - 0.5) * 3 - 1; }
          else { x = W + 10; y = Math.random() * H; vx = -4 - Math.random() * 9; vy = (Math.random() - 0.5) * 3 - 1; }
          fireParticles.push(new FireTongue(x, y, vx, vy, 25 + Math.random() * 25, 35 + Math.random() * 45));
        });
      }
    } else {
      for (let i = 0; i < profile.spawn; i++) {
        const x = Math.random() * W;
        const y = H + 10;
        const vx = (Math.random() - 0.5) * 2.2;
        const vy = profile.minVy + Math.random() * (profile.maxVy - profile.minVy);
        const life = profile.minLife + Math.random() * (profile.maxLife - profile.minLife);
        const baseR = profile.minR + Math.random() * (profile.maxR - profile.minR);
        fireParticles.push(new FireTongue(x, y, vx, vy, life, baseR));
        if (Math.random() > 0.6) {
          fireParticles.push(new FloatingEmber(x, y, vx * 0.8, vy * 0.8 - 1));
        }
      }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = isDark ? 'source-over' : 'screen';

    for (let i = fireParticles.length - 1; i >= 0; i--) {
      const p = fireParticles[i];
      p.update();
      if (p.life >= p.maxLife) {
        fireParticles.splice(i, 1);
      } else {
        p.draw(ctx, intensity);
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    _fireCanvasAnimId = requestAnimationFrame(frameLoop);
  }

  _fireCanvasAnimId = requestAnimationFrame(frameLoop);
}

function burstFlame(btnElement, tier) {
  if (!btnElement) return;
  const lvl = tier.level || 1;

  // 1. Logo Flame Flare Animation on the Button in ALL levels!
  btnElement.classList.remove('flame-bursting');
  void btnElement.offsetWidth;
  btnElement.classList.add('flame-bursting');

  playFlameIgniteSound(lvl);

  const rect = btnElement.getBoundingClientRect();
  const ox = rect.left + rect.width / 2;
  const oy = rect.top + rect.height / 2;

  let overlay = document.getElementById('flameVfxOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'flameVfxOverlay';
    overlay.className = 'flame-vfx-layer';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = '';

  // 2. Logo Flame Sparks erupting directly around the Logo Button in ALL levels!
  spawnVfxSparks(overlay, ox, oy, 14, tier.glow, 52, 0.75);

  // 3. Silky smooth 60FPS GPU Procedural Screen Fire from the bottom
  launchProceduralScreenFire(lvl, tier, ox, oy);

  document.body.classList.remove('screen-shake-sm', 'screen-shake-md', 'screen-shake-heavy');
  void document.body.offsetWidth;

  if (lvl === 2) {
    document.body.classList.add('screen-shake-sm');
    spawnVfxRing(overlay, ox, oy, tier.glow, 280);
  } else if (lvl === 3) {
    document.body.classList.add('screen-shake-sm');
    spawnVfxRing(overlay, ox, oy, tier.glow, 420);
  } else if (lvl === 4) {
    document.body.classList.add('screen-shake-sm');
    spawnVfxRing(overlay, ox, oy, tier.glow, 560);
    spawnVfxRing(overlay, ox, oy, '#d1fae5', 380);
  } else if (lvl === 5) {
    document.body.classList.add('screen-shake-md');
    spawnVfxRing(overlay, ox, oy, tier.glow, 680);
    spawnVfxRing(overlay, ox, oy, '#f3e8ff', 460);
  } else if (lvl === 6) {
    document.body.classList.add('screen-shake-md');
    const flash = document.createElement('div');
    flash.className = 'vfx-solar-flash';
    overlay.appendChild(flash);
    spawnVfxRing(overlay, ox, oy, '#ffffff', 800);
  } else if (lvl === 7) {
    document.body.classList.add('screen-shake-heavy');
    const burn = document.createElement('div');
    burn.className = 'vfx-screen-burn';
    overlay.appendChild(burn);
    spawnVfxRing(overlay, ox, oy, '#7c3aed', 880);
  }

  setTimeout(() => {
    document.body.classList.remove('screen-shake-sm', 'screen-shake-md', 'screen-shake-heavy');
  }, 900);
}

function handleFlameBtnClick(e) {
  e.stopPropagation();
  const streak = currentStreak();
  const tier = getStreakTier(streak);
  const btn = e.currentTarget || document.getElementById('homeStreakFlameBtn');
  burstFlame(btn, tier);
}

function handleStreakCardClick(e) {
  const streak = currentStreak();
  const tier = getStreakTier(streak);
  const btn = document.getElementById('homeStreakFlameBtn');
  burstFlame(btn, tier);
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

/* ============================================================
   INTERNATIONALIZATION (i18n)
   ============================================================ */
/* ============================================================
   VECTOR SYMBOL SYSTEM (No Emojis)
   ============================================================ */
const ICONS = {
  home: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  book: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  cards: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="16" height="15" rx="2" ry="2"/><path d="M6 3h12a2 2 0 0 1 2 2v14"/></svg>',
  pencil: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  chart: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>',
  globe: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  moon: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  sun: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  reading: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  writing: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
  random: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
  simulation: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  lightning: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  timer: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  document: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  target: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  check: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  cross: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  speaker: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  flame: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.63-1.88-3.07-2.5-4.5-.62 1.43-2.5 2.87-2.5 4.5z"/><path d="M12 2c5.5 5 8 9.5 8 13.5a8 8 0 1 1-16 0C4 11.5 6.5 7 12 2z"/></svg>',
  award: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
  arrowRight: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  plus: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  lightbulb: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></svg>',
  play: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  refresh: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  exit: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  search: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  trash: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  eye: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  send: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  sparkle: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
  tag: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  emptyDoc: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
  warning: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  close: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  fcHard: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  fcMed: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  fcEasy: '<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  
  // Custom Multi-Color Vector SVGs for Mode Selection
  modeReading: `<svg class="mode-svg-colored" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mode1Grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#48dbfb"/>
        <stop offset="100%" stop-color="#2e86de"/>
      </linearGradient>
    </defs>
    <rect x="5" y="4" width="22" height="24" rx="4" fill="url(#mode1Grad)"/>
    <rect x="8" y="7" width="16" height="18" rx="2" fill="#ffffff" fill-opacity="0.2"/>
    <path d="M12 11h8M16 11v10M13 15h6M11 21h10" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  modeWriting: `<svg class="mode-svg-colored" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mode2Grad" x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#feca57"/>
        <stop offset="100%" stop-color="#ff9f43"/>
      </linearGradient>
      <linearGradient id="mode2Pen" x1="18" y1="4" x2="23" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#ff6b6b"/>
        <stop offset="100%" stop-color="#ee5253"/>
      </linearGradient>
    </defs>
    <rect x="4" y="6" width="20" height="20" rx="4" fill="#ffffff" fill-opacity="0.12"/>
    <rect x="6" y="8" width="16" height="16" rx="3" stroke="#feca57" stroke-width="1.5" stroke-dasharray="2 2"/>
    <g transform="rotate(-30 20 14)">
      <rect x="18" y="4" width="5" height="15" rx="1.5" fill="url(#mode2Pen)"/>
      <polygon points="18,19 23,19 20.5,24" fill="#222f3e"/>
    </g>
  </svg>`,
  
  modeRandom: `<svg class="mode-svg-colored" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mode3Grad1" x1="4" y1="8" x2="20" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#1dd1a1"/>
        <stop offset="100%" stop-color="#10ac84"/>
      </linearGradient>
      <linearGradient id="mode3Grad2" x1="14" y1="12" x2="28" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#a55eea"/>
        <stop offset="100%" stop-color="#5f27cd"/>
      </linearGradient>
    </defs>
    <rect x="4" y="8" width="15" height="15" rx="3.5" fill="url(#mode3Grad1)"/>
    <circle cx="8" cy="12" r="1.3" fill="#ffffff"/>
    <circle cx="15" cy="19" r="1.3" fill="#ffffff"/>
    <circle cx="11.5" cy="15.5" r="1.3" fill="#ffffff"/>
    <rect x="13" y="11" width="15" height="15" rx="3.5" fill="url(#mode3Grad2)" fill-opacity="0.95"/>
    <circle cx="17" cy="15" r="1.2" fill="#ffffff"/>
    <circle cx="24" cy="22" r="1.2" fill="#ffffff"/>
  </svg>`
};

const I18N = {
  "id": {
    "nav_home": "Beranda",
    "nav_list": "Materi",
    "nav_flashcard": "Flashcard",
    "nav_quiz": "Quiz",
    "nav_stats": "Statistik",
    "furi_on": "Furigana ON",
    "furi_off": "Furigana OFF",
    "furi_title": "Toggle Furigana",
    "theme_title": "Ganti tema",
    "lang_title": "Ganti Bahasa (Saat ini: Bahasa Indonesia)",
    "toast_furi_on": "Furigana ditampilkan",
    "toast_furi_off": "Furigana disembunyikan",
    "toast_lang": "Bahasa diubah ke Bahasa Indonesia",
    "greet_morning": "Selamat pagi",
    "greet_afternoon": "Selamat siang",
    "greet_evening": "Selamat sore",
    "greet_night": "Selamat malam",
    "home_sub": "Ayo lanjutkan menghafal kosakata hari ini",
    "home_streak_title": "Streak Belajar",
    "streak_tap_hint": "Ketuk api untuk mengobarkan!",
    "home_streak_days": "{0} Hari",
    "home_best_streak": "Rekor terbaik",
    "home_best_streak_val": "{0} hari",
    "home_n4": "Kosakata N4",
    "home_n3": "Kosakata N3",
    "home_n2": "Kosakata N2",
    "home_learned": "Sudah dipelajari",
    "home_mastered": "Sudah dikuasai",
    "home_progress_title": "Progress Belajar",
    "home_progress_desc": "{0} dari {1} kosakata sudah kamu pelajari.",
    "home_mastered_desc": "{0} kosakata sudah dikuasai ({1}%).",
    "home_reading_title": "Sistem Bacaan (読解)",
    "home_reading_desc": "Baca artikel kontekstual dengan deteksi kotoba otomatis",
    "tab_vocab": "Daftar Kosakata",
    "tab_reading": "Sistem Bacaan (読解)",
    "list_title": "Daftar Kosakata",
    "list_sub": "{0} kata · JLPT N4, N3 & N2",
    "search_placeholder": "Cari kanji, furigana, atau arti...",
    "filter_all": "Semua",
    "status_filter_title": "Pilih status hafalan",
    "status_all": "Semua Status",
    "status_mastered": "Dikuasai",
    "status_almost": "Hampir",
    "status_half": "Setengah",
    "status_quarter": "Seperempat",
    "status_notyet": "Belum",
    "filter_label_prefix": "Filter",
    "found_vocab_count": "{0} kosakata ditemukan{1}",
    "no_vocab_found": "Tidak ada kosakata yang cocok.",
    "loading_more": "Memuat lebih banyak...",
    "all_vocab_shown": "Semua kosakata telah ditampilkan",
    "reading_title": "Sistem Bacaan (読解)",
    "reading_sub": "Latih pemahaman kotoba dalam konteks cerita bersambung & artikel",
    "reading_filter_custom": "Teks Mandiri",
    "reading_search_ph": "Cari judul cerita, topik, atau kata...",
    "reading_series_stat": "<strong>{0}</strong> Seri ({1} Bab)",
    "reading_done_stat": "<strong id=\"globalDoneCount\">{0}</strong> dipelajari",
    "reading_expand_all": "Buka Semua",
    "reading_collapse_all": "Tutup Semua",
    "custom_reading_title": "Tempel / Masukkan Teks Jepang Sendiri",
    "custom_reading_desc": "Salin artikel berita (seperti NHK Easy), dialog anime, atau bacaan apa saja. Sistem akan mendeteksi kosakata yang cocok dengan database Kotoba dan mengelompokkannya sesuai level pilihanmu.",
    "custom_level_label": "Tentukan Level Target Teks Ini:",
    "custom_level_general": "Umum",
    "custom_title_ph": "Judul Teks (opsional, contoh: Berita NHK Hari Ini)",
    "custom_content_ph": "Tempel teks bahasa Jepang di sini...",
    "custom_submit_btn": "Analisis & Mulai Membaca",
    "custom_empty": "Belum ada teks mandiri yang disimpan. Masukkan teks di atas untuk mulai membaca!",
    "reading_no_match": "Tidak ada bacaan yang cocok dengan filter atau pencarian.",
    "reading_completed_label": "dipelajari",
    "chapter_prefix": "Bab {0}",
    "kotoba_detected_label": "{0} Kotoba",
    "mark_done_title": "Tandai sudah dipelajari",
    "mark_undone_title": "Tandai belum dipelajari",
    "delete_custom_title": "Hapus teks ini",
    "confirm_delete_custom": "Yakin ingin menghapus teks mandiri ini?",
    "toast_enter_text": "Silakan masukkan teks Jepang terlebih dahulu",
    "toast_custom_saved": "Teks berhasil disimpan sebagai level {0}!",
    "reader_back_series": "Kembali ke Daftar Seri Bacaan",
    "reader_series_prefix": "Seri",
    "reader_chapter_part": "Bab {0}",
    "reader_matches_chip": "{0} Kotoba Cocok di Database",
    "reader_done_chip": "Sudah Dipelajari",
    "reader_mark_done_chip": "Tandai Selesai",
    "reader_toggle_trans": "Tampilkan Terjemahan Bahasa Indonesia",
    "reader_hide_trans": "Sembunyikan Terjemahan",
    "reader_trans_heading": "Terjemahan Cerita / Artikel:",
    "reader_finish_title": "Selesai Membaca Bab Ini?",
    "reader_finish_desc": "Tandai progresmu agar tercatat rapi di daftar seri dan bab materi.",
    "reader_finish_done": "Bab Selesai Dipelajari",
    "reader_finish_action": "Tandai Selesai Dibaca",
    "reader_prev_chapter": "Bab Sebelumnya",
    "reader_next_chapter": "Bab Berikutnya",
    "reader_vocab_in_reading": "Kosakata dalam Bacaan Ini ({0})",
    "fc_title": "Flashcard",
    "fc_sub": "Active recall · ketuk kartu untuk membalik",
    "fc_empty": "Belum ada kartu.",
    "fc_card_counter": "Kartu {0} / {1}",
    "fc_hint_front": "Ketuk untuk lihat arti",
    "fc_hint_back": "Seberapa baik kamu mengingatnya?",
    "fc_hard": "Sulit",
    "fc_med": "Lumayan",
    "fc_easy": "Mudah",
    "fc_done_title": "Sesi selesai!",
    "fc_done_desc": "Kamu mereview <b>{0}</b> kartu. Mantap, terus pertahankan!",
    "fc_btn_again": "Sesi baru",
    "fc_btn_home": "Beranda",
    "quiz_title": "Kuis JLPT Moji-Goi",
    "quiz_sub": "Latihan soal resmi standar JLPT: 漢字読み & 表記",
    "quiz_setup_material": "Pilih Level Kosakata",
    "quiz_setup_count": "Jumlah Soal",
    "quiz_choose_mode": "Pilih Format Soal",
    "quiz_mode_1_name": "Kanji → Arti",
    "quiz_mode_1_desc": "Tebak cara baca kata bergaris bawah dari 4 pilihan menjebak",
    "quiz_mode_2_name": "Kanji → Furigana",
    "quiz_mode_2_desc": "Tebak penulisan kanji yang tepat dari bentuk kanji yang mirip",
    "quiz_mode_3_name": "Arti → Kanji",
    "quiz_mode_3_desc": "Latihan seimbang antara Soal 1 & 2 seperti ujian aslinya",
    "quiz_mode_4_name": "Random Campuran",
    "quiz_mode_4_desc": "Campuran semua tipe",
    "quiz_exit_btn": "Keluar Kuis",
    "quiz_confirm_exit": "Yakin ingin membatalkan kuis ini?",
    "quiz_counter": "Soal {0} / {1}",
    "quiz_next_btn": "Soal Berikutnya →",
    "quiz_result_btn": "Lihat Hasil",
    "quiz_score_pct": "{0}% Benar",
    "quiz_msg_high": "Luar biasa! Kamu menguasai sesi ini.",
    "quiz_msg_med": "Bagus! Terus berlatih.",
    "quiz_msg_low": "Tetap semangat, ulangi lagi ya!",
    "quiz_retry_btn": "Main Lagi",
    "quiz_menu_btn": "Pilih Mode",
    "quiz_tag_arti": "Apa arti kata ini?",
    "quiz_tag_furi": "Bagaimana cara bacanya?",
    "quiz_tag_kanji": "Kanji mana yang tepat?",
    "quiz_not_enough": "Kosakata belum cukup untuk quiz.",
    "stats_title": "Statistik",
    "stats_sub": "Pantau perkembangan belajarmu",
    "stats_total_learned": "Total dipelajari",
    "stats_total_mastered": "Total dikuasai",
    "stats_notyet": "Belum dipelajari",
    "stats_accuracy": "Akurasi review",
    "stats_mastery_summary": "Ringkasan Penguasaan",
    "stats_donut_learned": "dipelajari",
    "stats_legend_mastered": "Dikuasai",
    "stats_legend_learned": "Dipelajari",
    "stats_legend_notyet": "Belum",
    "stats_progress_per_level": "Progress per Level",
    "stats_word_unit": "kata",
    "stats_mastered_sub": "Dikuasai",
    "stats_activity_title": "Aktivitas Review (Klik untuk detail)",
    "stats_total_reviews": "Total review",
    "stats_correct_answers": "Jawaban benar",
    "stats_wrong_answers": "Jawaban salah",
    "stats_streak_label": "Streak (hari)",
    "stats_lang_section": "Pengaturan Bahasa Aplikasi",
    "stats_lang_label": "Bahasa Tampilan Antarmuka (UI)",
    "stats_lang_sub": "Ubah semua teks aplikasi ke Bahasa Jepang (arti kotoba tetap Bahasa Indonesia)",
    "stats_reset_btn": "Reset semua progress",
    "stats_reset_confirm": "Yakin ingin menghapus semua progress belajar? Tindakan ini tidak bisa dibatalkan.",
    "stats_reset_toast": "Progress direset",
    "stats_no_wrong_tip": "Belum ada kosakata yang dijawab salah! Lanjutkan belajar untuk menguji pemahaman.",
    "stats_detail_correct_title": "Daftar Jawaban Benar",
    "stats_detail_correct_sub": "Kosakata yang dijawab benar setidaknya satu kali",
    "stats_detail_wrong_title": "Daftar Jawaban Salah",
    "stats_detail_wrong_sub": "Kosakata yang dijawab salah setidaknya satu kali",
    "stats_detail_back": "← Kembali ke Statistik",
    "stats_detail_practice_btn": "Latihan Kata Salah",
    "stats_detail_no_data": "Belum ada data review.",
    "label_correct": "Benar",
    "label_wrong": "Salah",
    "label_resolved": "Terselesaikan ✔",
    "wrong_quiz_title": "Latihan Kosakata Salah",
    "wrong_quiz_sub": "Prioritas kata yang sering salah",
    "wrong_quiz_exit_btn": "Keluar Latihan",
    "wrong_quiz_confirm_exit": "Yakin ingin membatalkan latihan ini?",
    "wrong_quiz_note": "Latihan ini bersifat mandiri dan tidak mengubah progress belajar utama Anda.",
    "wrong_quiz_retry": "Latih Lagi",
    "wrong_quiz_back": "Kembali",
    "wrong_quiz_msg_high": "Luar biasa! Kamu menguasai sesi latihan ini.",
    "wrong_quiz_msg_med": "Bagus! Terus latih kata yang salah.",
    "wrong_quiz_msg_low": "Tetap semangat, ulangi latihan lagi ya!",
    "modal_mastered": "Dikuasai (Box {0})",
    "modal_learning": "Sedang Dipelajari (Box {0})",
    "modal_not_learned": "Belum Dipelajari",
    "modal_speak_title": "Dengarkan pengucapan",
    "modal_close_title": "Tutup",
    "quiz_tab_mini": "Mini Latihan",
    "quiz_tab_sim": "Simulasi JLPT",
    "quiz_sim_title": "Simulasi Ujian Resmi Moji-Goi",
    "quiz_sim_desc": "Simulasi ujian lengkap 25 soal dengan batas waktu resmi 20 menit. Dilengkapi penilaian standar JLPT (Lulus/Tidak Lulus) dan pembahasan detail.",
    "quiz_sim_q_count": "25 Soal",
    "quiz_sim_time": "20 Menit",
    "quiz_sim_pass_std": "Standar Lulus",
    "quiz_start_sim": "Mulai Simulasi Ujian",
    "quiz_start_mini": "Mulai Mini Latihan",
    "quiz_mode_1_title": "Cara Baca Kanji (漢字読み)",
    "quiz_mode_1_sub": "Kanji Hiragana",
    "quiz_mode_2_title": "Penulisan Kanji (表記)",
    "quiz_mode_2_sub": "Hiragana Kanji",
    "quiz_mode_3_title": "Acak Campuran (総合特訓)",
    "quiz_mode_3_sub": "Campuran Soal 1 & 2",
    "quiz_mondai_1_title": "問題１ 漢字の読み方",
    "quiz_mondai_1_inst": "＿＿＿の言葉の読み方として最もよいものを、１・２・３・４から一つ選びなさい。",
    "quiz_mondai_2_title": "問題２ 表記（漢字の書き方）",
    "quiz_mondai_2_inst": "＿＿＿の言葉を漢字で書くとき、最もよいものを、１・２・３・４から一つ選びなさい。",
    "quiz_kaisetsu_badge_ok": "Benar",
    "quiz_kaisetsu_badge_ng": "Salah",
    "quiz_kaisetsu_meaning": "Arti",
    "quiz_kaisetsu_tip": "Poin Jebakan JLPT",
    "quiz_sim_pass": "【 LULUS 】",
    "quiz_sim_fail": "【 TIDAK LULUS 】",
    "quiz_sim_pass_msg": "Selamat! Kamu berhasil mencapai standar kelulusan JLPT (60%+).",
    "quiz_sim_fail_msg": "Sedikit lagi! Pelajari kembali pembahasan soal-soal yang salah di bawah ini.",
    "quiz_show_review": "Lihat Pembahasan Lengkap",
    "quiz_hide_review": "Tutup Pembahasan",
    "quiz_time_spent": "Waktu Pengerjaan",
    "quiz_total_score": "Skor Total",
    "quiz_m1_score": "Nilai Soal 1 (読み)",
    "quiz_m2_score": "Nilai Soal 2 (表記)",
    "quiz_sim_again": "Ulangi Simulasi",
    "quiz_badge_m1": "【問題１】",
    "quiz_badge_m2": "【問題２】",
    "quiz_badge_m3": "【総合】",
    "quiz_sim_select_lv": "Pilih Level Ujian",
    "quiz_sim_total_q": "Total Soal",
    "quiz_sim_time_limit": "Batas Waktu",
    "quiz_sim_unit_q": "Soal",
    "modal_ext_level": "Bacaan",
    "modal_ext_status": "Kosakata Teks",
    "modal_ext_loading": "Mencari arti...",
    "modal_ext_fail": "Gagal memuat arti (offline)"
  },
  "ja": {
    "nav_home": "ホーム",
    "nav_list": "単語一覧",
    "nav_flashcard": "暗記カード",
    "nav_quiz": "クイズ",
    "nav_stats": "統計",
    "furi_on": "ふりがな ON",
    "furi_off": "ふりがな OFF",
    "furi_title": "ふりがな表示切替",
    "theme_title": "テーマ切替",
    "lang_title": "言語切替 (現在: 日本語)",
    "toast_furi_on": "ふりがなを表示しました",
    "toast_furi_off": "ふりがなを非表示にしました",
    "toast_lang": "言語を日本語に切り替えました",
    "greet_morning": "おはようございます",
    "greet_afternoon": "こんにちは",
    "greet_evening": "こんばんは",
    "greet_night": "こんばんは",
    "home_sub": "今日も語彙学習を続けましょう",
    "home_streak_title": "連続学習記録",
    "streak_tap_hint": "タップして炎を点火する！",
    "home_streak_days": "{0}日",
    "home_best_streak": "最高記録",
    "home_best_streak_val": "{0}日",
    "home_n4": "N4 単語",
    "home_n3": "N3 単語",
    "home_n2": "N2 単語",
    "home_learned": "学習済み",
    "home_mastered": "習得済み",
    "home_progress_title": "学習進捗",
    "home_progress_desc": "全{1}語中 {0}語 を学習しました。",
    "home_mastered_desc": "{0}語 を完全にマスターしました ({1}%)。",
    "home_reading_title": "長文読解システム (読解)",
    "home_reading_desc": "単語自動ハイライト付きで文章・記事を読む",
    "tab_vocab": "単語一覧",
    "tab_reading": "長文読解 (読解)",
    "list_title": "単語一覧",
    "list_sub": "全{0}語 · JLPT N4, N3 & N2",
    "search_placeholder": "漢字、ふりがな、意味を検索...",
    "filter_all": "すべて",
    "status_filter_title": "学習状態で絞り込み",
    "status_all": "すべての状態",
    "status_mastered": "習得済み",
    "status_almost": "あと少し",
    "status_half": "半分習得",
    "status_quarter": "学習初期",
    "status_notyet": "未学習",
    "filter_label_prefix": "絞り込み",
    "found_vocab_count": "{0}件の単語が見つかりました{1}",
    "no_vocab_found": "一致する単語が見つかりません。",
    "loading_more": "さらに読み込み中...",
    "all_vocab_shown": "すべての単語を表示しました",
    "reading_title": "長文読解システム (読解)",
    "reading_sub": "連載ストーリーや記事の文脈で語彙力を鍛える",
    "reading_filter_custom": "独自テキスト",
    "reading_search_ph": "タイトル、トピック、キーワードを検索...",
    "reading_series_stat": "<strong>{0}</strong> シリーズ ({1}話)",
    "reading_done_stat": "<strong id=\"globalDoneCount\">{0}</strong> 読了済み",
    "reading_expand_all": "すべて開く",
    "reading_collapse_all": "すべて閉じる",
    "custom_reading_title": "独自テキストの入力 / 貼り付け",
    "custom_reading_desc": "ニュース記事（NHK Easy等）やアニメのセリフなど、好きなテキストを貼り付けてください。アプリ内の単語データベースと自動照合・ハイライトします。",
    "custom_level_label": "対象レベルを選択:",
    "custom_level_general": "一般",
    "custom_title_ph": "タイトル（任意、例: 今日のNHKニュース）",
    "custom_content_ph": "ここに日本語の文章を貼り付けてください...",
    "custom_submit_btn": "解析して読み始める",
    "custom_empty": "保存された独自テキストはありません。上のフォームから文章を入力してください！",
    "reading_no_match": "条件に一致する読解テキストがありません。",
    "reading_completed_label": "読了",
    "chapter_prefix": "第{0}話",
    "kotoba_detected_label": "{0} 語",
    "mark_done_title": "読了にする",
    "mark_undone_title": "未読に戻す",
    "delete_custom_title": "このテキストを削除",
    "confirm_delete_custom": "この独自テキストを削除してもよろしいですか？",
    "toast_enter_text": "日本語のテキストを入力してください",
    "toast_custom_saved": "テキストを {0} レベルとして保存しました！",
    "reader_back_series": "読解シリーズ一覧に戻る",
    "reader_series_prefix": "シリーズ",
    "reader_chapter_part": "第{0}話",
    "reader_matches_chip": "{0} 語がデータベースと一致",
    "reader_done_chip": "読了済み",
    "reader_mark_done_chip": "読了にする",
    "reader_toggle_trans": "インドネシア語訳を表示",
    "reader_hide_trans": "インドネシア語訳を非表示",
    "reader_trans_heading": "文章・記事の翻訳 (インドネシア語):",
    "reader_finish_title": "このチャプターを読み終わりましたか？",
    "reader_finish_desc": "進捗を記録して、シリーズ学習の記録を更新しましょう。",
    "reader_finish_done": "読了済み",
    "reader_finish_action": "読了として記録",
    "reader_prev_chapter": "前のチャプター",
    "reader_next_chapter": "次のチャプター",
    "reader_vocab_in_reading": "この文章に出てくる単語 ({0})",
    "fc_title": "暗記カード",
    "fc_sub": "アクティブリコール · タップして裏返す",
    "fc_empty": "カードがありません。",
    "fc_card_counter": "カード {0} / {1}",
    "fc_hint_front": "タップして意味を表示",
    "fc_hint_back": "記憶の定着度はどのくらい？",
    "fc_hard": "難しい",
    "fc_med": "まあまあ",
    "fc_easy": "簡単",
    "fc_done_title": "セッション終了！",
    "fc_done_desc": "<b>{0}</b> 枚のカードを復習しました。素晴らしい集中力です！",
    "fc_btn_again": "もう一度",
    "fc_btn_home": "ホームへ",
    "quiz_title": "JLPT文字・語彙クイズ",
    "quiz_sub": "JLPT本試験形式 · 漢字読み＆表記特訓",
    "quiz_setup_material": "出題レベル",
    "quiz_setup_count": "問題数",
    "quiz_choose_mode": "出題形式を選択",
    "quiz_mode_1_name": "漢字 → 意味",
    "quiz_mode_1_desc": "下線部の言葉の正しい読み方を4択から選ぶ問題",
    "quiz_mode_2_name": "漢字 → ふりがな",
    "quiz_mode_2_desc": "ひらがなに合う正しい漢字を4択から選ぶ問題",
    "quiz_mode_3_name": "意味 → 漢字",
    "quiz_mode_3_desc": "漢字読みと表記をバランス良くランダム出題",
    "quiz_mode_4_name": "ランダム総合",
    "quiz_mode_4_desc": "すべての形式からランダム出題",
    "quiz_exit_btn": "クイズ中断",
    "quiz_confirm_exit": "クイズを中断してもよろしいですか？",
    "quiz_counter": "問 {0} / {1}",
    "quiz_next_btn": "次の問題 →",
    "quiz_result_btn": "結果を見る",
    "quiz_score_pct": "正答率 {0}%",
    "quiz_msg_high": "素晴らしい！この調子でマスターしましょう。",
    "quiz_msg_med": "ナイス！反復練習を続けましょう。",
    "quiz_msg_low": "諦めずに、もう一度挑戦しましょう！",
    "quiz_retry_btn": "再挑戦",
    "quiz_menu_btn": "モード選択へ",
    "quiz_tag_arti": "この単語の意味は？",
    "quiz_tag_furi": "正しい読み方は？",
    "quiz_tag_kanji": "正しい漢字は？",
    "quiz_not_enough": "クイズを出題する単語が足りません。",
    "stats_title": "学習統計",
    "stats_sub": "日々の学習進捗と成果を確認",
    "stats_total_learned": "学習済み単語",
    "stats_total_mastered": "習得済み単語",
    "stats_notyet": "未学習単語",
    "stats_accuracy": "復習正答率",
    "stats_mastery_summary": "習得状況の概要",
    "stats_donut_learned": "学習中",
    "stats_legend_mastered": "習得済み",
    "stats_legend_learned": "学習中",
    "stats_legend_notyet": "未学習",
    "stats_progress_per_level": "レベル別進捗",
    "stats_word_unit": "語",
    "stats_mastered_sub": "習得",
    "stats_activity_title": "復習アクティビティ（クリックで詳細）",
    "stats_total_reviews": "総復習回数",
    "stats_correct_answers": "正解数",
    "stats_wrong_answers": "不正解数",
    "stats_streak_label": "連続日数",
    "stats_lang_section": "アプリ言語設定",
    "stats_lang_label": "表示言語 (UI)",
    "stats_lang_sub": "アプリの表示言語を日本語に切り替えます（単語の意味はインドネシア語のままです）",
    "stats_reset_btn": "すべての進捗をリセット",
    "stats_reset_confirm": "すべての学習進捗をリセットしますか？この操作は取り消せません。",
    "stats_reset_toast": "進捗をリセットしました",
    "stats_no_wrong_tip": "まだ間違えた単語はありません！この調子で学習を続けましょう。",
    "stats_detail_correct_title": "正解単語リスト",
    "stats_detail_correct_sub": "1回以上正解した単語",
    "stats_detail_wrong_title": "不正解・苦手単語リスト",
    "stats_detail_wrong_sub": "1回以上間違えたことのある単語",
    "stats_detail_back": "← 統計に戻る",
    "stats_detail_practice_btn": "苦手単語を特訓",
    "stats_detail_no_data": "復習データがまだありません。",
    "label_correct": "正解",
    "label_wrong": "不正解",
    "label_resolved": "克服済 ✔",
    "wrong_quiz_title": "苦手単語集中特訓",
    "wrong_quiz_sub": "間違えたことのある単語を重点的に復習",
    "wrong_quiz_exit_btn": "特訓を終了",
    "wrong_quiz_confirm_exit": "特訓を中断してもよろしいですか？",
    "wrong_quiz_note": "この特訓は自主練習用で、メインの進捗データには影響しません。",
    "wrong_quiz_retry": "もう一度特訓",
    "wrong_quiz_back": "戻る",
    "wrong_quiz_msg_high": "素晴らしい！この特訓セッションをマスターしました。",
    "wrong_quiz_msg_med": "ナイス！苦手な単語を克服していきましょう。",
    "wrong_quiz_msg_low": "諦めずに、繰り返し練習しましょう！",
    "modal_mastered": "習得済み (Box {0})",
    "modal_learning": "学習中 (Box {0})",
    "modal_not_learned": "未学習",
    "modal_speak_title": "発音を聞く",
    "modal_close_title": "閉じる",
    "quiz_tab_mini": "ミニ特訓",
    "quiz_tab_sim": "JLPT模擬試験",
    "quiz_sim_title": "本番形式 文字・語彙 模擬試験",
    "quiz_sim_desc": "本番と同じ25問（漢字読み13問＋表記12問）を20分で解く本番形式テスト。合否判定と詳細な解説付き。",
    "quiz_sim_q_count": "25問",
    "quiz_sim_time": "制限時間 20分",
    "quiz_sim_pass_std": "合格基準",
    "quiz_start_sim": "模擬試験を開始",
    "quiz_start_mini": "特訓スタート",
    "quiz_mode_1_title": "漢字の読み方",
    "quiz_mode_1_sub": "漢字 ひらがな",
    "quiz_mode_2_title": "表記（漢字の書き方）",
    "quiz_mode_2_sub": "ひらがな 漢字",
    "quiz_mode_3_title": "総合・ランダム出題",
    "quiz_mode_3_sub": "問題１・問題２の混合",
    "quiz_mondai_1_title": "問題１ 漢字の読み方",
    "quiz_mondai_1_inst": "＿＿＿の言葉の読み方として最もよいものを、１・２・３・４から一つ選びなさい。",
    "quiz_mondai_2_title": "問題２ 表記（漢字の書き方）",
    "quiz_mondai_2_inst": "＿＿＿の言葉を漢字で書くとき、最もよいものを、１・２・３・４から一つ選びなさい。",
    "quiz_kaisetsu_badge_ok": "正解",
    "quiz_kaisetsu_badge_ng": "不正解",
    "quiz_kaisetsu_meaning": "意味",
    "quiz_kaisetsu_tip": "JLPT攻略ポイント",
    "quiz_sim_pass": "【 合 格 】",
    "quiz_sim_fail": "【 不合格 】",
    "quiz_sim_pass_msg": "おめでとうございます！JLPT合格基準点（60%以上）をクリアしました。",
    "quiz_sim_fail_msg": "残念！基準点まであと少しです。解説リストを確認して復習しましょう。",
    "quiz_show_review": "詳細解説を表示",
    "quiz_hide_review": "詳細解説を閉じる",
    "quiz_time_spent": "所要時間",
    "quiz_total_score": "総合得点",
    "quiz_m1_score": "問題１（漢字読み）",
    "quiz_m2_score": "問題２（表記）",
    "quiz_sim_again": "模擬試験を再挑戦",
    "quiz_badge_m1": "【問題１】",
    "quiz_badge_m2": "【問題２】",
    "quiz_badge_m3": "【総合】",
    "quiz_sim_select_lv": "受験レベルを選択",
    "quiz_sim_total_q": "総問題数",
    "quiz_sim_time_limit": "制限時間",
    "quiz_sim_unit_q": "問",
    "modal_ext_level": "読解",
    "modal_ext_status": "本文の単語",
    "modal_ext_loading": "意味を取得中...",
    "modal_ext_fail": "意味の取得に失敗しました"
  }
};

function t(key, ...args) {
  const lang = State.settings && State.settings.lang ? State.settings.lang : 'ja';
  let str = (I18N[lang] && I18N[lang][key]) || (I18N['id'] && I18N['id'][key]) || key;
  if (typeof str === 'function') return str(...args);
  if (args.length) {
    args.forEach((val, i) => {
      str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), val != null ? val : '');
    });
  }
  return str;
}

/* ---------- Furigana / Theme / Language ---------- */
function applySettings() {
  const lang = State.settings.lang || 'ja';
  document.documentElement.setAttribute('lang', lang);
  document.body.classList.toggle('furi-on', State.settings.furigana);
  document.body.classList.toggle('furi-off', !State.settings.furigana);
  document.documentElement.setAttribute('data-theme', State.settings.theme);

  const ft = document.getElementById('furiToggle');
  if (ft) {
    ft.textContent = State.settings.furigana ? t('furi_on') : t('furi_off');
    ft.title = t('furi_title');
  }

  const tt = document.getElementById('themeToggle');
  if (tt) {
    tt.innerHTML = State.settings.theme === 'dark' ? ICONS.moon : ICONS.sun;
    tt.title = t('theme_title');
  }

  const lt = document.getElementById('langToggle');
  const ll = document.getElementById('langLabel');
  if (lt && ll) {
    ll.textContent = lang === 'ja' ? '日本語' : 'ID';
    lt.title = t('lang_title');
  }

  // Update bottom nav labels
  const navMap = {
    home: t('nav_home'),
    list: t('nav_list'),
    flashcard: t('nav_flashcard'),
    quiz: t('nav_quiz'),
    stats: t('nav_stats')
  };
  document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
    const key = btn.dataset.nav;
    if (navMap[key]) {
      const lbl = btn.querySelector('.nav-lbl');
      if (lbl) lbl.textContent = navMap[key];
    }
  });

  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.setAttribute('content', State.settings.theme === 'dark' ? '#0f1115' : '#6c5ce7');
}

function toggleFurigana() {
  State.settings.furigana = !State.settings.furigana;
  save(K.settings, State.settings);
  applySettings();
  toast(State.settings.furigana ? t('toast_furi_on') : t('toast_furi_off'));
}

function toggleTheme() {
  State.settings.theme = State.settings.theme === 'dark' ? 'light' : 'dark';
  save(K.settings, State.settings);
  applySettings();
}

function toggleLang(targetLang) {
  if (targetLang) {
    State.settings.lang = targetLang;
  } else {
    State.settings.lang = State.settings.lang === 'ja' ? 'id' : 'ja';
  }
  save(K.settings, State.settings);
  applySettings();
  toast(t('toast_lang'));
  navigate(State.route);
}

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

const JA_PARTICLES = ['から', 'まで', 'より', 'ので', 'のに', 'けど', 'の', 'は', 'が', 'を', 'に', 'で', 'と', 'へ', 'も', 'か', 'や', 'ね', 'よ'];
const JA_PUNCTUATION = /[、。！？\s「」『』（）…—\-\–\n\r\t・]/;
const jaWordSegmenter = (typeof Intl !== 'undefined' && Intl.Segmenter)
  ? new Intl.Segmenter('ja', { granularity: 'word' })
  : null;

function renderSpanInner(para, start, end, unitAt) {
  let res = '';
  let k = start;
  while (k < end) {
    const u = unitAt ? unitAt.get(k) : null;
    if (u && u[1] <= end) {
      res += `<ruby>${esc(para.slice(u[0], u[1]))}<rt>${esc(u[2])}</rt></ruby>`;
      k = u[1];
    } else {
      res += esc(para[k]);
      k++;
    }
  }
  return res;
}

function getSpanFurigana(para, start, end, unitAt) {
  if (!unitAt) return '';
  let furi = '';
  let k = start;
  let hasKanji = false;
  while (k < end) {
    const u = unitAt.get(k);
    if (u && u[1] <= end) {
      furi += u[2];
      hasKanji = true;
      k = u[1];
    } else {
      furi += para[k];
      k++;
    }
  }
  return hasKanji ? furi : '';
}

function renderParagraphWithHighlights(paragraph, furiStr, highlight = true) {
  const units = furiStr ? decodeFuri(furiStr) : [];
  const unitAt = new Map();
  for (const u of units) unitAt.set(u[0], u);

  let out = '';
  let i = 0;
  while (i < paragraph.length) {
    // 1. Target vocabulary from website database (Signature Highlight)
    if (highlight) {
      const vm = matchVocabAt(paragraph, i);
      if (vm) {
        const end = i + vm.key.length;
        const inner = renderSpanInner(paragraph, i, end, unitAt);
        out += `<span class="dokkai-word is-target" data-vid="${vm.v.id}" title="${esc(vm.v.kanji)}: ${esc(vm.v.arti)}">${inner}</span>`;
        i = end;
        continue;
      }
    }

    // 2. Punctuation and spaces (Plain non-clickable text)
    const c = paragraph[i];
    if (JA_PUNCTUATION.test(c)) {
      out += esc(c);
      i += 1;
      continue;
    }

    // 3. Segment next chunk until punctuation or target vocabulary
    let j = i + 1;
    while (j < paragraph.length) {
      if (JA_PUNCTUATION.test(paragraph[j])) break;
      if (highlight && matchVocabAt(paragraph, j)) break;
      j++;
    }

    const chunk = paragraph.slice(i, j);

    if (jaWordSegmenter) {
      for (const s of jaWordSegmenter.segment(chunk)) {
        if (!s.isWordLike) {
          out += esc(s.segment);
          continue;
        }
        let w = s.segment;
        let matchedP = null;
        for (const p of JA_PARTICLES) {
          if (w.length > p.length && w.endsWith(p)) {
            const root = w.slice(0, -p.length);
            if (/[\u4e00-\u9faf\u30a0-\u30ff]/.test(root) || root.length >= 2) {
              matchedP = p;
              break;
            }
          }
        }

        if (matchedP) {
          const root = w.slice(0, -matchedP.length);
          const rootStart = i + s.index;
          const rootEnd = rootStart + root.length;
          const f1 = getSpanFurigana(paragraph, rootStart, rootEnd, unitAt);
          out += `<span class="dokkai-word is-plain" data-word="${esc(root)}" data-furi="${esc(f1)}" title="${esc(root)}">${renderSpanInner(paragraph, rootStart, rootEnd, unitAt)}</span>`;

          const pStart = rootEnd;
          const pEnd = pStart + matchedP.length;
          out += `<span class="dokkai-word is-plain" data-word="${esc(matchedP)}" title="${esc(matchedP)}">${renderSpanInner(paragraph, pStart, pEnd, unitAt)}</span>`;
        } else {
          const wStart = i + s.index;
          const wEnd = wStart + w.length;
          const f = getSpanFurigana(paragraph, wStart, wEnd, unitAt);
          out += `<span class="dokkai-word is-plain" data-word="${esc(w)}" data-furi="${esc(f)}" title="${esc(w)}">${renderSpanInner(paragraph, wStart, wEnd, unitAt)}</span>`;
        }
      }
    } else {
      const f = getSpanFurigana(paragraph, i, j, unitAt);
      out += `<span class="dokkai-word is-plain" data-word="${esc(chunk)}" data-furi="${esc(f)}" title="${esc(chunk)}">${renderSpanInner(paragraph, i, j, unitAt)}</span>`;
    }

    i = j;
  }

  return out;
}

function renderParagraphVocabOnly(paragraph) {
  return renderParagraphWithHighlights(paragraph, null, true);
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
    statusHTML = `<span class="kb-status-chip" style="color:var(--green)"><span class="ico">${ICONS.award}</span> ${t('modal_mastered', box)}</span>`;
  } else if (isLearned(v.id)) {
    statusHTML = `<span class="kb-status-chip" style="color:var(--orange)"><span class="ico">${ICONS.book}</span> ${t('modal_learning', box)}</span>`;
  } else {
    statusHTML = `<span class="kb-status-chip" style="color:var(--text-dim)"><span class="ico">${ICONS.sparkle}</span> ${t('modal_not_learned')}</span>`;
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
        <button class="kb-icon-btn" id="kbSpeakBtn" title="${t('modal_speak_title')}">${ICONS.speaker}</button>
        <button class="kb-icon-btn" id="kbCloseBtn" title="${t('modal_close_title')}">${ICONS.close}</button>
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

const EXT_WORD_CACHE = new Map();

function openExternalWordModal(word, furi) {
  if (!word) return;

  const modalBackdrop = document.getElementById('kotobaModalBackdrop');
  const modalContent = document.getElementById('kotobaModalContent');
  if (!modalBackdrop || !modalContent) return;

  const showFuri = (furi && furi !== word) ? furi : '';

  modalContent.innerHTML = `
    <div class="kb-header">
      <div class="kb-kanji-wrap">
        ${showFuri ? `<span class="kb-furigana">${esc(showFuri)}</span>` : ''}
        <div class="kb-kanji">${esc(word)}</div>
      </div>
      <div class="kb-actions">
        <button class="kb-icon-btn" id="kbSpeakBtn" title="${t('modal_speak_title')}">${ICONS.speaker}</button>
        <button class="kb-icon-btn" id="kbCloseBtn" title="${t('modal_close_title')}">${ICONS.close}</button>
      </div>
    </div>
    <div class="kb-meaning" id="kbExternalMeaning">
      <span class="kb-loading">${ICONS.refresh} ${t('modal_ext_loading')}</span>
    </div>
    <div class="kb-footer">
      <span class="kb-level-badge lv reading-badge">${t('modal_ext_level')}</span>
      <span class="kb-status-chip" style="color:var(--text-dim)">
        <span class="ico">${ICONS.sparkle}</span> ${t('modal_ext_status')}
      </span>
    </div>
  `;

  modalContent.querySelector('#kbSpeakBtn').onclick = () => speakJapanese(word);
  modalContent.querySelector('#kbCloseBtn').onclick = closeKotobaModal;
  modalBackdrop.classList.add('show');

  // Check in-memory cache
  if (EXT_WORD_CACHE.has(word)) {
    const cached = EXT_WORD_CACHE.get(word);
    const area = document.getElementById('kbExternalMeaning');
    if (area) area.textContent = cached;
    return;
  }

  // Fetch translation via Google Translate gtx API
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=id&dt=t&q=' + encodeURIComponent(word);
  fetch(url)
    .then(r => r.json())
    .then(data => {
      const arti = (data && data[0] && data[0][0] && data[0][0][0]) || 'Arti tidak ditemukan';
      EXT_WORD_CACHE.set(word, arti);
      const area = document.getElementById('kbExternalMeaning');
      if (area) area.textContent = arti;
    })
    .catch(() => {
      const area = document.getElementById('kbExternalMeaning');
      if (area) area.innerHTML = `<span style="color:var(--orange)">${t('modal_ext_fail')}</span>`;
    });
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
  const tier = getStreakTier(streak);
  const isJa = (State.settings && State.settings.lang === 'ja');

  app.innerHTML = `
    <div class="view">
      <h1 class="page-title">${esc(greet())}<span class="sub">${t('home_sub')}</span></h1>

      <section>
        <div class="streak ${tier.cardClass}" id="homeStreakCard" onclick="handleStreakCardClick(event)">
          <button type="button" class="streak-flame-btn" id="homeStreakFlameBtn" title="${t('streak_tap_hint')}" onclick="handleFlameBtnClick(event)">
            ${renderStreakFlameSVG(tier, 52, 'home')}
          </button>
          <div style="flex:1">
            <div class="big">${t('home_streak_days', streak)}</div>
            <div class="cap">${t('home_streak_title')}</div>
          </div>
          <div class="right">${t('home_best_streak')}<br><b style="font-size:18px">${t('home_best_streak_val', State.streak.best || 0)}</b></div>
        </div>
      </section>

      <section>
        <div class="grid stat-grid-levels">
          <div class="stat clickable" data-stat="N4"><span class="ico"><span class="lv-dot n4"></span></span><div class="val">${n4}</div><div class="lbl">${t('home_n4')}</div></div>
          <div class="stat clickable" data-stat="N3"><span class="ico"><span class="lv-dot n3"></span></span><div class="val">${n3}</div><div class="lbl">${t('home_n3')}</div></div>
          <div class="stat clickable" data-stat="N2"><span class="ico"><span class="lv-dot n2"></span></span><div class="val">${n2}</div><div class="lbl">${t('home_n2')}</div></div>
        </div>
        <div class="grid stat-grid-summary" style="margin-top:12px">
          <div class="stat clickable" data-stat="learned"><span class="ico">${ICONS.book}</span><div class="val">${learned}</div><div class="lbl">${t('home_learned')}</div></div>
          <div class="stat clickable" data-stat="mastered"><span class="ico">${ICONS.award}</span><div class="val">${mastered}</div><div class="lbl">${t('home_mastered')}</div></div>
        </div>
      </section>

      <section>
        <div class="card progress-card">
          <div class="ring" style="--p:${pct}"><span>${pct}%</span></div>
          <div class="info">
            <h3>${t('home_progress_title')}</h3>
            <p>${t('home_progress_desc', learned, total)}</p>
            <p style="margin-top:4px">${t('home_mastered_desc', mastered, total ? Math.round(mastered / total * 100) : 0)}</p>
          </div>
        </div>
      </section>

      <section style="margin-top:14px">
        <div class="card reading-banner-card" id="homeReadingBanner" style="cursor:pointer; display:flex; align-items:center; justify-content:space-between; padding:18px 20px; background:linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.1)); border:1px solid rgba(99,102,241,0.25);">
          <div style="display:flex; align-items:center; gap:14px;">
            <span class="home-stat-ico">${ICONS.book}</span>
            <div>
              <div style="font-weight:700; font-size:16px; color:var(--text);">${t('home_reading_title')}</div>
              <div style="font-size:13px; color:var(--text-soft); margin-top:2px;">${t('home_reading_desc')}</div>
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
function greet() {
  const h = new Date().getHours();
  const lang = State.settings && State.settings.lang ? State.settings.lang : 'ja';
  if (lang === 'ja') {
    if (h < 11) return t('greet_morning');
    if (h < 18) return t('greet_afternoon');
    return t('greet_evening');
  }
  if (h < 11) return t('greet_morning');
  if (h < 15) return t('greet_afternoon');
  if (h < 19) return t('greet_evening');
  return t('greet_night');
}

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
  let triggerText = `${t('status_mastered')} : ${stats.dikuasai}`;
  if (ListState.filter === 'hampir') triggerText = `${t('status_almost')} : ${stats.hampir}`;
  else if (ListState.filter === 'setengah') triggerText = `${t('status_half')} : ${stats.setengah}`;
  else if (ListState.filter === 'seperempat') triggerText = `${t('status_quarter')} : ${stats.seperempat}`;
  else if (ListState.filter === 'belum') triggerText = `${t('status_notyet')} : ${stats.belum}`;
  else if (ListState.filter === 'all') triggerText = `${t('status_all')} : ${stats.dikuasai + stats.hampir + stats.setengah + stats.seperempat + stats.belum}`;

  app.innerHTML = `
    <div class="view">
      <div class="materi-tabs">
        <button class="materi-tab active" data-mtab="vocab"><span class="tab-ico">${ICONS.book}</span> ${t('tab_vocab')}</button>
        <button class="materi-tab" data-mtab="reading"><span class="tab-ico">${ICONS.document}</span> ${t('tab_reading')}</button>
      </div>

      <h1 class="page-title">${t('list_title')}<span class="sub">${t('list_sub', State.vocab.length)}</span></h1>

      <div class="toolbar">
        <div class="search">
          <span class="si">${ICONS.search}</span>
          <input id="q" type="text" placeholder="${t('search_placeholder')}" value="${esc(ListState.q)}" />
        </div>
        <div class="toolbar-controls">
          <div class="segmented" id="lvFilter">
            <button data-lv="all" class="${ListState.level === 'all' ? 'active' : ''}">${t('filter_all')}</button>
            <button data-lv="N4" class="${ListState.level === 'N4' ? 'active' : ''}">N4</button>
            <button data-lv="N3" class="${ListState.level === 'N3' ? 'active' : ''}">N3</button>
            <button data-lv="N2" class="${ListState.level === 'N2' ? 'active' : ''}">N2</button>
          </div>

          <!-- DROPDOWN COUNTER TEPAT DI SAMPING SEMUA/N4/N3 -->
          <div class="counter-dropdown" id="counterDropdown">
            <button class="counter-dropdown-trigger" id="cdTrigger" type="button" title="${t('status_filter_title')}">
              <span>${triggerText}</span>
              <svg class="cdd-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div class="counter-dropdown-menu" id="cdMenu">
              <div class="cdd-item ${ListState.filter === 'all' ? 'active' : ''}" data-filter="all">
                <span class="cdd-lbl">${t('status_all')}</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.dikuasai + stats.hampir + stats.setengah + stats.seperempat + stats.belum}</span>
              </div>
              <div class="cdd-divider"></div>
              <div class="cdd-item ${ListState.filter === 'dikuasai' ? 'active' : ''}" data-filter="dikuasai">
                <span class="cdd-lbl">${t('status_mastered')}</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.dikuasai}</span>
              </div>
              <div class="cdd-item ${ListState.filter === 'hampir' ? 'active' : ''}" data-filter="hampir">
                <span class="cdd-lbl">${t('status_almost')}</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.hampir}</span>
              </div>
              <div class="cdd-item ${ListState.filter === 'setengah' ? 'active' : ''}" data-filter="setengah">
                <span class="cdd-lbl">${t('status_half')}</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.setengah}</span>
              </div>
              <div class="cdd-item ${ListState.filter === 'seperempat' ? 'active' : ''}" data-filter="seperempat">
                <span class="cdd-lbl">${t('status_quarter')}</span>
                <span class="cdd-sep">:</span>
                <span class="cdd-num">${stats.seperempat}</span>
              </div>
              <div class="cdd-item ${ListState.filter === 'belum' ? 'active' : ''}" data-filter="belum">
                <span class="cdd-lbl">${t('status_notyet')}</span>
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
    if (ListState.filter === 'dikuasai') filterName = ` · ${t('filter_label_prefix')}: ${t('status_mastered')}`;
    else if (ListState.filter === 'hampir') filterName = ` · ${t('filter_label_prefix')}: ${t('status_almost')}`;
    else if (ListState.filter === 'setengah') filterName = ` · ${t('filter_label_prefix')}: ${t('status_half')}`;
    else if (ListState.filter === 'seperempat') filterName = ` · ${t('filter_label_prefix')}: ${t('status_quarter')}`;
    else if (ListState.filter === 'belum') filterName = ` · ${t('filter_label_prefix')}: ${t('status_notyet')}`;
    note.textContent = t('found_vocab_count', res.length, filterName);
  }
  const slice = res.slice(0, ListState.limit);
  target.innerHTML = slice.length
    ? slice.map(cardHTML).join('')
    : `<div class="empty" style="grid-column:1/-1"><div class="big">${ICONS.search}</div>${t('no_vocab_found')}</div>`;
  const more = document.getElementById('more');
  if (!more) return;

  if (listObserver) {
    listObserver.disconnect();
    listObserver = null;
  }

  if (res.length > ListState.limit) {
    more.innerHTML = `<div style="padding:20px 0;color:var(--text-dim);font-size:13.5px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px">
      <span class="spinner"></span>
      ${t('loading_more')}
    </div>`;
    listObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        ListState.limit += 60;
        renderList();
      }
    }, { rootMargin: '200px' });
    listObserver.observe(more);
  } else {
    more.innerHTML = res.length > 0 ? `<div style="padding:20px 0;color:var(--text-dim);font-size:13.5px;font-weight:600">${t('all_vocab_shown')}</div>` : '';
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
        <button class="materi-tab" data-mtab="vocab"><span class="tab-ico">${ICONS.book}</span> ${t('tab_vocab')}</button>
        <button class="materi-tab active" data-mtab="reading"><span class="tab-ico">${ICONS.document}</span> ${t('tab_reading')}</button>
      </div>

      <h1 class="page-title">${t('reading_title')}<span class="sub">${t('reading_sub')}</span></h1>

      <div class="toolbar" style="margin-bottom:12px;">
        <div class="segmented" id="readingLvFilter">
          <button data-rlv="all" class="${ReadingState.level === 'all' ? 'active' : ''}">${t('filter_all')}</button>
          <button data-rlv="N4" class="${ReadingState.level === 'N4' ? 'active' : ''}">N4</button>
          <button data-rlv="N3" class="${ReadingState.level === 'N3' ? 'active' : ''}">N3</button>
          <button data-rlv="N2" class="${ReadingState.level === 'N2' ? 'active' : ''}">N2</button>
          <button data-rlv="custom" class="${ReadingState.level === 'custom' ? 'active' : ''}">${t('reading_filter_custom')}</button>
        </div>
      </div>

      <!-- Controls & Search Bar -->
      <div class="reading-controls-bar">
        <div class="reading-search-box">
          <span class="reading-search-ico">${ICONS.search}</span>
          <input type="text" id="readingSearchInput" placeholder="${t('reading_search_ph')}" value="${esc(ReadingState.searchQuery || '')}" />
          ${ReadingState.searchQuery ? '<button type="button" class="reading-search-clear" id="readingSearchClear">✕</button>' : ''}
        </div>
        <div class="reading-overview-row">
          <div class="reading-overview-stat">
            <span>${t('reading_series_stat', seriesList.length, totalChapters)}</span>
            <span class="overview-sep">•</span>
            <span style="color:var(--green-text,#34d399);">${t('reading_done_stat', totalCompleted)}</span>
          </div>
          <div class="reading-expand-btns">
            <button type="button" class="reading-ctrl-btn" id="expandAllSeriesBtn">${t('reading_expand_all')}</button>
            <button type="button" class="reading-ctrl-btn" id="collapseAllSeriesBtn">${t('reading_collapse_all')}</button>
          </div>
        </div>
      </div>

      ${ReadingState.level === 'custom' ? `
        <div class="custom-reading-box">
          <div style="font-weight:700; font-size:16px; color:var(--text); display:flex; align-items:center; gap:8px;">
            <span>${ICONS.pencil}</span> ${t('custom_reading_title')}
          </div>
          <p style="font-size:13.5px; color:var(--text-soft); margin:0;">
            ${t('custom_reading_desc')}
          </p>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <label style="font-size:13px; font-weight:600; color:var(--text-soft);">${t('custom_level_label')}</label>
            <div class="segmented" id="customLevelSelect" style="max-width:320px;">
              <button type="button" data-clv="N4" class="clv-btn">N4</button>
              <button type="button" data-clv="N3" class="clv-btn active">N3</button>
              <button type="button" data-clv="N2" class="clv-btn">N2</button>
              <button type="button" data-clv="Mandiri" class="clv-btn">${t('custom_level_general')}</button>
            </div>
          </div>
          <input type="text" class="input-title" id="customTitle" placeholder="${t('custom_title_ph')}" />
          <textarea id="customContent" placeholder="${t('custom_content_ph')}"></textarea>
          <button class="submit-btn" id="customSubmitBtn">
            <span>${ICONS.send}</span> ${t('custom_submit_btn')}
          </button>
        </div>
      ` : ''}

      <div class="reading-series-container" id="readingSeriesContainer">
        ${seriesList.length > 0 ? seriesList.map(s => renderSeriesCard(s, !!q)).join('') : (
          ReadingState.level === 'custom'
            ? `<div style="margin-top:20px; color:var(--text-dim); text-align:center; font-size:14px; padding:30px 10px;">${t('custom_empty')}</div>`
            : `<div class="empty"><div class="big">${ICONS.emptyDoc}</div>${t('reading_no_match')}</div>`
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
        toast(t('toast_enter_text'));
        return;
      }
      let title = (app.querySelector('#customTitle').value || '').trim();
      if (!title) title = (State.settings.lang === 'ja' ? '独自テキスト #' : 'Teks Mandiri #') + (customList.length + 1);

      const paragraphs = content.split(/\n+/).map(p => p.trim()).filter(Boolean);
      const customItem = {
        id: 'c-' + Date.now(),
        level: chosenLevel,
        title: title,
        titleArti: (State.settings.lang === 'ja' ? 'ユーザー作成テキスト (' : 'Teks Mandiri Pengguna (') + chosenLevel + ')',
        paragraphs: paragraphs,
        translations: [],
        isCustom: true
      };

      State.customReadings = [customItem, ...State.customReadings];
      save(K.customReadings, State.customReadings);
      toast(t('toast_custom_saved', chosenLevel));
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
      if (confirm(t('confirm_delete_custom'))) {
        State.customReadings = (State.customReadings || []).filter(x => x.id !== delId);
        save(K.customReadings, State.customReadings);
        toast(State.settings.lang === 'ja' ? '独自テキストを削除しました' : 'Teks mandiri berhasil dihapus');
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
        const sName = r.series || (r.isCustom ? (State.settings.lang === 'ja' ? 'マイテキスト' : 'Teks Mandiri Saya') : (State.settings.lang === 'ja' ? '追加読解' : 'Bacaan Tambahan'));
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
            <span class="progress-num">${completedCount}/${totalCount} ${t('reading_completed_label')}</span>
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
  const babNum = r.seriesPart ? t('chapter_prefix', r.seriesPart) : '';

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
        <span class="subbab-pill" title="${t('kotoba_detected_label', count)}">
          ${t('kotoba_detected_label', count)}
        </span>
        <button type="button" class="subbab-check-circle ${isDone ? 'completed' : ''}" data-circle-rid="${esc(r.id)}" title="${isDone ? t('mark_undone_title') : t('mark_done_title')}">
          ${isDone ? '✓' : ''}
        </button>
        ${r.isCustom ? `
          <button type="button" class="custom-del-btn" data-delid="${esc(r.id)}" title="${t('delete_custom_title')}">${ICONS.trash}</button>
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
        ← ${t('reader_back_series')}
      </button>

      <div class="reader-title-box">
        ${r.series ? `
          <div class="reading-card-series" style="font-size:13px; margin-bottom:6px;">
            <span>${ICONS.book}</span> ${t('reader_series_prefix')}: ${esc(r.series)}${r.seriesPart ? ` (${t('reader_chapter_part', r.seriesPart)})` : ''}
          </div>
        ` : ''}
        <div class="reader-title">${renderParagraphWithHighlights(r.title, r.titleFuri, false)}</div>
        ${r.titleArti ? `<div class="reader-subtitle">${esc(r.titleArti)}</div>` : ''}
        <div class="reader-badge-row">
          <span class="lv ${levelBadgeClass}">${esc(r.level)}</span>
          <span class="reading-card-chip">${t('reader_matches_chip', detected.count)}</span>
          <button type="button" class="reader-complete-toggle-btn ${isDone ? 'completed' : ''}" id="detailCompleteToggleBtn">
            <span>${isDone ? t('reader_done_chip') : t('reader_mark_done_chip')}</span>
          </button>
        </div>
      </div>

      <div class="reader-article">
        ${r.paragraphs.map((p, idx) => `<p class="reader-paragraph">${renderParagraphWithHighlights(p, r.furi ? r.furi[idx] : null, true)}</p>`).join('')}
      </div>

      ${hasTranslations ? `
        <button class="reader-trans-toggle" id="transToggleBtn">
          <span>${ICONS.eye}</span> <span id="transToggleText">${t('reader_toggle_trans')}</span>
        </button>
        <div class="reader-trans-box" id="transBox">
          <div style="font-weight:700; font-size:15px; margin-bottom:12px; color:var(--text);">${t('reader_trans_heading')}</div>
          ${r.translations.map(t => `<p class="reader-trans-p">${esc(t)}</p>`).join('')}
        </div>
      ` : ''}

      <div class="reader-finish-banner">
        <div class="finish-info">
          <div class="finish-title">${t('reader_finish_title')}</div>
          <div class="finish-desc">${t('reader_finish_desc')}</div>
        </div>
        <button type="button" class="finish-action-btn ${isDone ? 'completed' : ''}" id="readerFinishBtn">
          ${isDone ? t('reader_finish_done') : t('reader_finish_action')}
        </button>
      </div>

      ${(prevChapter || nextChapter) ? `
        <div class="reader-nav-row">
          ${prevChapter ? `
            <button class="reader-nav-btn" id="prevChapterBtn">
              <span>←</span> ${t('reader_prev_chapter')}
            </button>
          ` : '<div></div>'}
          ${nextChapter ? `
            <button class="reader-nav-btn" id="nextChapterBtn" style="background:var(--primary); color:#ffffff; border-color:var(--primary);">
              ${t('reader_next_chapter')}: ${esc(nextChapter.title.slice(0, 15))}... <span>→</span>
            </button>
          ` : ''}
        </div>
      ` : ''}

      ${detected.words.length > 0 ? `
        <div class="reader-vocab-summary">
          <h3>
            <span>${ICONS.tag}</span> ${t('reader_vocab_in_reading', detected.words.length)}
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
      detailToggleBtn.innerHTML = `<span>${done ? t('reader_done_chip') : t('reader_mark_done_chip')}</span>`;
    }
    if (finishBtn) {
      finishBtn.classList.toggle('completed', done);
      finishBtn.innerHTML = done ? t('reader_finish_done') : t('reader_finish_action');
    }
  };

  const handleToggle = () => {
    const done = toggleReadingCompleted(r.id);
    updateDetailCompleteUI(done);
    toast(done ? (State.settings.lang === 'ja' ? '読了に設定しました！ ✓' : 'Bab ditandai selesai dipelajari! ✓') : (State.settings.lang === 'ja' ? '未読に戻しました' : 'Status bab diubah ke belum selesai'));
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
        ? `<span>${ICONS.eyeOff}</span> ${t('reader_hide_trans')}`
        : `<span>${ICONS.eye}</span> ${t('reader_toggle_trans')}`;
    };
  }

  // Click on any dokkai-word (target vocab in list or plain word in text)
  app.querySelectorAll('.dokkai-word').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      if (el.dataset.vid) {
        openKotobaModal(el.dataset.vid);
      } else if (el.dataset.word) {
        openExternalWordModal(el.dataset.word, el.dataset.furi);
      }
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
  if (!FC.queue.length) { app.innerHTML = emptyState(t('fc_empty')); return; }
  if (FC.idx >= FC.queue.length) { renderFlashDone(app); return; }
  const v = FC.queue[FC.idx];
  app.innerHTML = `
    <div class="view fc-wrap">
      <h1 class="page-title">${t('fc_title')}<span class="sub">${t('fc_sub')}</span></h1>
      <div class="toolbar" style="justify-content:center">
        <div class="segmented" id="fcLv">
          <button data-lv="all" class="${FC.level === 'all' ? 'active' : ''}">${t('filter_all')}</button>
          <button data-lv="N4" class="${FC.level === 'N4' ? 'active' : ''}">N4</button>
          <button data-lv="N3" class="${FC.level === 'N3' ? 'active' : ''}">N3</button>
          <button data-lv="N2" class="${FC.level === 'N2' ? 'active' : ''}">N2</button>
        </div>
      </div>
      <div class="fc-top"><span>${t('fc_card_counter', FC.idx + 1, FC.queue.length)}</span><span>${v.level}</span></div>
      <div class="flashcard ${FC.flipped ? 'flipped' : ''}" id="card">
        <div class="inner">
          <div class="face front">
            <span class="lv ${v.level}">${v.level}</span>
            <div class="kanji">${esc(v.kanji)}</div>
            <div class="furi">${esc(v.furigana)}</div>
            <div class="hint">${t('fc_hint_front')}</div>
          </div>
          <div class="face back">
            <div class="arti">${esc(v.arti)}</div>
            <div class="sub">${esc(v.kanji)} · ${esc(v.furigana)}</div>
            <div class="hint" style="color:rgba(255,255,255,.7)">${t('fc_hint_back')}</div>
          </div>
        </div>
      </div>
      <div class="fc-buttons ${FC.flipped ? '' : 'locked'}" id="fcBtns">
        <button class="fc-btn hard" data-q="hard"><span class="e">😵</span>${t('fc_hard')}</button>
        <button class="fc-btn med" data-q="medium"><span class="e">🤔</span>${t('fc_med')}</button>
        <button class="fc-btn easy" data-q="easy"><span class="e">😎</span>${t('fc_easy')}</button>
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
        <div class="big" style="color:var(--primary);">${ICONS.award}</div>
        <h2>${t('fc_done_title')}</h2>
        <p>${t('fc_done_desc', FC.done)}</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn" id="again">${t('fc_btn_again')}</button>
          <button class="btn ghost" id="home">${t('fc_btn_home')}</button>
        </div>
      </div>
    </div>`;
  app.querySelector('#again').onclick = () => { startFlashcards(FC.level); renderFlashcard(app); };
  app.querySelector('#home').onclick = () => navigate('home');
}

/* ============================================================
   JLPT MOJI-GOI ENGINE (Kanji-to-Hiragana & Hiragana-to-Kanji)
   ============================================================ */

const KANJI_LOOKALIKES = {
  // Radicals & Lookalikes: 氵(sanzui), 亻(nimben), 彳(gyoninben), 扌(tehen), 言(gonben), 糸(itohen), 禾(nogihen), 艹(kusakanmuri), etc.
  '側': ['測', '則', '侍', '偵'],
  '測': ['側', '則', '深', '浸'],
  '則': ['側', '測', '貝', '負'],
  '内': ['肉', '円', '丙', '定'],
  '肉': ['内', '円', '丙'],
  '待': ['持', '特', '侍', '詩', '時'],
  '持': ['待', '特', '侍', '掛', '技'],
  '特': ['待', '持', '物', '牧'],
  '時': ['持', '待', '晴', '照'],
  '詩': ['待', '持', '誠', '話'],
  '経': ['軽', '計', '怪', '径', '茎'],
  '軽': ['経', '較', '輪', '載'],
  '径': ['経', '軽', '役', '往'],
  '済': ['清', '斉', '滞', '決'],
  '清': ['晴', '静', '情', '精', '請'],
  '晴': ['清', '暗', '暑', '昭', '暖'],
  '静': ['清', '晴', '争', '浄'],
  '情': ['清', '晴', '精', '請', '惰'],
  '精': ['清', '情', '晴', '積'],
  '請': ['清', '情', '読', '諸'],
  '検': ['験', '険', '剣', '倹'],
  '験': ['検', '険', '験', '騎'],
  '険': ['検', '験', '陰', '陥'],
  '練': ['連', '凍', '陳', '錬', '棟'],
  '連': ['練', '運', '達', '進'],
  '運': ['連', '軍', '遠', '巡'],
  '治': ['沿', '活', '池', '台', '始'],
  '沿': ['治', '活', '池', '沼'],
  '活': ['治', '話', '括', '刮'],
  '案': ['安', '委', '宴', '按'],
  '安': ['案', '妥', '字', '室'],
  '定': ['実', '室', '正', '宣'],
  '注': ['主', '住', '柱', '往'],
  '住': ['注', '主', '往', '仕'],
  '主': ['注', '住', '王', '玉'],
  '意': ['音', '億', '章', '心', '憶'],
  '音': ['意', '暗', '韻', '声'],
  '理': ['埋', '野', '里', '現', '環'],
  '現': ['理', '規', '視', '親', '見'],
  '規': ['現', '視', '親', '見', '則'],
  '視': ['現', '規', '親', '示', '祝'],
  '親': ['新', '視', '規', '親'],
  '新': ['親', '析', '斬', '折'],
  '買': ['貸', '貝', '質', '貿'],
  '貸': ['買', '貨', '賃', '質', '袋'],
  '質': ['貿', '賃', '責', '賛'],
  '貿': ['質', '貸', '賀', '貨'],
  '賃': ['貸', '任', '質', '資'],
  '資': ['姿', '諮', '賃', '次'],
  '姿': ['資', '女', '委'],
  '題': ['提', '顔', '頭', '願'],
  '提': ['題', '堤', '手', '指'],
  '顔': ['頭', '願', '額'],
  '頭': ['顔', '題', '首'],
  '願': ['顔', '頭', '源', '顧'],
  '説': ['脱', '悦', '設', '鋭'],
  '設': ['説', '役', '投', '没'],
  '役': ['設', '投', '段', '使'],
  '投': ['役', '設', '打', '拾'],
  '議': ['儀', '犠', '義', '講'],
  '儀': ['議', '犠', '義', '様'],
  '選': ['送', '洗', '退', '逆'],
  '送': ['選', '逆', '迷', '返'],
  '結': ['給', '約', '続', '組'],
  '給': ['拾', '結', '絵', '合'],
  '約': ['的', '釣', '紀', '紅'],
  '束': ['求', '東', '乗', '刺'],
  '続': ['読', '統', '結', '売'],
  '成': ['城', '減', '誠', '盛'],
  '城': ['成', '域', '誠', '坊'],
  '誠': ['成', '城', '言', '諸'],
  '政': ['正', '整', '改', '攻'],
  '正': ['政', '定', '止'],
  '整': ['政', '正', '整備', '製'],
  '制': ['製', '割', '刑', '判'],
  '製': ['制', '整', '裁', '表'],
  '割': ['害', '制', '憲', '轄'],
  '害': ['割', '憲', '割', '周'],
  '消': ['削', '硝', '宵', '相'],
  '削': ['消', '利', '刷', '列'],
  '備': ['修', '優', '催', '徳'],
  '準': ['准', '進', '清', '備'],
  '求': ['救', '球', '求', '束'],
  '救': ['求', '球', '敷', '赦'],
  '球': ['救', '求', '理', '環'],
  '指': ['脂', '手', '拾', '措'],
  '拾': ['給', '指', '合', '捨'],
  '折': ['近', '祈', '断', '新'],
  '近': ['折', '辺', '返', '退'],
  '退': ['追', '選', '送', '透'],
  '追': ['退', '迫', '遣', '造'],
  '徒': ['従', '得', '役', '走'],
  '従': ['徒', '律', '得', '御'],
  '波': ['破', '被', '彼', '皮'],
  '破': ['波', '被', '皮', '板'],
  '被': ['波', '破', '彼', '補'],
  '彼': ['波', '被', '後', '役'],
  '直': ['植', '置', '値', '真'],
  '植': ['直', '値', '置', '格'],
  '置': ['直', '植', '置', '署'],
  '値': ['直', '植', '借', '健'],
  '借': ['惜', '措', '昔', '錯'],
  '惜': ['借', '情', '慣', '怖'],
  '訪': ['防', '坊', '妨', '放'],
  '防': ['訪', '坊', '妨', '房'],
  '坊': ['訪', '防', '坊', '城'],
  '妨': ['訪', '防', '坊', '妙'],
  '放': ['訪', '防', '政', '牧'],
  '論': ['輪', '輸', '倫', '諭'],
  '輪': ['論', '輸', '軽', '転'],
  '輸': ['輪', '論', '愉', '癒'],
  '転': ['伝', '転', '軽', '車'],
  '伝': ['転', '芸', '会', '任'],
  '修': ['条', '脩', '健', '備'],
  '復': ['複', '腹', '後', '履'],
  '複': ['復', '腹', '被', '補'],
  '腹': ['復', '複', '胸', '勝'],
  '技': ['枝', '抜', '投', '扱'],
  '枝': ['技', '枯', '材', '柱'],
  '抜': ['技', '枝', '友', '投'],
  '補': ['捕', '浦', '舗', '被'],
  '捕': ['補', '浦', '描', '投'],
  '招': ['紹', '昭', '照', '超'],
  '紹': ['招', '昭', '照', '給'],
  '昭': ['照', '招', '紹', '明'],
  '照': ['昭', '照', '熱', '黒'],
  '深': ['探', '測', '清', '湖'],
  '探': ['深', '採', '指', '授'],
  '授': ['受', '探', '採', '援'],
  '受': ['授', '愛', '妥'],
  '採': ['菜', '彩', '探', '授'],
  '菜': ['採', '菓', '茶', '草'],
  '換': ['喚', '損', '操', '抱'],
  '喚': ['換', '呼', '吸', '叫'],
  '損': ['換', '員', '慎', '偵'],
  '操': ['燥', '繰', '藻', '保'],
  '燥': ['操', '爆', '燃', '燥'],
  '構': ['講', '購', '溝', '構'],
  '講': ['構', '購', '議', '詳'],
  '購': ['構', '講', '資', '質'],
  '職': ['識', '織', '耳', '聴'],
  '識': ['職', '織', '語', '誌'],
  '織': ['職', '識', '綿', '絹'],
  '移': ['秒', '秋', '科', '程'],
  '秒': ['移', '秒', '砂', '妙'],
  '科': ['料', '科', '程', '種'],
  '料': ['科', '料理', '斗', '斜'],
  '種': ['重', '種', '程', '移'],
  '程': ['種', '程', '科', '和'],
  '急': ['悪', '隠', '息', '心'],
  '宿': ['縮', '館', '夜', '客'],
  '縮': ['宿', '細', '絹', '約'],
  '果': ['課', '菓', '巣', '某'],
  '課': ['果', '菓', '調', '話'],
  '菓': ['果', '課', '葉', '花'],
  '落': ['格', '各', '客', '絡'],
  '格': ['落', '各', '客', '校'],
  '各': ['格', '落', '名', '冬'],
  '客': ['容', '格', '各', '空'],
  '絡': ['落', '格', '給', '各'],
  '寒': ['塞', '賽', '完', '宴'],
  '暑': ['署', '著', '諸', '晴'],
  '署': ['暑', '著', '諸', '置'],
  '著': ['暑', '署', '諸', '若'],
  '諸': ['暑', '署', '著', '誰'],
  '散': ['放', '数', '牧', '敗'],
  '歩': ['止', '走', '足', '涉'],
  '掃': ['婦', '帰', '除', '抱'],
  '除': ['途', '徐', '斜', '余'],
  '途': ['除', '徐', '追', '通'],
  '冷': ['令', '領', '零', '怜'],
  '令': ['冷', '領', '今', '命'],
  '領': ['冷', '令', '頭', '顔'],
  '暗': ['明', '日', '音', '晴'],
  '暖': ['緩', '愛', '援', '暖'],
  '吹': ['吸', '呼', '飲', '欠'],
  '吸': ['吹', '呼', '喚', '級'],
  '届': ['宙', '屈', '居', '屋'],
  '初': ['利', '秒', '祈', '新'],
  '利': ['初', '刷', '列', '刺'],
  '表': ['俵', '裏', '製', '青'],
  '裏': ['表', '黒', '里', '理'],
  '考': ['孝', '老', '者', '教'],
  '教': ['孝', '考', '救', '数'],
  '共': ['供', '洪', '井', '異'],
  '供': ['共', '便', '保', '個'],
  '個': ['固', '箇', '苦', '保'],
  '固': ['個', '箇', '苦', '国'],
  '箇': ['個', '固', '簡', '管'],
  '簡': ['箇', '間', '問', '管'],
  '単': ['早', '車', '軍', '草'],
  '答': ['合', '各', '管', '答'],
  '管': ['官', '館', '館', '筒'],
  '官': ['管', '館', '宮', '守'],
  '館': ['管', '官', '飯', '宿'],
  '差': ['着', '美', '羞', '義'],
  '着': ['差', '看', '春', '青'],
  '到': ['倒', '刀', '致', '刑'],
  '社': ['仕', '私', '杜', '祉'],
  '会': ['合', '今', '令', '全'],
  '員': ['院', '頁', '損', '負'],
  '警': ['敬', '驚', '撃', '誓'],
  '察': ['擦', '際', '索', '祭'],
  '温': ['湿', '湯', '混', '泉'],
  '湿': ['温', '湯', '池', '滝'],
  '湯': ['温', '陽', '傷', '場'],
  '場': ['陽', '湯', '傷', '城'],
  '陽': ['傷', '湯', '場', '防'],
  '傷': ['陽', '湯', '場', '似'],
  '疑': ['凝', '擬', '短', '知'],
  '凝': ['疑', '冷', '準', '氷'],
  '減': ['滅', '感', '成', '咸'],
  '滅': ['減', '戒', '歳', '威'],
  '普': ['譜', '並', '晋', '普'],
  '演': ['寅', '黄', '濱', '漢'],
  '易': ['傷', '賜', '場', '陽'],
  '難': ['離', '雑', '確', '雅'],
  '適': ['敵', '滴', '摘', '通'],
  '敵': ['適', '滴', '摘', '故'],
  '滴': ['適', '敵', '摘', '消'],
  '摘': ['適', '敵', '滴', '指'],
  '絶': ['断', '色', '続', '約'],
  '断': ['絶', '段', '新', '近'],
  '面': ['画', '両', '西', '百'],
  '接': ['妻', '姿', '技', '持'],
  '法': ['去', '活', '治', '泣'],
  '律': ['従', '徒', '建', '津'],
  '合': ['給', '拾', '答', '今'],
  '格': ['落', '各', '客', '校'],
  '賛': ['替', '質', '資', '賃'],
  '対': ['村', '付', '寸', '封'],
  '敗': ['散', '枚', '敗', '牧'],
  '相': ['箱', '想', '木', '相'],
  '談': ['淡', '炎', '談', '詳'],
  '雑': ['難', '離', '雄', '雅'],
  '病': ['痛', '疲', '症', '病'],
  '院': ['員', '完', '官', '院'],
  '交': ['郊', '校', '効', '交'],
  '通': ['道', '通', '追', '進']
};

function buildJLPTSentence(v, type) {
  const targetWord = (type === 1) ? v.kanji : v.furigana;
  const replacement = '<u class="jlpt-target">' + esc(targetWord) + '</u>';
  let sentence = v.contoh || v.kalimat;
  if (sentence) {
    if (sentence.includes('{W}')) return sentence.replace('{W}', replacement);
    if (v.kanji && sentence.includes(v.kanji)) return sentence.replace(v.kanji, replacement);
    if (v.furigana && sentence.includes(v.furigana)) return sentence.replace(v.furigana, replacement);
  }
  return type === 1 ? (replacement + 'の意味を考えます。') : (replacement + 'を漢字で書きます。');
}

function isKanjiChar(str) {
  return /[\u4e00-\u9faf]/.test(str);
}

function generateJLPTFuriganaDistractors(v) {
  const answer = v.furigana;
  const traps = new Set();

  // 1. Chouon (長音) Traps
  if (answer.includes('こう')) { traps.add(answer.replace(/こう/g, 'こ')); traps.add(answer.replace(/こう/g, 'きょう')); traps.add(answer.replace(/こう/g, 'きょ')); }
  if (answer.includes('とう')) { traps.add(answer.replace(/とう/g, 'と')); traps.add(answer.replace(/とう/g, 'ちょう')); }
  if (answer.includes('そう')) { traps.add(answer.replace(/そう/g, 'そ')); traps.add(answer.replace(/そう/g, 'しょう')); }
  if (answer.includes('しょう')) { traps.add(answer.replace(/しょう/g, 'しょ')); traps.add(answer.replace(/しょう/g, 'そう')); traps.add(answer.replace(/しょう/g, 'じょう')); }
  if (answer.includes('じょう')) { traps.add(answer.replace(/じょう/g, 'じょ')); traps.add(answer.replace(/じょう/g, 'しょう')); }
  if (answer.includes('りょう')) { traps.add(answer.replace(/りょう/g, 'りょ')); traps.add(answer.replace(/りょう/g, 'ろう')); }
  if (answer.includes('どう')) { traps.add(answer.replace(/どう/g, 'ど')); traps.add(answer.replace(/どう/g, 'とう')); }
  if (answer.includes('ごう')) { traps.add(answer.replace(/ごう/g, 'ご')); traps.add(answer.replace(/ごう/g, 'こう')); }
  if (answer.includes('けい')) { traps.add(answer.replace(/けい/g, 'け')); traps.add(answer.replace(/けい/g, 'きょう')); }
  if (answer.includes('せい')) { traps.add(answer.replace(/せい/g, 'せ')); traps.add(answer.replace(/せい/g, 'しょう')); }
  if (answer.includes('てい')) { traps.add(answer.replace(/てい/g, 'て')); }
  if (answer.includes('めい')) { traps.add(answer.replace(/めい/g, 'め')); traps.add(answer.replace(/めい/g, 'みょう')); }
  if (answer.includes('しゅう')) { traps.add(answer.replace(/しゅう/g, 'しゅ')); }

  // 2. Sokuon (促音・っ) Traps
  if (answer.includes('っ')) {
    traps.add(answer.replace(/っ/g, ''));
    traps.add(answer.replace(/っ/g, 'つ'));
  } else if (answer.length >= 3) {
    traps.add(answer[0] + 'っ' + answer.slice(2));
  }

  // 3. Dakuon / Handakuon Traps
  const dakuPairs = [
    ['か', 'が'], ['き', 'ぎ'], ['く', 'ぐ'], ['け', 'げ'], ['こ', 'ご'],
    ['さ', 'ざ'], ['し', 'じ'], ['す', 'ず'], ['せ', 'ぜ'], ['そ', 'ぞ'],
    ['た', 'だ'], ['ち', 'ぢ'], ['つ', 'づ'], ['て', 'で'], ['と', 'ど'],
    ['は', 'ば'], ['ば', 'ぱ'], ['は', 'ぱ'], ['ひ', 'び'], ['び', 'ぴ'],
    ['ふ', 'ぶ'], ['ぶ', 'ぷ'], ['へ', 'べ'], ['ほ', 'ぼ'], ['ぼ', 'ぽ']
  ];
  for (const [a, b] of dakuPairs) {
    if (answer.includes(a)) traps.add(answer.replace(a, b));
    if (answer.includes(b)) traps.add(answer.replace(b, a));
  }

  // 4. Double vowel & Ending Traps
  if (answer.includes('んな')) traps.add(answer.replace('んな', 'な'));
  if (answer.includes('んま')) traps.add(answer.replace('んま', 'ま'));
  if (answer.endsWith('い')) traps.add(answer + 'い');
  if (answer.endsWith('こ') || answer.endsWith('と') || answer.endsWith('そ')) traps.add(answer + 'う');

  traps.delete(answer);

  // Filter traps by closest length and edit distance
  let candidates = Array.from(traps).filter(x => x && x !== answer && Math.abs(x.length - answer.length) <= 1);
  candidates.sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length));

  const result = new Set(candidates.slice(0, 3));

  // If not enough, draw from vocabulary with same length or starting sound
  if (result.size < 3) {
    const sameLevel = State.vocab.filter(x => x.furigana !== answer && x.level === v.level);
    const sameStart = sameLevel.filter(x => x.furigana[0] === answer[0] && Math.abs(x.furigana.length - answer.length) <= 1);
    shuffle(sameStart).forEach(x => result.add(x.furigana));
  }
  if (result.size < 3) {
    const allSameLevel = State.vocab.filter(x => x.furigana !== answer && x.level === v.level);
    shuffle(allSameLevel).forEach(x => result.add(x.furigana));
  }

  return Array.from(result).slice(0, 3);
}

function generateJLPTKanjiDistractors(v) {
  const answer = v.kanji;
  const traps = new Set();
  const chars = Array.from(answer);

  // Strategy 1: Multi-Kanji Coordinate Traps (Authentic JLPT 2-Kanji & Multi-Kanji Traps)
  // For compounds like 内側: traps 2nd kanji (内測), 1st kanji (肉側), and BOTH kanji (肉測)!
  if (chars.length === 2) {
    const a = chars[0], b = chars[1];
    const lookA = KANJI_LOOKALIKES[a] || [];
    const lookB = KANJI_LOOKALIKES[b] || [];

    if (lookA.length > 0 && lookB.length > 0) {
      // Trap 1: Keep 1st, mutate 2nd (A + B')
      traps.add(a + lookB[0]);
      // Trap 2: Mutate 1st, keep 2nd (A' + B)
      traps.add(lookA[0] + b);
      // Trap 3: Mutate BOTH 1st and 2nd (A' + B')
      traps.add(lookA[0] + lookB[0]);
      // Alternate backups if needed
      if (lookB.length > 1) traps.add(a + lookB[1]);
      if (lookA.length > 1) traps.add(lookA[1] + b);
      if (lookA.length > 1 && lookB.length > 1) traps.add(lookA[1] + lookB[1]);
    } else if (lookA.length > 0) {
      for (const repA of lookA) traps.add(repA + b);
    } else if (lookB.length > 0) {
      for (const repB of lookB) traps.add(a + repB);
    }
  } else if (chars.length > 2) {
    // 3 or more chars (e.g. 会社員, 自動販売機, 一生懸命)
    const kanjiIndices = [];
    for (let i = 0; i < chars.length; i++) {
      if (/[\u4e00-\u9faf]/.test(chars[i]) && KANJI_LOOKALIKES[chars[i]]) {
        kanjiIndices.push(i);
      }
    }
    if (kanjiIndices.length >= 2) {
      const first = kanjiIndices[0];
      const last = kanjiIndices[kanjiIndices.length - 1];
      // Trap on last kanji
      const c1 = [...chars]; c1[last] = KANJI_LOOKALIKES[chars[last]][0];
      traps.add(c1.join(''));
      // Trap on first kanji
      const c2 = [...chars]; c2[first] = KANJI_LOOKALIKES[chars[first]][0];
      traps.add(c2.join(''));
      // Trap on both first and last
      const c3 = [...chars]; c3[first] = KANJI_LOOKALIKES[chars[first]][0]; c3[last] = KANJI_LOOKALIKES[chars[last]][0];
      traps.add(c3.join(''));
    } else if (kanjiIndices.length === 1) {
      const idx = kanjiIndices[0];
      for (const rep of KANJI_LOOKALIKES[chars[idx]]) {
        const copy = [...chars]; copy[idx] = rep;
        traps.add(copy.join(''));
      }
    }
  }

  // Strategy 2: Single Kanji substitution fallback across all character positions
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (KANJI_LOOKALIKES[c]) {
      for (const rep of KANJI_LOOKALIKES[c]) {
        const copy = [...chars];
        copy[i] = rep;
        traps.add(copy.join(''));
      }
    }
  }

  // Strategy 3: Real vocabulary compounds sharing 1 kanji and having same length
  const levelPool = State.vocab.filter(x => x.level === v.level && x.kanji !== answer);
  const sameLength = levelPool.filter(x => x.kanji.length === chars.length);

  for (const c of chars) {
    if (/[\u4e00-\u9faf]/.test(c)) {
      const sharing = sameLength.filter(x => x.kanji.includes(c));
      shuffle(sharing).forEach(x => traps.add(x.kanji));
    }
  }

  // Fallback across all levels
  if (traps.size < 3) {
    const allSameLength = State.vocab.filter(x => x.kanji !== answer && x.kanji.length === chars.length);
    for (const c of chars) {
      if (/[\u4e00-\u9faf]/.test(c)) {
        const sharing = allSameLength.filter(x => x.kanji.includes(c));
        shuffle(sharing).forEach(x => traps.add(x.kanji));
      }
    }
  }

  traps.delete(answer);
  return Array.from(traps).slice(0, 3);
}

function getTrapTip(v, type) {
  const isJa = (State.settings && State.settings.lang === 'ja');
  if (type === 1) {
    if (v.furigana.includes('う') && (v.furigana.includes('こう') || v.furigana.includes('とう') || v.furigana.includes('しょう') || v.furigana.includes('りょう') || v.furigana.includes('どう') || v.furigana.includes('ごう'))) {
      return isJa
        ? '「長音（伸ばす音）」の有無に注意！本試験で最も狙われやすい頻出ポイントです。'
        : 'Perhatikan bunyi panjang (chouon: -ou, -uu)! Ini adalah jebakan paling sering keluar di ujian JLPT.';
    }
    if (v.furigana.includes('っ')) {
      return isJa
        ? '「促音（小さい『っ』）」が入るタイミングを正しく確認しましょう。'
        : 'Perhatikan konsonan ganda / tsu kecil (っ)! Pastikan letak pemenggalannya tepat.';
    }
    if (/[がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ]/.test(v.furigana)) {
      return isJa
        ? '清音・濁音（点々）・半濁音（丸）の違いに注意して、正確な読み方を暗記しましょう。'
        : 'Perhatikan perbedaan tenten (゛) dan maru (゜)! Hafalkan apakah kata ini menggunakan bunyi seion atau dakuon.';
    }
    return isJa
      ? '漢字の正しい音読み・訓読みを単語の文脈と一緒にしっかり整理して覚えましょう。'
      : 'Hafalkan cara baca onyomi dan kunyomi yang tepat sesuai dengan konteks kalimatnya.';
  } else {
    return isJa
      ? '部首（さんずい 氵・にんべん 亻・ぎょうにんべん 彳・ごんべん 言・てへん 扌等）の細かな違いや、前後の漢字の組み合わせに注意しましょう（例: 側 vs 測, 経 vs 軽, 待 vs 持）。'
      : 'Perhatikan perbedaan halus pada radikal (sanzui 氵, nimben 亻, gyoninben 彳, gonben 言, tehen 扌, dll) serta variasi kombinasi kanji depan/belakang (contoh: 側 vs 測, 経 vs 軽, 待 vs 持).';
  }
}

function getArtiDistractors(vOrAnswer, level) {
  let answer, lv;
  if (typeof vOrAnswer === 'object' && vOrAnswer !== null) {
    answer = vOrAnswer.arti;
    lv = vOrAnswer.level;
  } else {
    answer = vOrAnswer;
    lv = level;
  }
  
  const distractors = new Set();
  const clean = s => (s || '').toLowerCase().replace(/[(),;.?\/!]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  const answerWords = clean(answer);

  const pool = State.vocab.filter(x => x.arti !== answer && (!lv || lv === 'all' || x.level === lv));

  if (answerWords.length > 0) {
    const sharing = pool.filter(x => {
      const words = clean(x.arti);
      return words.some(w => answerWords.includes(w));
    });
    shuffle(sharing).forEach(x => distractors.add(x.arti));
  }

  if (distractors.size < 3) {
    shuffle(pool).forEach(x => distractors.add(x.arti));
  }

  if (distractors.size < 3) {
    const allPool = State.vocab.filter(x => x.arti !== answer);
    shuffle(allPool).forEach(x => distractors.add(x.arti));
  }

  return Array.from(distractors).slice(0, 3);
}

function getFuriganaDistractors(vOrAnswer, level) {
  if (typeof vOrAnswer === 'object' && vOrAnswer !== null) {
    return generateJLPTFuriganaDistractors(vOrAnswer);
  }
  const found = State.vocab.find(x => x.furigana === vOrAnswer);
  if (found) return generateJLPTFuriganaDistractors(found);
  return generateJLPTFuriganaDistractors({ furigana: vOrAnswer, level: level || 'N4', kanji: vOrAnswer });
}

function getKanjiDistractors(vOrAnswer, level) {
  if (typeof vOrAnswer === 'object' && vOrAnswer !== null) {
    return generateJLPTKanjiDistractors(vOrAnswer);
  }
  const found = State.vocab.find(x => x.kanji === vOrAnswer);
  if (found) return generateJLPTKanjiDistractors(found);
  return generateJLPTKanjiDistractors({ kanji: vOrAnswer, level: level || 'N4', furigana: vOrAnswer });
}

/* ============================================================
   VIEW: QUIZ (JLPT Moji-Goi Edition)
   ============================================================ */
const QZ = {
  activeTab: 'mini',        // 'mini' | 'sim'
  mode: 1,                  // 1: 漢字読み, 2: 表記, 3: 総合
  level: 'all',
  limit: 10,
  queue: [],
  idx: 0,
  correct: 0,
  wrong: 0,
  answered: false,
  q: null,
  history: [],
  isSimulation: false,
  simLevel: 'N3',
  timerInterval: null,
  timerSeconds: 1200,       // 20 minutes
  startTime: null,
  endTime: null,
  showReview: false
};

Views.quiz = (app) => {
  if (!QZ.queue.length && !QZ.isSimulation && !QZ.answered) {
    renderQuizMenu(app);
    return;
  }
  if (QZ.idx >= QZ.queue.length) {
    renderQuizResult(app);
    return;
  }
  renderQuizQuestion(app);
};

function formatTimer(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function stopQuizTimer() {
  if (QZ.timerInterval) {
    clearInterval(QZ.timerInterval);
    QZ.timerInterval = null;
  }
}

function renderQuizMenu(app) {
  stopQuizTimer();
  document.body.classList.remove('hide-nav');
  toggleBottomNav(true);
  
  app.innerHTML = `
    <div class="view quiz-wrap">
      <div class="quiz-header-banner">
        <div class="quiz-header-tag">JLPT N4 · N3 · N2</div>
        <h1 class="page-title" style="margin-bottom:6px;">${t('quiz_title')}</h1>
        <p class="quiz-subtitle">${t('quiz_sub')}</p>
      </div>

      <!-- Top Tab Switcher: Mini vs Simulation -->
      <div class="jlpt-tabs">
        <button type="button" class="jlpt-tab-btn ${QZ.activeTab === 'mini' ? 'active' : ''}" id="tabBtnMini">
          ${ICONS.lightning} <span>${t('quiz_tab_mini')}</span>
        </button>
        <button type="button" class="jlpt-tab-btn ${QZ.activeTab === 'sim' ? 'active' : ''}" id="tabBtnSim">
          ${ICONS.simulation} <span>${t('quiz_tab_sim')}</span>
        </button>
      </div>

      ${QZ.activeTab === 'sim' ? `
        <!-- JLPT SIMULATION CARD -->
        <div class="jlpt-sim-banner">
          <div class="jlpt-sim-badge">JLPT OFFICIAL SIMULATION</div>
          <div class="jlpt-sim-title">
            <span class="sim-title-icon">${ICONS.simulation}</span> <span>${t('quiz_sim_title')}</span>
          </div>
          <p class="jlpt-sim-desc">
            ${t('quiz_sim_desc')}
          </p>

          <div class="jlpt-sim-info-grid">
            <div class="jlpt-sim-info-item">
              <span class="item-icon">${ICONS.document}</span>
              <div class="val">25 ${t('quiz_sim_unit_q')}</div>
              <div class="lbl">${t('quiz_sim_total_q')}</div>
            </div>
            <div class="jlpt-sim-info-item">
              <span class="item-icon">${ICONS.timer}</span>
              <div class="val">20:00</div>
              <div class="lbl">${t('quiz_sim_time_limit')}</div>
            </div>
            <div class="jlpt-sim-info-item">
              <span class="item-icon">${ICONS.target}</span>
              <div class="val">60%+</div>
              <div class="lbl">${t('quiz_sim_pass_std')}</div>
            </div>
          </div>

          <div style="margin-top:16px;">
            <label class="section-label" style="margin-bottom:8px;">${t('quiz_sim_select_lv')}</label>
            <div class="segmented full" id="simLevelSelect">
              <button type="button" data-slv="N4" class="${QZ.simLevel === 'N4' ? 'active' : ''}">N4</button>
              <button type="button" data-slv="N3" class="${QZ.simLevel === 'N3' ? 'active' : ''}">N3</button>
              <button type="button" data-slv="N2" class="${QZ.simLevel === 'N2' ? 'active' : ''}">N2</button>
            </div>
          </div>

          <button type="button" class="btn-start-jlpt sim-glow" id="btnStartSimulation" style="margin-top:20px;">
            <span class="btn-icon">${ICONS.play}</span> <span>${t('quiz_start_sim')}</span>
          </button>
        </div>
      ` : `
        <!-- MINI PRACTICE SETUP -->
        <div class="quiz-setup card">
          <div class="setup-group">
            <label class="section-label">${t('quiz_setup_material')}</label>
            <div class="segmented full" id="qzLv">
              <button type="button" data-lv="all" class="${QZ.level === 'all' ? 'active' : ''}">${t('filter_all')}</button>
              <button type="button" data-lv="N4" class="${QZ.level === 'N4' ? 'active' : ''}">N4</button>
              <button type="button" data-lv="N3" class="${QZ.level === 'N3' ? 'active' : ''}">N3</button>
              <button type="button" data-lv="N2" class="${QZ.level === 'N2' ? 'active' : ''}">N2</button>
            </div>
          </div>
          <div class="setup-group" style="margin-top:14px">
            <label class="section-label">${t('quiz_setup_count')}</label>
            <div class="segmented full" id="qzLimit">
              <button type="button" data-lim="5" class="${QZ.limit === 5 ? 'active' : ''}">5</button>
              <button type="button" data-lim="10" class="${QZ.limit === 10 ? 'active' : ''}">10</button>
              <button type="button" data-lim="20" class="${QZ.limit === 20 ? 'active' : ''}">20</button>
              <button type="button" data-lim="30" class="${QZ.limit === 30 ? 'active' : ''}">30</button>
            </div>
          </div>
        </div>

        <p class="section-label" style="margin-top:22px; margin-bottom:12px;">${t('quiz_choose_mode')}</p>

        <!-- Modern 2 + 1 Mode Cards Grid with Colorful Vector Icons -->
        <div class="jlpt-modes-grid">
          <!-- Mode 1: 漢字読み (Col 1) -->
          <div class="jlpt-mode-card card-col ${QZ.mode === 1 ? 'selected' : ''}" data-mode="1">
            <div class="jlpt-card-top">
              <div class="jlpt-mode-icon-box box-m1">${ICONS.modeReading}</div>
              <span class="jlpt-mode-check">${ICONS.check}</span>
            </div>
            <div class="jlpt-mode-content">
              <div class="jlpt-mode-title">${t('quiz_mode_1_title')}</div>
              <div class="jlpt-mode-pill pill-blue">${t('quiz_mode_1_sub')}</div>
              <p class="jlpt-mode-desc">${t('quiz_mode_1_desc')}</p>
            </div>
          </div>

          <!-- Mode 2: 表記 (Col 2) -->
          <div class="jlpt-mode-card card-col ${QZ.mode === 2 ? 'selected' : ''}" data-mode="2">
            <div class="jlpt-card-top">
              <div class="jlpt-mode-icon-box box-m2">${ICONS.modeWriting}</div>
              <span class="jlpt-mode-check">${ICONS.check}</span>
            </div>
            <div class="jlpt-mode-content">
              <div class="jlpt-mode-title">${t('quiz_mode_2_title')}</div>
              <div class="jlpt-mode-pill pill-amber">${t('quiz_mode_2_sub')}</div>
              <p class="jlpt-mode-desc">${t('quiz_mode_2_desc')}</p>
            </div>
          </div>

          <!-- Mode 3: 総合 (Row 2, Spans Full) -->
          <div class="jlpt-mode-card span-full ${QZ.mode === 3 ? 'selected' : ''}" data-mode="3">
            <div class="jlpt-mode-icon-box box-m3">${ICONS.modeRandom}</div>
            <div class="jlpt-mode-content" style="flex:1;">
              <div class="jlpt-mode-title">${t('quiz_mode_3_title')}</div>
              <div class="jlpt-mode-pill pill-emerald">${t('quiz_mode_3_sub')}</div>
              <p class="jlpt-mode-desc">${t('quiz_mode_3_desc')}</p>
            </div>
            <span class="jlpt-mode-check">${ICONS.check}</span>
          </div>
        </div>

        <button type="button" class="btn-start-jlpt" id="btnStartMini">
          <span class="btn-icon">${ICONS.play}</span> <span>${t('quiz_start_mini')}</span>
        </button>
      `}
    </div>`;

  // Bind tab buttons
  app.querySelector('#tabBtnMini').onclick = () => { QZ.activeTab = 'mini'; renderQuizMenu(app); };
  app.querySelector('#tabBtnSim').onclick = () => { QZ.activeTab = 'sim'; renderQuizMenu(app); };

  if (QZ.activeTab === 'sim') {
    app.querySelectorAll('#simLevelSelect button').forEach(b => {
      b.onclick = () => {
        QZ.simLevel = b.dataset.slv;
        app.querySelectorAll('#simLevelSelect button').forEach(x => x.classList.toggle('active', x.dataset.slv === QZ.simLevel));
      };
    });
    app.querySelector('#btnStartSimulation').onclick = () => startJLPTQuiz(true, app);
  } else {
    app.querySelectorAll('#qzLv button').forEach(b => {
      b.onclick = () => {
        QZ.level = b.dataset.lv;
        app.querySelectorAll('#qzLv button').forEach(x => x.classList.toggle('active', x.dataset.lv === QZ.level));
      };
    });
    app.querySelectorAll('#qzLimit button').forEach(b => {
      b.onclick = () => {
        QZ.limit = +b.dataset.lim;
        app.querySelectorAll('#qzLimit button').forEach(x => x.classList.toggle('active', +x.dataset.lim === QZ.limit));
      };
    });
    app.querySelectorAll('.jlpt-mode-card').forEach(b => {
      b.onclick = () => {
        QZ.mode = +b.dataset.mode;
        app.querySelectorAll('.jlpt-mode-card').forEach(x => x.classList.toggle('selected', +x.dataset.mode === QZ.mode));
      };
    });
    app.querySelector('#btnStartMini').onclick = () => startJLPTQuiz(false, app);
  }
}

function startJLPTQuiz(isSimulation, app) {
  stopQuizTimer();
  QZ.isSimulation = isSimulation;
  QZ.idx = 0;
  QZ.correct = 0;
  QZ.wrong = 0;
  QZ.answered = false;
  QZ.history = [];
  QZ.showReview = false;
  QZ.startTime = Date.now();

  const isKanjiChar = (str) => /[\u4e00-\u9faf]/.test(str);
  const targetLevel = isSimulation ? QZ.simLevel : QZ.level;
  // Always filter to words containing at least one Kanji for authentic Moji-Goi
  let pool = State.vocab.filter(v => (targetLevel === 'all' || v.level === targetLevel) && Array.from(v.kanji).some(isKanjiChar));

  if (isSimulation) {
    // 25 questions: 13 Kanji reading (Type 1) + 12 Kanji writing (Type 2)
    const m1Pool = pool;
    const m2Pool = pool.filter(v => Array.from(v.kanji).some(isKanjiChar));
    const m1Queue = shuffle(m1Pool).slice(0, 13).map(v => ({ v, type: 1 }));
    const m2Queue = shuffle(m2Pool).slice(0, 12).map(v => ({ v, type: 2 }));
    QZ.queue = [...m1Queue, ...m2Queue];
    QZ.timerSeconds = 1200; // 20 minutes

    QZ.timerInterval = setInterval(() => {
      QZ.timerSeconds--;
      const el = document.getElementById('jlptTimerText');
      if (el) {
        el.textContent = formatTimer(QZ.timerSeconds);
        const pill = el.closest('.jlpt-timer-pill');
        if (pill && QZ.timerSeconds <= 180) {
          pill.classList.add('warning');
        }
      }
      if (QZ.timerSeconds <= 0) {
        stopQuizTimer();
        toast('時間終了です！採点を行います。');
        renderQuizResult(app);
      }
    }, 1000);

  } else {
    // Mini Practice
    let candidates = pool;
    if (QZ.mode === 2) {
      candidates = pool.filter(v => Array.from(v.kanji).some(isKanjiChar));
    }
    const chosenVocab = shuffle(candidates).slice(0, QZ.limit);
    QZ.queue = chosenVocab.map(v => {
      let type = QZ.mode;
      if (type === 3) {
        type = Array.from(v.kanji).some(isKanjiChar) ? (Math.random() < 0.5 ? 1 : 2) : 1;
      }
      return { v, type };
    });
  }

  if (QZ.queue.length < 3) {
    toast('出題に必要な単語が足りません。');
    renderQuizMenu(app);
    return;
  }

  buildJLPTQuestion();
  renderQuizQuestion(app);
}

function buildJLPTQuestion() {
  const item = QZ.queue[QZ.idx];
  const v = item.v;
  const type = item.type; // 1: 漢字読み, 2: 表記

  const mondaiTag = type === 1 ? '問題１ 漢字の読み方' : '問題２ 表記（漢字の書き方）';
  const mondaiInstruction = type === 1
    ? '＿＿＿の言葉の読み方として最もよいものを、１・２・３・４から一つ選びなさい。'
    : '＿＿＿の言葉を漢字で書くとき、最もよいものを、１・２・３・４から一つ選びなさい。';

  const sentence = buildJLPTSentence(v, type);
  const answer = type === 1 ? v.furigana : v.kanji;
  const distractors = type === 1 ? generateJLPTFuriganaDistractors(v) : generateJLPTKanjiDistractors(v);

  const options = shuffle([answer, ...distractors]).slice(0, 4);
  if (!options.includes(answer)) options[0] = answer;

  const trapTip = getTrapTip(v, type);

  QZ.q = {
    v,
    type,
    mondaiTag,
    mondaiInstruction,
    sentence,
    answer,
    options,
    trapTip
  };
  QZ.answered = false;
}

function renderQuizQuestion(app) {
  document.body.classList.add('hide-nav');
  toggleBottomNav(false);
  const q = QZ.q;
  const prog = Math.round((QZ.idx) / QZ.queue.length * 100);

  app.innerHTML = `
    <div class="view quiz-wrap">
      <div class="toolbar" style="margin-bottom: 16px; justify-content:space-between; align-items:center;">
        <button class="btn ghost" id="exitQuiz" style="height: 38px; padding: 0 14px; border-radius: 12px; font-size: 13.5px; display:inline-flex; align-items:center; gap:6px;">
          ${ICONS.exit} <span>${t('quiz_exit_btn')}</span>
        </button>
        ${QZ.isSimulation ? `
          <div class="jlpt-timer-pill ${QZ.timerSeconds <= 180 ? 'warning' : ''}">
            <span>${ICONS.timer}</span> <span id="jlptTimerText">${formatTimer(QZ.timerSeconds)}</span>
          </div>
        ` : ''}
        <div style="font-size:13.5px; font-weight:700; color:var(--text-soft);">
          <span>${t('quiz_counter', QZ.idx + 1, QZ.queue.length)}</span>
        </div>
      </div>

      <div class="quiz-progress"><i style="width:${prog}%"></i></div>

      <!-- Formal JLPT Mondai Banner -->
      <div class="jlpt-mondai-header">
        <div class="jlpt-mondai-tag">${q.mondaiTag}</div>
        <div class="jlpt-mondai-instruction">${q.mondaiInstruction}</div>
      </div>

      <!-- Target Sentence with Underlined Word -->
      <div class="jlpt-sentence-card">
        <div class="jlpt-sentence-text">${q.sentence}</div>
      </div>

      <!-- 4 Numbered Choices (1, 2, 3, 4) -->
      <div class="jlpt-options" id="opts">
        ${q.options.map((opt, i) => `
          <button type="button" class="jlpt-opt" data-val="${esc(opt)}">
            <span class="jlpt-opt-num">${i + 1}</span>
            <span class="jlpt-opt-text">${esc(opt)}</span>
          </button>
        `).join('')}
      </div>

      <!-- Container for Kaisetsu (Explanation) & Next Button -->
      <div id="qFeedback"></div>
    </div>`;

  app.querySelector('#exitQuiz').onclick = () => {
    if (confirm(t('quiz_confirm_exit'))) {
      stopQuizTimer();
      QZ.queue = [];
      QZ.idx = 0;
      renderQuizMenu(app);
    }
  };

  app.querySelectorAll('#opts .jlpt-opt').forEach(btn => {
    btn.onclick = () => answerJLPTQuiz(btn.dataset.val, app);
  });
}

function answerJLPTQuiz(val, app) {
  if (QZ.answered) return;
  QZ.answered = true;
  const q = QZ.q;
  const correct = val === q.answer;

  if (correct) {
    QZ.correct++;
    review(q.v.id, 'easy');
  } else {
    QZ.wrong++;
    review(q.v.id, 'hard');
  }

  // Record history for full post-test review
  QZ.history.push({
    q,
    userChoice: val,
    isCorrect: correct
  });

  // Apply colors to options
  app.querySelectorAll('#opts .jlpt-opt').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.val === q.answer) {
      btn.classList.add('correct');
    } else if (btn.dataset.val === val) {
      btn.classList.add('wrong');
    }
  });

  // Render Detailed Kaisetsu (Pembahasan)
  const feedback = document.getElementById('qFeedback');
  if (feedback) {
    feedback.innerHTML = `
      <div class="jlpt-kaisetsu-box">
        <div class="kaisetsu-top">
          <span class="kaisetsu-result-badge ${correct ? 'ok' : 'ng'}">
            ${correct ? (ICONS.check + ' ' + t('quiz_kaisetsu_badge_ok')) : (ICONS.cross + ' ' + t('quiz_kaisetsu_badge_ng'))}
          </span>
          <button type="button" class="icon-btn sq" id="speakKaisetsuBtn" title="発音を聞く" style="height:36px; width:36px; border-radius:10px; padding:0; display:flex; align-items:center; justify-content:center;">
            ${ICONS.speaker}
          </button>
        </div>

        <div class="kaisetsu-word-row">
          <span class="kaisetsu-kanji">${esc(q.v.kanji)}</span>
          <span class="kaisetsu-furi">（${esc(q.v.furigana)}）</span>
          <span class="lv ${q.v.level}" style="font-size:11px; padding:2px 8px;">${q.v.level}</span>
        </div>

        <div class="kaisetsu-arti"><span class="symbol-badge">ID</span> <strong>${t('quiz_kaisetsu_meaning')}:</strong> ${esc(q.v.arti)}
        </div>

        <div class="kaisetsu-trap"><span class="trap-ico">${ICONS.lightbulb}</span> <strong>${t('quiz_kaisetsu_tip')}:</strong> ${q.trapTip}
        </div>
      </div>

      <button type="button" class="quiz-next" id="btnNextJLPT" style="margin-top:18px;">
        ${QZ.idx + 1 >= QZ.queue.length ? t('quiz_result_btn') : t('quiz_next_btn')}
      </button>
    `;

    const speakBtn = feedback.querySelector('#speakKaisetsuBtn');
    if (speakBtn) speakBtn.onclick = () => speakJapanese(q.v.kanji);

    feedback.querySelector('#btnNextJLPT').onclick = () => {
      QZ.idx++;
      if (QZ.idx >= QZ.queue.length) {
        stopQuizTimer();
        renderQuizResult(app);
      } else {
        buildJLPTQuestion();
        renderQuizQuestion(app);
      }
    };
  }
}

function renderQuizResult(app) {
  stopQuizTimer();
  document.body.classList.remove('hide-nav');
  toggleBottomNav(true);

  QZ.endTime = Date.now();
  const timeSpentSec = Math.round(((QZ.endTime - (QZ.startTime || QZ.endTime)) / 1000));
  const timeSpentStr = Math.floor(timeSpentSec / 60) + '分' + (timeSpentSec % 60) + '秒';

  const total = QZ.queue.length;
  const pct = total ? Math.round(QZ.correct / total * 100) : 0;
  const isPass = pct >= 60;

  // Breakdown for M1 and M2
  let m1Tot = 0, m1Cor = 0, m2Tot = 0, m2Cor = 0;
  QZ.history.forEach(h => {
    if (h.q.type === 1) {
      m1Tot++;
      if (h.isCorrect) m1Cor++;
    } else {
      m2Tot++;
      if (h.isCorrect) m2Cor++;
    }
  });

  app.innerHTML = `
    <div class="view quiz-wrap">
      <div class="jlpt-result-card">
        ${QZ.isSimulation ? `
          <div class="${isPass ? 'jlpt-pass-stamp' : 'jlpt-fail-stamp'}">
            ${isPass ? '【 合 格 】' : '【 不合格 】'}
          </div>
          <h2 style="font-size:24px; font-weight:850; margin:0 0 6px;">
            ${isPass ? '合格基準達成！' : '不合格（再挑戦）'}
          </h2>
          <p style="font-size:13.5px; color:var(--text-soft); margin-bottom:18px;">
            ${isPass ? t('quiz_sim_pass_msg') : t('quiz_sim_fail_msg')}
          </p>
        ` : `
          <div class="quiz-res-symbol-wrap">${pct >= 80 ? ICONS.award : pct >= 60 ? ICONS.target : ICONS.lightning}</div>
          <h2 style="font-size:24px; font-weight:850; margin:0 0 6px;">${pct}% 正解</h2>
          <p style="font-size:13.5px; color:var(--text-soft); margin-bottom:18px;">
            ${pct >= 80 ? '素晴らしい！この調子でJLPT本番も満点を目指しましょう。' : pct >= 60 ? '合格ライン突破！間違えたポイントを復習しましょう。' : '焦らず反復練習！解説を確認して苦手な漢字を克服しましょう。'}
          </p>
        `}

        <!-- Score Breakdown Table -->
        <div class="jlpt-score-breakdown">
          <div class="jlpt-breakdown-item">
            <div class="h">${t('quiz_total_score')}</div>
            <div class="s">${QZ.correct} / ${total} <span style="font-size:14px; color:var(--text-soft);">(${pct}点)</span></div>
          </div>
          <div class="jlpt-breakdown-item">
            <div class="h">${t('quiz_time_spent')}</div>
            <div class="s">${timeSpentStr}</div>
          </div>
          ${m1Tot > 0 ? `
            <div class="jlpt-breakdown-item">
              <div class="h">${t('quiz_m1_score')}</div>
              <div class="s">${m1Cor} / ${m1Tot} <span style="font-size:13px; color:var(--text-soft);">(${Math.round(m1Cor/m1Tot*100)}%)</span></div>
            </div>
          ` : ''}
          ${m2Tot > 0 ? `
            <div class="jlpt-breakdown-item">
              <div class="h">${t('quiz_m2_score')}</div>
              <div class="s">${m2Cor} / ${m2Tot} <span style="font-size:13px; color:var(--text-soft);">(${Math.round(m2Cor/m2Tot*100)}%)</span></div>
            </div>
          ` : ''}
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
          <button type="button" class="btn" id="btnToggleReview" style="height:48px; font-weight:750; font-size:14.5px;">
            ${QZ.showReview ? t('quiz_hide_review') : t('quiz_show_review')}
          </button>
          <div class="btn-row" style="justify-content:center; gap:10px;">
            <button type="button" class="btn ghost" id="btnRetryQuiz" style="flex:1;">
              ${QZ.isSimulation ? t('quiz_sim_again') : t('quiz_retry_btn')}
            </button>
            <button type="button" class="btn ghost" id="btnBackMenu" style="flex:1;">
              ${t('quiz_menu_btn')}
            </button>
          </div>
        </div>

        <!-- Full Kaisetsu Review List -->
        <div class="jlpt-review-list" id="reviewContainer" style="${QZ.showReview ? '' : 'display:none;'}">
          ${QZ.history.map((h, i) => `
            <div class="jlpt-review-item ${h.isCorrect ? 'is-correct' : 'is-wrong'}">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:800; font-size:13px; color:${h.isCorrect ? 'var(--green)' : 'var(--red)'};">
                  第${i + 1}問: ${h.isCorrect ? '✔ 正解' : '✖ 不正解'} · ${h.q.type === 1 ? '漢字読み' : '表記'}
                </span>
                <span class="lv ${h.q.v.level}" style="font-size:10px; padding:1px 6px;">${h.q.v.level}</span>
              </div>
              <div style="font-size:15px; font-weight:700; color:var(--text); line-height:1.5;">
                ${h.q.sentence}
              </div>
              <div style="font-size:13.5px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:4px;">
                <span>正解: <strong style="color:var(--green);">${esc(h.q.answer)}</strong></span>
                ${!h.isCorrect ? `<span>あなたの回答: <strong style="color:var(--red);">${esc(h.userChoice)}</strong></span>` : ''}
              </div>
              <div style="font-size:12.5px; color:var(--text-soft); background:var(--bg-soft); padding:6px 10px; border-radius:6px; margin-top:4px;">
                🇮🇩 <strong>意味:</strong> ${esc(h.q.v.arti)}
              </div>
              <div style="font-size:12px; color:#f59e0b; line-height:1.4;">
                ${ICONS.lightbulb} ${h.q.trapTip}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;

  app.querySelector('#btnToggleReview').onclick = () => {
    QZ.showReview = !QZ.showReview;
    const rc = app.querySelector('#reviewContainer');
    const tb = app.querySelector('#btnToggleReview');
    if (rc) rc.style.display = QZ.showReview ? 'flex' : 'none';
    if (tb) tb.textContent = QZ.showReview ? t('quiz_hide_review') : t('quiz_show_review');
  };

  app.querySelector('#btnRetryQuiz').onclick = () => {
    if (QZ.isSimulation) {
      startJLPTQuiz(true, app);
    } else {
      startJLPTQuiz(false, app);
    }
  };

  app.querySelector('#btnBackMenu').onclick = () => {
    QZ.queue = [];
    QZ.idx = 0;
    renderQuizMenu(app);
  };
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
  const isJa = (State.settings && State.settings.lang === 'ja');

  app.innerHTML = `
    <div class="view">
      <h1 class="page-title">${t('stats_title') || 'Statistik'}<span class="sub">${t('stats_sub') || 'Pantau perkembangan belajarmu'}</span></h1>

      <section>
        <div class="grid stat-grid">
          <div class="stat clickable" data-stat="learned"><span class="ico">${ICONS.book}</span><div class="val">${learned}</div><div class="lbl">${t('stats_total_learned') || 'Total dipelajari'}</div></div>
          <div class="stat clickable" data-stat="mastered"><span class="ico">${ICONS.award}</span><div class="val">${mastered}</div><div class="lbl">${t('stats_total_mastered') || 'Total dikuasai'}</div></div>
          <div class="stat" data-stat="notyet"><span class="ico">${ICONS.document}</span><div class="val">${notyet}</div><div class="lbl">${t('stats_notyet') || 'Belum dipelajari'}</div></div>
          <div class="stat" data-stat="accuracy"><span class="ico">${ICONS.target}</span><div class="val">${acc}%</div><div class="lbl">${t('stats_accuracy') || 'Akurasi review'}</div></div>
        </div>
      </section>

      <section>
        <p class="section-label">${t('stats_mastery_summary') || 'Ringkasan Penguasaan'}</p>
        <div class="card donut-wrap">
          <div class="donut" style="--a:${segMaster}%;--b:${segLearned}%">
            <div class="mid"><b>${total ? Math.round(learned / total * 100) : 0}%</b><small>${t('stats_donut_learned') || 'dipelajari'}</small></div>
          </div>
          <div class="legend">
            <div class="row"><span class="dot" style="background:var(--green)"></span> ${t('stats_legend_mastered') || 'Dikuasai'} <b>${mastered}</b></div>
            <div class="row"><span class="dot" style="background:var(--orange)"></span> ${t('stats_legend_learned') || 'Dipelajari'} <b>${learned - mastered}</b></div>
            <div class="row"><span class="dot" style="background:var(--bg-soft)"></span> ${t('stats_legend_notyet') || 'Belum'} <b>${notyet}</b></div>
          </div>
        </div>
      </section>

      <section>
        <p class="section-label">${t('stats_progress_per_level') || 'Progress per Level'}</p>
        <div class="card progress-level-card" style="padding:24px">
          ${levels.map(x => `
            <div class="bar-row">
              <div class="top"><span>${x.lv} <span class="muted">· ${x.tot} ${t('stats_word_unit') || 'kata'}</span></span><span>${x.lp}%</span></div>
              <div class="bar ${x.lv.toLowerCase()}"><i style="width:${x.lp}%"></i></div>
              <div class="top" style="margin-top:6px;font-size:12px;color:var(--text-dim)"><span>${t('stats_mastered_sub') || 'Dikuasai'}: ${x.m}</span><span>${x.mp}%</span></div>
            </div>`).join('')}
        </div>
      </section>

      <section>
        <p class="section-label">${t('stats_activity_title') || 'Aktivitas Review (Klik untuk detail)'}</p>
        <div class="grid stat-grid">
          <div class="stat" data-stat="reviews"><span class="ico">${ICONS.refresh}</span><div class="val">${totalReviews}</div><div class="lbl">${t('stats_total_reviews') || 'Total review'}</div></div>
          <div class="stat clickable" id="btnCorrectReviews" data-stat="correct"><span class="ico">${ICONS.check}</span><div class="val">${totalCorrect}</div><div class="lbl">${t('stats_correct_answers') || 'Jawaban benar'}</div></div>
          <div class="stat clickable" id="btnWrongReviews" data-stat="wrong"><span class="ico">${ICONS.cross}</span><div class="val">${totalWrong}</div><div class="lbl">${t('stats_wrong_answers') || 'Jawaban salah'}</div></div>
          <div class="stat" data-stat="streak"><span class="ico">${ICONS.flame}</span><div class="val">${currentStreak()}</div><div class="lbl">${t('stats_streak_label') || 'Streak (hari)'}</div></div>
        </div>
        ${totalWrong > 0 ? `
        <div style="margin-top: 14px;">
          <button class="btn block" id="btnDirectWrongQuiz" style="background: linear-gradient(135deg, var(--red), #ff7e5f); color: white; border: none; font-weight: 700; box-shadow: 0 4px 12px var(--red-soft); display:flex; align-items:center; justify-content:center; gap:8px; height:44px; border-radius:12px; cursor:pointer;">
            ${ICONS.target} ${t('stats_detail_practice_btn') || 'Latihan Soal Salah'} (${totalWrong} ${t('stats_word_unit') || 'kata'})
          </button>
        </div>` : `
        <div style="margin-top: 12px; padding: 12px 16px; border-radius: 12px; background: var(--bg-soft); border: 1px solid var(--border-soft); font-size: 13px; color: var(--text-dim); display: flex; align-items: center; gap: 8px;">
          <span>🎉</span>
          <span>${t('stats_no_wrong_tip') || 'Belum ada kosakata yang dijawab salah! Lanjutkan belajar untuk menguji pemahaman.'}</span>
        </div>`}
      </section>

      <section>
        <p class="section-label">${isJa ? 'クラウド同期 (スマホ ↔ PC)' : 'Sinkronisasi Cloud (HP ↔ Laptop)'}</p>
        <div class="card" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer;" id="btnStatsCloud">
          <div style="display:flex; align-items:center; gap:14px; min-width:0;">
            <div style="width:42px; height:42px; border-radius:12px; background:var(--primary-soft); color:var(--primary); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <svg style="width:22px;height:22px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
              </svg>
            </div>
            <div style="min-width:0;">
              <div style="font-weight:700; font-size:14.5px;">
                ${(typeof CloudSync !== 'undefined' && CloudSync.user) ? (isJa ? 'クラウド同期中' : 'Sinkronisasi Aktif') : (isJa ? 'スマホとPCを連携' : 'Hubungkan HP & Laptop')}
              </div>
              <div style="font-size:12.5px; color:var(--text-dim); margin-top:2px; word-break:break-all; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                ${(typeof CloudSync !== 'undefined' && CloudSync.user) ? CloudSync.user.email : (isJa ? '進捗・ストリークをリアルタイム共有' : 'Sinkronkan progres & streak realtime')}
              </div>
            </div>
          </div>
          <span style="font-size:13px; font-weight:700; color:var(--primary); flex-shrink:0;">
            ${(typeof CloudSync !== 'undefined' && CloudSync.user) ? '✓ ON' : (isJa ? '設定 →' : 'Masuk →')}
          </span>
        </div>
      </section>

      <section>
        <button class="btn ghost block" id="reset">${ICONS.trash} ${t('stats_reset_btn') || 'Reset semua progress'}</button>
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
  const directWrongBtn = app.querySelector('#btnDirectWrongQuiz');
  if (directWrongBtn) {
    directWrongBtn.onclick = () => {
      WQ.queue = [];
      WQ.idx = 0;
      navigate('statsDetailQuiz');
    };
  }
  const statsCloudBtn = app.querySelector('#btnStatsCloud');
  if (statsCloudBtn) {
    statsCloudBtn.onclick = () => openCloudModal();
  }
  app.querySelector('#reset').onclick = () => {
    if (confirm(t('stats_reset_confirm') || 'Yakin ingin menghapus semua progress belajar? Tindakan ini tidak bisa dibatalkan.')) {
      State.progress = {}; State.streak = { current: 0, last: null, best: 0 }; State.wrongSolved = {};
      save(K.progress, State.progress); save(K.streak, State.streak); save(K.wrongSolved, State.wrongSolved);
      toast(t('stats_reset_toast') || 'Progress direset'); navigate('stats');
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
  const title = isCorrect ? (t('stats_detail_correct_title') || 'Daftar Jawaban Benar') : (t('stats_detail_wrong_title') || 'Daftar Jawaban Salah');
  const subtitle = isCorrect ? (t('stats_detail_correct_sub') || 'Kosakata yang dijawab benar setidaknya satu kali') : (t('stats_detail_wrong_sub') || 'Kosakata yang dijawab salah setidaknya satu kali');
  const label = isCorrect ? (t('label_correct') || 'Benar') : (t('label_wrong') || 'Salah');
  const color = isCorrect ? 'var(--green)' : 'var(--red)';
  const icon = isCorrect ? '✔' : '✖';

  const filtered = State.vocab.filter(v => {
    const s = State.progress[v.id];
    if (isCorrect) {
      return s && s.correct > 0;
    } else {
      return s && s.wrong > 0;
    }
  }).sort((a, b) => {
    if (isCorrect) {
      const sA = State.progress[a.id];
      const sB = State.progress[b.id];
      return (sB ? sB.correct || 0 : 0) - (sA ? sA.correct || 0 : 0);
    } else {
      const effA = effectiveWrong(a.id);
      const effB = effectiveWrong(b.id);
      if (effA !== effB) return effB - effA;
      const sA = State.progress[a.id];
      const sB = State.progress[b.id];
      return (sB ? sB.wrong || 0 : 0) - (sA ? sA.wrong || 0 : 0);
    }
  });

  app.innerHTML = `
    <div class="view">
      <div class="toolbar" style="margin-bottom: 20px; justify-content: space-between; align-items: center; width: 100%; display: flex; flex-wrap: wrap; gap: 10px;">
        <button class="btn ghost" id="backToStats" style="height: 40px; padding: 0 16px; border-radius: 12px; font-size: 14px; cursor: pointer;">
          ${t('stats_detail_back') || '← Kembali ke Statistik'}
        </button>
        ${!isCorrect && filtered.length > 0 ? `
        <button class="btn" id="startWrongQuiz" style="height: 40px; padding: 0 16px; border-radius: 12px; font-size: 14px; background: linear-gradient(135deg, var(--red), #ff7e5f); color: white; border: none; box-shadow: 0 4px 10px var(--red-soft); font-weight: 700; cursor: pointer;">
          ${ICONS.target} ${t('stats_detail_practice_btn') || 'Latihan Soal Salah'}
        </button>` : ''}
      </div>

      <h1 class="page-title">${esc(title)}<span class="sub">${esc(subtitle)}</span></h1>
      
      <p class="count-note">${t('found_vocab_count', filtered.length, '')}</p>
      
      <div class="vocab-grid">
        ${filtered.length ? filtered.map(v => {
    const s = State.progress[v.id];
    const rawCount = s ? (isCorrect ? s.correct : s.wrong) : 0;
    const eff = !isCorrect ? effectiveWrong(v.id) : 0;
    return `
            <div class="vocab-card">
              <span class="lv ${v.level}">${v.level}</span>
              <div class="kanji">${esc(v.kanji)}</div>
              <div class="furi">${esc(v.furigana)}</div>
              <div class="arti">${esc(v.arti)}</div>
              <div style="margin-top:10px; font-size:12.5px; font-weight:700; color:${color}; display:flex; align-items:center; justify-content:space-between; gap:6px; border-top:1px solid var(--border-soft); padding-top:8px;">
                <span>${icon} ${rawCount}x ${label}</span>
                ${!isCorrect && eff === 0 ? `<span style="font-size:11px; font-weight:600; color:var(--green); background:var(--green-soft); padding:2px 7px; border-radius:99px;">${t('label_resolved') || 'Terselesaikan ✔'}</span>` : ''}
              </div>
            </div>`;
  }).join('') : `
          <div class="empty" style="grid-column: 1 / -1">
            <div class="big">${ICONS.emptyDoc}</div>
            ${t('stats_detail_no_data') || 'Belum ada data review.'}
          </div>
        `}
      </div>
    </div>`;

  app.querySelector('#backToStats').onclick = () => navigate('stats');
  const startBtn = app.querySelector('#startWrongQuiz');
  if (startBtn) {
    startBtn.onclick = () => {
      WQ.queue = [];
      WQ.idx = 0;
      navigate('statsDetailQuiz');
    };
  }
};

/* ============================================================
   VIEW: DETAIL STATISTIK - KUIS KHUSUS JAWABAN SALAH
   ============================================================ */
const WQ = { queue: [], idx: 0, correct: 0, wrong: 0, answered: false, q: null };

function getWrongVocabPool() {
  const unresolved = State.vocab.filter(v => effectiveWrong(v.id) > 0).sort((a, b) => effectiveWrong(b.id) - effectiveWrong(a.id));
  if (unresolved.length >= 10) return unresolved.slice(0, 10);

  const unresolvedIds = new Set(unresolved.map(v => v.id));
  const resolved = State.vocab.filter(v => !unresolvedIds.has(v.id) && (State.progress[v.id]?.wrong || 0) > 0)
    .sort((a, b) => (State.progress[b.id]?.wrong || 0) - (State.progress[a.id]?.wrong || 0));

  return [...unresolved, ...resolved].slice(0, 10);
}

Views.statsDetailQuiz = (app) => {
  if (!WQ.queue.length || WQ.idx >= WQ.queue.length) {
    WQ.queue = getWrongVocabPool();
    WQ.idx = 0;
    WQ.correct = 0;
    WQ.wrong = 0;
    WQ.answered = false;

    if (WQ.queue.length === 0) {
      toast('Belum ada data kata salah.');
      navigate('statsDetail');
      return;
    }
    buildWrongQuestion();
  }
  renderWrongQuestion(app);
};

function startWrongQuiz(app) {
  WQ.queue = getWrongVocabPool();
  WQ.idx = 0;
  WQ.correct = 0;
  WQ.wrong = 0;
  WQ.answered = false;

  if (WQ.queue.length === 0) {
    toast('Belum ada data kata salah.');
    navigate('statsDetail');
    return;
  }
  buildWrongQuestion();
  renderWrongQuestion(app);
}

function buildWrongQuestion() {
  const v = WQ.queue[WQ.idx];
  const hasKanji = Array.from(v.kanji).some(isKanjiChar);

  let type;
  if (!hasKanji) {
    type = 1;
  } else {
    type = 1 + Math.floor(Math.random() * 3);
  }

  let prompt, promptFuri = '', tag, answer, field;
  if (type === 1) {
    field = 'arti';
    prompt = v.kanji;
    promptFuri = v.furigana;
    tag = t('quiz_tag_arti') || 'Apa arti kata ini?';
    answer = v.arti;
  } else if (type === 2) {
    field = 'furigana';
    prompt = v.kanji;
    tag = t('quiz_tag_furi') || 'Bagaimana cara bacanya?';
    answer = v.furigana;
  } else {
    field = 'kanji';
    prompt = v.arti;
    tag = t('quiz_tag_kanji') || 'Kanji mana yang tepat?';
    answer = v.kanji;
    promptFuri = '';
  }

  let distract;
  if (type === 1) {
    distract = getArtiDistractors(v);
  } else if (type === 2) {
    distract = generateJLPTFuriganaDistractors(v);
  } else {
    distract = generateJLPTKanjiDistractors(v);
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
          ${t('wrong_quiz_exit_btn')}
        </button>
      </div>
      <h1 class="page-title" style="font-size:20px;margin-bottom:10px">${t('wrong_quiz_title')}<span class="sub">${t('wrong_quiz_sub')}</span></h1>
      <div class="quiz-meta" style="margin-top:10px"><span>${t('quiz_counter', WQ.idx + 1, WQ.queue.length)}</span><span><span class="ok">✔ ${WQ.correct}</span> · <span class="no">✖ ${WQ.wrong}</span></span></div>
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
    if (confirm(t('wrong_quiz_confirm_exit'))) {
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
  next.innerHTML = `<button class="quiz-next">${WQ.idx + 1 >= WQ.queue.length ? t('quiz_result_btn') : t('quiz_next_btn')}</button>`;
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
  const resultIcon = pct >= 80 ? ICONS.award : ICONS.chart;
  const msg = pct >= 80 ? t('wrong_quiz_msg_high') : pct >= 50 ? t('wrong_quiz_msg_med') : t('wrong_quiz_msg_low');
  app.innerHTML = `
    <div class="view quiz-wrap">
      <div class="result">
        <div class="big" style="color:var(--primary);">${resultIcon}</div>
        <div class="score">${WQ.correct}/${total}</div>
        <h2>${t('quiz_score_pct', pct)}</h2>
        <p>${msg}</p>
        <p style="font-size:12px;color:var(--text-dim);margin-top:-10px;margin-bottom:20px;">${t('wrong_quiz_note')}</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn" id="retryWrong">${t('wrong_quiz_retry')}</button>
          <button class="btn ghost" id="backToDetail">${t('wrong_quiz_back')}</button>
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

function emptyState(msg) { return `<div class="view"><div class="empty"><div class="big">${ICONS.emptyDoc}</div>${esc(msg)}</div></div>`; }

/* ============================================================
   SUPABASE CLOUD SYNC & REALTIME (HP ↔ LAPTOP)
   ============================================================ */
const SUPABASE_CONFIG = {
  url: 'https://vugsjgcxiomctjshlpuy.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Z3NqZ2N4aW9tY3Rqc2hscHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MTYyNzksImV4cCI6MjEwOTA5MjI3OX0.3Hz-64jVuKcUct0m2HFbEtjzUWp9rgq4lIHKhZs8Zy4'
};

const CloudSync = {
  client: null,
  user: null,
  channel: null,
  isPushing: false,
  pushTimer: null,
  lastSyncTime: null,

  init() {
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('Supabase SDK not loaded or offline');
      return;
    }
    try {
      this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      this.client.auth.getSession().then(({ data, error }) => {
        if (!error && data && data.session) {
          this.user = data.session.user;
          this.onAuthSuccess(false);
        } else {
          this.updateStatusUI();
        }
      });

      this.client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          this.user = session.user;
          this.onAuthSuccess(true);
        } else if (event === 'SIGNED_OUT') {
          this.user = null;
          if (this.channel) {
            this.client.removeChannel(this.channel);
            this.channel = null;
          }
          this.updateStatusUI();
        }
      });
    } catch (e) {
      console.error('Failed to init Supabase:', e);
    }
  },

  updateStatusUI() {
    const dot = document.getElementById('cloudStatusDot');
    if (dot) dot.style.display = this.user ? 'block' : 'none';
    const toggle = document.getElementById('cloudToggle');
    if (toggle) {
      toggle.title = this.user ? `Terhubung: ${this.user.email} (Sinkron Aktif)` : 'Hubungkan Cloud (HP ↔ Laptop)';
    }
    const statsCloudBtn = document.getElementById('btnStatsCloud');
    if (statsCloudBtn && State.route === 'stats') {
      const isJa = (State.settings && State.settings.lang === 'ja');
      const titleEl = statsCloudBtn.querySelector('div > div:first-child');
      const subEl = statsCloudBtn.querySelector('div > div:last-child');
      const badgeEl = statsCloudBtn.querySelector('span:last-child');
      if (titleEl) titleEl.textContent = this.user ? (isJa ? 'クラウド同期中' : 'Sinkronisasi Aktif') : (isJa ? 'スマホとPCを連携' : 'Hubungkan HP & Laptop');
      if (subEl) subEl.textContent = this.user ? this.user.email : (isJa ? '進捗・ストリークをリアルタイム共有' : 'Sinkronkan progres & streak realtime');
      if (badgeEl) badgeEl.textContent = this.user ? '✓ ON' : (isJa ? '設定 →' : 'Masuk →');
    }
  },

  async onAuthSuccess(isNewLogin = false) {
    this.updateStatusUI();
    this.subscribeRealtime();
    await this.pullAndMerge(isNewLogin);
  },

  subscribeRealtime() {
    if (!this.client || !this.user) return;
    if (this.channel) {
      this.client.removeChannel(this.channel);
      this.channel = null;
    }
    this.channel = this.client
      .channel('public:user_sync:' + this.user.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_sync',
        filter: `user_id=eq.${this.user.id}`
      }, (payload) => {
        if (payload.new && !this.isPushing) {
          this.applyRemoteData(payload.new, true);
        }
      })
      .subscribe();
  },

  schedulePush() {
    if (!this.client || !this.user) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      this.pushToCloud();
    }, 1500);
  },

  async pushToCloud() {
    if (!this.client || !this.user) return;
    this.isPushing = true;
    try {
      const payload = {
        user_id: this.user.id,
        progress: State.progress,
        streak: State.streak,
        wrong_solved: State.wrongSolved,
        custom_readings: State.customReadings,
        read_completed: State.readCompleted,
        settings: State.settings,
        updated_at: new Date().toISOString()
      };
      const { error } = await this.client.from('user_sync').upsert(payload);
      if (error) console.error('Cloud push error:', error);
      else {
        this.lastSyncTime = new Date();
      }
    } catch (err) {
      console.error('Error during pushToCloud:', err);
    } finally {
      setTimeout(() => { this.isPushing = false; }, 500);
    }
  },

  async pullAndMerge(showToastOnAutoMigrate = false) {
    if (!this.client || !this.user) return;
    try {
      const { data, error } = await this.client
        .from('user_sync')
        .select('*')
        .eq('user_id', this.user.id)
        .maybeSingle();

      if (error) {
        console.error('Cloud pull error:', error);
        return;
      }

      if (!data) {
        await this.pushToCloud();
        if (showToastOnAutoMigrate) {
          toast('✅ Progres lokal berhasil disimpan ke cloud akun Anda!');
        }
      } else {
        this.applyRemoteData(data, false);
        await this.pushToCloud();
        if (showToastOnAutoMigrate) {
          toast('☁️ Progres berhasil disinkronkan!');
        }
      }
    } catch (err) {
      console.error('Error during pullAndMerge:', err);
    }
  },

  applyRemoteData(remote, isRealtimeEvent = false) {
    let changed = false;

    if (remote.progress && typeof remote.progress === 'object') {
      for (const [k, v] of Object.entries(remote.progress)) {
        const cur = State.progress[k];
        if (!cur) {
          State.progress[k] = v;
          changed = true;
        } else {
          const newBox = Math.max(cur.box || 0, v.box || 0);
          const newCorrect = Math.max(cur.correct || 0, v.correct || 0);
          const newWrong = Math.max(cur.wrong || 0, v.wrong || 0);
          const newLast = Math.max(cur.last || 0, v.last || 0);
          if (newBox !== cur.box || newCorrect !== cur.correct || newWrong !== cur.wrong) {
            State.progress[k] = {
              ...cur,
              ...v,
              box: newBox,
              correct: newCorrect,
              wrong: newWrong,
              last: newLast
            };
            changed = true;
          }
        }
      }
      localStorage.setItem(K.progress, JSON.stringify(State.progress));
    }

    if (remote.streak && typeof remote.streak === 'object') {
      const curSt = State.streak || { current: 0, best: 0, last: null };
      const remSt = remote.streak;
      const newCurrent = Math.max(curSt.current || 0, remSt.current || 0);
      const newBest = Math.max(curSt.best || 0, remSt.best || 0);
      const newLast = (remSt.last && (!curSt.last || remSt.last > curSt.last)) ? remSt.last : curSt.last;
      State.streak = { current: newCurrent, best: newBest, last: newLast };
      localStorage.setItem(K.streak, JSON.stringify(State.streak));
      changed = true;
    }

    if (remote.wrong_solved && typeof remote.wrong_solved === 'object') {
      for (const [k, v] of Object.entries(remote.wrong_solved)) {
        State.wrongSolved[k] = Math.max(State.wrongSolved[k] || 0, v || 0);
      }
      localStorage.setItem(K.wrongSolved, JSON.stringify(State.wrongSolved));
      changed = true;
    }

    if (Array.isArray(remote.custom_readings)) {
      const curList = State.customReadings || [];
      const idMap = new Map(curList.map(r => [r.id, r]));
      for (const r of remote.custom_readings) {
        if (!idMap.has(r.id)) {
          curList.push(r);
          changed = true;
        }
      }
      State.customReadings = curList;
      localStorage.setItem(K.customReadings, JSON.stringify(State.customReadings));
    }

    if (remote.read_completed && typeof remote.read_completed === 'object') {
      State.readCompleted = { ...(State.readCompleted || {}), ...remote.read_completed };
      localStorage.setItem(K.readCompleted, JSON.stringify(State.readCompleted));
      changed = true;
    }

    this.lastSyncTime = new Date();

    if (changed) {
      if (isRealtimeEvent) {
        toast('☁️ Progres terupdate dari perangkat lain!');
      }
      if (typeof navigate === 'function' && State.route) {
        const curRoute = State.route;
        const app = document.getElementById('app');
        if (app && Views[curRoute]) {
          Views[curRoute](app);
        }
      }
    }
  }
};

function openCloudModal() {
  const backdrop = document.getElementById('cloudModalBackdrop');
  const content = document.getElementById('cloudModalContent');
  if (!backdrop || !content) return;

  const isJa = (State.settings && State.settings.lang === 'ja');

  if (CloudSync.user) {
    const email = CloudSync.user.email || 'Pengguna';
    const lastSyncStr = CloudSync.lastSyncTime ? new Date(CloudSync.lastSyncTime).toLocaleTimeString() : (isJa ? 'たった今' : 'Baru saja');
    content.innerHTML = `
      <div style="text-align: center; padding: 10px 0 20px 0;">
        <div style="width: 58px; height: 58px; border-radius: 50%; background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15)); border: 2px solid #10b981; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; color: #10b981;">
          <svg style="width:28px;height:28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="9 11 12 14 22 4"/>
          </svg>
        </div>
        <h2 style="font-size: 19px; font-weight: 800; margin-bottom: 6px;">${isJa ? 'クラウド同期中' : 'Sinkronisasi Cloud Aktif'}</h2>
        <div style="font-size: 13.5px; color: var(--text-soft); word-break: break-all; margin-bottom: 12px;">
          ${esc(email)}
        </div>
        <div style="display:inline-flex; align-items:center; gap:6px; background: rgba(16,185,129,0.1); color:#10b981; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
          <span style="width:7px; height:7px; border-radius:50%; background:#10b981;"></span>
          ${isJa ? 'リアルタイム同期ON (スマホ ↔ PC)' : 'Realtime Sync Aktif (HP ↔ Laptop)'}
        </div>
        <p style="font-size: 13px; color: var(--text-dim); line-height: 1.5; margin-bottom: 18px;">
          ${isJa ? 'スマホとPCで同じアカウントを使用しているため、学習進捗やストリークが自動で同期されます。' : 'Progres belajar, hafalan kata, dan api streak Anda otomatis tersinkron antara HP dan Laptop.'}
        </p>
        <div style="font-size: 12px; color: var(--text-dim); margin-bottom: 20px;">
          ${isJa ? '最終同期' : 'Terakhir disinkronkan'}: <b>${lastSyncStr}</b>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="btn" id="btnForceSync" style="height: 42px; font-weight: 700; border-radius: 12px; background: var(--primary); color: white; cursor:pointer;">
            🔄 ${isJa ? '今すぐ同期' : 'Sinkronkan Sekarang'}
          </button>
          <button class="btn ghost" id="btnSignOut" style="height: 40px; border-radius: 12px; color: var(--red); cursor:pointer;">
            ${isJa ? 'ログアウト' : 'Keluar Akun'}
          </button>
          <button class="btn ghost" id="btnCloseCloudModal" style="height: 38px; border-radius: 12px; font-size: 13px; cursor:pointer;">
            ${isJa ? '閉じる' : 'Tutup'}
          </button>
        </div>
      </div>
    `;

    content.querySelector('#btnForceSync').onclick = async () => {
      const btn = content.querySelector('#btnForceSync');
      btn.disabled = true;
      btn.textContent = isJa ? '同期中...' : 'Menyinkronkan...';
      await CloudSync.pullAndMerge(true);
      btn.disabled = false;
      btn.textContent = '🔄 ' + (isJa ? '今すぐ同期' : 'Sinkronkan Sekarang');
      closeCloudModal();
    };

    content.querySelector('#btnSignOut').onclick = async () => {
      if (confirm(isJa ? 'ログアウトしますか？ローカルのデータは端末に残ります。' : 'Yakin ingin keluar akun? Data lokal akan tetap tersimpan di perangkat ini.')) {
        await CloudSync.client.auth.signOut();
        toast(isJa ? 'ログアウトしました' : 'Berhasil keluar akun');
        closeCloudModal();
      }
    };

    content.querySelector('#btnCloseCloudModal').onclick = closeCloudModal;
  } else {
    let isRegister = false;

    const renderAuthForm = () => {
      content.innerHTML = `
        <div style="padding: 6px 0 16px 0;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 52px; height: 52px; border-radius: 16px; background: var(--primary-soft); margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center; color: var(--primary);">
              <svg style="width:26px;height:26px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
              </svg>
            </div>
            <h2 style="font-size: 18.5px; font-weight: 800; margin-bottom: 6px;">
              ${isRegister ? (isJa ? '新規アカウント作成' : 'Buat Akun Cloud Baru') : (isJa ? 'クラウド同期ログイン' : 'Masuk Akun Cloud Kotoba')}
            </h2>
            <p style="font-size: 13px; color: var(--text-dim); line-height: 1.45;">
              ${isJa ? 'スマホとPCで同じアカウントでログインすると、進捗がリアルタイムに連動します。' : 'Gunakan akun yang sama di HP & Laptop agar hafalan dan api streak Anda terhubung real-time.'}
            </p>
          </div>

          <div style="display:flex; background:var(--bg-soft); padding:3px; border-radius:12px; margin-bottom:18px;">
            <button id="tabLogin" type="button" style="flex:1; padding:8px; border-radius:10px; font-weight:700; font-size:13px; border:none; cursor:pointer; background:${!isRegister ? 'var(--bg-elev)' : 'transparent'}; color:${!isRegister ? 'var(--text)' : 'var(--text-dim)'}; box-shadow:${!isRegister ? 'var(--shadow-sm)' : 'none'};">
              ${isJa ? 'ログイン' : 'Masuk'}
            </button>
            <button id="tabRegister" type="button" style="flex:1; padding:8px; border-radius:10px; font-weight:700; font-size:13px; border:none; cursor:pointer; background:${isRegister ? 'var(--bg-elev)' : 'transparent'}; color:${isRegister ? 'var(--text)' : 'var(--text-dim)'}; box-shadow:${isRegister ? 'var(--shadow-sm)' : 'none'};">
              ${isJa ? 'アカウント作成' : 'Daftar Akun'}
            </button>
          </div>

          <form id="cloudAuthForm" style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:var(--text-soft); margin-bottom:5px;">
                Email
              </label>
              <input type="email" id="authEmail" required placeholder="nama@gmail.com" style="width:100%; height:42px; border-radius:10px; border:1px solid var(--border); background:var(--bg); color:var(--text); padding:0 12px; font-size:14px; outline:none;" />
            </div>

            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:var(--text-soft); margin-bottom:5px;">
                Password
              </label>
              <input type="password" id="authPassword" required minlength="6" placeholder="${isJa ? '6文字以上' : 'Minimal 6 karakter'}" style="width:100%; height:42px; border-radius:10px; border:1px solid var(--border); background:var(--bg); color:var(--text); padding:0 12px; font-size:14px; outline:none;" />
            </div>

            <div id="authErrorMsg" style="display:none; color:var(--red); font-size:12.5px; line-height:1.4; background:var(--red-soft); padding:8px 12px; border-radius:8px;"></div>

            <button type="submit" id="btnAuthSubmit" class="btn block" style="height:44px; border-radius:12px; font-weight:700; margin-top:6px; background:var(--primary); color:white; border:none; cursor:pointer;">
              ${isRegister ? (isJa ? '無料アカウント作成' : 'Daftar Akun Cloud') : (isJa ? 'ログイン' : 'Masuk & Sinkronkan')}
            </button>

            <div style="font-size:11.5px; color:var(--text-dim); text-align:center; line-height:1.4; margin-top:4px;">
              🛡️ ${isJa ? '現在の端末の学習進捗は自動で引き継がれ、消失しません。' : 'Progres belajar di perangkat Anda saat ini akan otomatis tersimpan aman ke cloud.'}
            </div>

            <button type="button" id="btnCancelAuth" class="btn ghost block" style="height:36px; border-radius:10px; font-size:13px; margin-top:4px; cursor:pointer;">
              ${isJa ? 'キャンセル' : 'Batal'}
            </button>
          </form>
        </div>
      `;

      content.querySelector('#tabLogin').onclick = () => { isRegister = false; renderAuthForm(); };
      content.querySelector('#tabRegister').onclick = () => { isRegister = true; renderAuthForm(); };
      content.querySelector('#btnCancelAuth').onclick = closeCloudModal;

      const form = content.querySelector('#cloudAuthForm');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const email = content.querySelector('#authEmail').value.trim();
        const password = content.querySelector('#authPassword').value;
        const errDiv = content.querySelector('#authErrorMsg');
        const submitBtn = content.querySelector('#btnAuthSubmit');

        errDiv.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = isJa ? '処理中...' : 'Memproses...';

        try {
          if (isRegister) {
            const { data, error } = await CloudSync.client.auth.signUp({ email, password });
            if (error) throw error;
            if (data.session) {
              toast(isJa ? 'アカウントを作成しました！' : 'Akun berhasil dibuat & tersambung! 🎉');
              closeCloudModal();
            } else {
              errDiv.style.display = 'block';
              errDiv.style.background = 'var(--primary-soft)';
              errDiv.style.color = 'var(--primary)';
              errDiv.textContent = isJa 
                ? '確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。' 
                : 'Pendaftaran berhasil! Cek inbox email Anda untuk klik link konfirmasi akun.';
            }
          } else {
            const { data, error } = await CloudSync.client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            toast(isJa ? 'ログインしました！' : 'Berhasil masuk & tersinkron! ☁️');
            closeCloudModal();
          }
        } catch (err) {
          errDiv.style.display = 'block';
          errDiv.style.background = 'var(--red-soft)';
          errDiv.style.color = 'var(--red)';
          errDiv.textContent = err.message || (isJa ? 'エラーが発生しました' : 'Gagal menghubungkan. Cek email dan password Anda.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = isRegister ? (isJa ? '無料アカウント作成' : 'Daftar Akun Cloud') : (isJa ? 'ログイン' : 'Masuk & Sinkronkan');
        }
      };
    };

    renderAuthForm();
  }

  backdrop.classList.add('show');
}

function closeCloudModal() {
  const backdrop = document.getElementById('cloudModalBackdrop');
  if (backdrop) backdrop.classList.remove('show');
}

/* ============================================================
   BOOT
   ============================================================ */
async function boot() {
  applySettings();
  document.getElementById('furiToggle').onclick = toggleFurigana;
  document.getElementById('themeToggle').onclick = toggleTheme;
  const ltBtn = document.getElementById('langToggle');
  if (ltBtn) ltBtn.onclick = () => toggleLang();

  // Cloud Sync setup
  const cloudBtn = document.getElementById('cloudToggle');
  if (cloudBtn) cloudBtn.onclick = openCloudModal;
  const cloudBackdrop = document.getElementById('cloudModalBackdrop');
  if (cloudBackdrop) {
    cloudBackdrop.onclick = (e) => {
      if (e.target === cloudBackdrop) closeCloudModal();
    };
  }
  if (typeof CloudSync !== 'undefined' && CloudSync.init) {
    CloudSync.init();
  }

  // Global dismiss for modals
  const modalBackdrop = document.getElementById('kotobaModalBackdrop');
  if (modalBackdrop) {
    modalBackdrop.onclick = (e) => {
      if (e.target === modalBackdrop) closeKotobaModal();
    };
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeKotobaModal();
      closeCloudModal();
    }
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
      document.getElementById('app').innerHTML = `<div class="view"><div class="empty"><div class="big">${ICONS.warning}</div>Gagal memuat data kosakata.<br><small>Coba jalankan lewat server: “python3 -m http.server”</small></div></div>`;
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
