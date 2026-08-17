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

/* ── Loudness normalization ──
   The audio library (2000+ short clips, recorded/sourced at different
   times) has inconsistent loudness. Rather than re-encode every file, each
   clip's playback gain is derived once from its own RMS level and cached
   alongside the decoded buffer, so quiet clips play louder and loud clips
   play quieter — landing everything near the same perceived loudness. */
const TARGET_RMS = 0.15;
const MAX_GAIN = 4;    // +12dB cap — don't amplify near-silent/noisy clips into a hiss
const MIN_GAIN = 0.25; // -12dB cap — don't crush an already-loud clip to near nothing

function computeRMS(buffer) {
  let sumSquares = 0;
  let count = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      sumSquares += data[i] * data[i];
      count++;
    }
  }
  return count ? Math.sqrt(sumSquares / count) : 0;
}

function computeNormalizationGain(buffer) {
  const rms = computeRMS(buffer);
  if (rms < 1e-4) return 1; // effectively silent — don't amplify noise floor
  const gain = TARGET_RMS / rms;
  return Math.min(MAX_GAIN, Math.max(MIN_GAIN, gain));
}

async function getBuffer(url) {
  if (cache.has(url)) {
    const entry = cache.get(url);
    cache.delete(url);
    cache.set(url, entry);
    return entry;
  }

  const resp = await fetch(url);
  const arrayBuf = await resp.arrayBuffer();
  const audioBuf = await ctx.decodeAudioData(arrayBuf);
  const entry = { buffer: audioBuf, gain: computeNormalizationGain(audioBuf) };

  evictLRU();
  cache.set(url, entry);
  return entry;
}

/* Tone-marked pinyin → audio filename converter */
const TONE_TO_NUM = {'ā':'a1','á':'a2','ǎ':'a3','à':'a4',
  'ē':'e1','é':'e2','ě':'e3','è':'e4',
  'ī':'i1','í':'i2','ǐ':'i3','ì':'i4',
  'ō':'o1','ó':'o2','ǒ':'o3','ò':'o4',
  'ū':'u1','ú':'u2','ǔ':'u3','ù':'u4',
  'ǖ':'v1','ǘ':'v2','ǚ':'v3','ǜ':'v4',
  'ü':'v'};

/* Folds a tone-marked pinyin string (mā, lü, xuě...) down to its base
   letters (with 'v' standing in for 'ü', matching the "use 'v' for 'ü'"
   search convention) plus a separate tone digit, e.g. 'mā' -> {base:'ma',
   tone:'1'}, 'lü' -> {base:'lv', tone:''}. Shared by the audio filename
   builder below and by the search matching in PinyinChartApp.jsx, so
   there's exactly one place that knows how to read a toned character. */
export function foldPinyinKey(py) {
  let s = '', t = '';
  for (const ch of py) {
    const m = TONE_TO_NUM[ch];
    if (m) { if (m[1]) { t = m[1]; s += m[0]; } else s += m; }
    else s += ch.toLowerCase();
  }
  return { base: s, tone: t };
}

export function pinyinAudioSrc(py) {
  const { base, tone } = foldPinyinKey(py);
  return `/audio/${base}${tone}.mp3`;
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
    try {
      currentSource.stop();
    } catch {
      // noop — stopping an already-stopped source throws; safe to ignore
    }
    currentSource = null;
  }
}

let fallbackAudio = null;

/* Shared across plays — a gentle leveler that narrows peak-to-peak
   variance on top of the per-clip gain, so the "wave energy" envelope
   (not just average loudness) reads as consistent clip to clip. */
let sharedCompressor = null;
function getCompressor(c) {
  if (!sharedCompressor) {
    sharedCompressor = c.createDynamicsCompressor();
    sharedCompressor.threshold.value = -24;
    sharedCompressor.knee.value = 30;
    sharedCompressor.ratio.value = 4;
    sharedCompressor.attack.value = 0.003;
    sharedCompressor.release.value = 0.25;
    sharedCompressor.connect(c.destination);
  }
  return sharedCompressor;
}

export async function playAudio(url, onEnded) {
  const c = getContext();

  if (!c) {
    if (fallbackAudio) { fallbackAudio.pause(); fallbackAudio.currentTime = 0; }
    fallbackAudio = new Audio(url);
    fallbackAudio.volume = 0.9;
    if (onEnded) fallbackAudio.onended = onEnded;
    fallbackAudio.play().catch(() => {});
    return;
  }

  if (c.state === 'suspended') await c.resume();

  stopAudio();

  try {
    const { buffer, gain } = await getBuffer(url);
    const source = c.createBufferSource();
    source.buffer = buffer;

    const gainNode = c.createGain();
    gainNode.gain.value = gain;

    source.connect(gainNode);
    gainNode.connect(getCompressor(c));

    if (onEnded) source.onended = onEnded;
    source.start(0);
    currentSource = source;
  } catch {
    if (fallbackAudio) fallbackAudio.pause();
    fallbackAudio = new Audio(url);
    fallbackAudio.volume = 0.9;
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
