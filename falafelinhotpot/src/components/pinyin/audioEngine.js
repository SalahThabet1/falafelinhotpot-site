const MAX_CACHE = 200;

let ctx = null;
let unlocked = false;
const cache = new Map();
let currentSource = null;

function getContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function unlockiOS() {
  if (unlocked || !ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
  unlocked = true;
}

function evictLRU() {
  if (cache.size <= MAX_CACHE) return;
  const oldest = cache.keys().next().value;
  cache.delete(oldest);
}

async function getBuffer(url) {
  if (cache.has(url)) {
    const buf = cache.get(url);
    cache.delete(url);
    cache.set(url, buf);
    return buf;
  }

  const resp = await fetch(url);
  const arrayBuf = await resp.arrayBuffer();
  const audioBuf = await ctx.decodeAudioData(arrayBuf);

  evictLRU();
  cache.set(url, audioBuf);
  return audioBuf;
}

/* Tone-marked pinyin → audio filename converter */
const TONE_TO_NUM = {'ā':'a1','á':'a2','ǎ':'a3','à':'a4',
  'ē':'e1','é':'e2','ě':'e3','è':'e4',
  'ī':'i1','í':'i2','ǐ':'i3','ì':'i4',
  'ō':'o1','ó':'o2','ǒ':'o3','ò':'o4',
  'ū':'u1','ú':'u2','ǔ':'u3','ù':'u4',
  'ǖ':'v1','ǘ':'v2','ǚ':'v3','ǜ':'v4',
  'ü':'v'};

export function pinyinAudioSrc(py) {
  let s = '', t = '';
  for (const ch of py) {
    const m = TONE_TO_NUM[ch];
    if (m) { if (m[1]) { t = m[1]; s += m[0]; } else s += m; }
    else s += ch;
  }
  return `/audio/${s}${t}.mp3`;
}

export function initAudio() {
  getContext();
}

export function unlockAudio() {
  const c = getContext();
  if (c) unlockiOS();
}

export function stopAudio() {
  if (currentSource) {
    try { currentSource.stop(); } catch (_) {}
    currentSource = null;
  }
}

let fallbackAudio = null;

export async function playAudio(url, onEnded) {
  const c = getContext();

  if (!c) {
    if (fallbackAudio) { fallbackAudio.pause(); fallbackAudio.currentTime = 0; }
    fallbackAudio = new Audio(url);
    if (onEnded) fallbackAudio.onended = onEnded;
    fallbackAudio.play().catch(() => {});
    return;
  }

  if (c.state === 'suspended') await c.resume();

  stopAudio();

  try {
    const buffer = await getBuffer(url);
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.connect(c.destination);
    if (onEnded) source.onended = onEnded;
    source.start(0);
    currentSource = source;
  } catch (_) {
    if (fallbackAudio) fallbackAudio.pause();
    fallbackAudio = new Audio(url);
    if (onEnded) fallbackAudio.onended = onEnded;
    fallbackAudio.play().catch(() => {});
  }
}

export function preloadAudio(url) {
  const c = getContext();
  if (!c) return;
  if (cache.has(url)) return;
  getBuffer(url).catch(() => {});
}

const PRELOAD_CONCURRENCY = 6;

export function preloadBatch(urls) {
  const c = getContext();
  if (!c) return;

  let i = 0;
  function nextInLane() {
    if (i >= urls.length) return;
    const url = urls[i++];
    if (cache.has(url)) {
      nextInLane();
      return;
    }
    getBuffer(url).catch(() => {}).then(scheduleNext, scheduleNext);
  }
  function scheduleNext() {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(nextInLane);
    } else {
      setTimeout(nextInLane, 0);
    }
  }

  const lanes = Math.min(PRELOAD_CONCURRENCY, urls.length);
  for (let lane = 0; lane < lanes; lane++) nextInLane();
}
