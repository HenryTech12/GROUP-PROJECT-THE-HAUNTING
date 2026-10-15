/** Tiny WebAudio synth. Silent until the player turns sound on (needs a user gesture anyway). */
let ctx: AudioContext | null = null;
let enabled = false;
let rain: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (!on) stopRain();
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.05, slide = 0) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

export type Sfx = 'tap' | 'ping' | 'good' | 'bad' | 'ghost' | 'glitch';

export function sfx(name: Sfx) {
  switch (name) {
    case 'tap': return tone(520, 0.06, 'triangle', 0.04);
    case 'ping': return tone(880, 0.14, 'sine', 0.05), setTimeout(() => tone(1175, 0.18, 'sine', 0.04), 90), undefined;
    case 'good': return tone(440, 0.12, 'triangle', 0.05), setTimeout(() => tone(660, 0.2, 'triangle', 0.05), 100), undefined;
    case 'bad': return tone(180, 0.3, 'sawtooth', 0.04, -80);
    case 'ghost': return tone(300, 0.8, 'sine', 0.05, -180), tone(305, 0.8, 'sine', 0.04, -190), undefined;
    case 'glitch': return tone(90, 0.12, 'square', 0.04), undefined;
  }
}

export function startRain() {
  const c = getCtx();
  if (!c || rain) return;
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 900;
  const gain = c.createGain();
  gain.gain.value = 0.015;
  src.connect(f).connect(gain).connect(c.destination);
  src.start();
  rain = { src, gain };
}

export function stopRain() {
  if (!rain) return;
  try {
    rain.src.stop();
  } catch {
    /* already stopped */
  }
  rain = null;
}
