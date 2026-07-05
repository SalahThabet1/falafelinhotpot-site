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
