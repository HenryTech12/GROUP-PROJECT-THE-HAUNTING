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
  if (!on) {
    stopRain();
    stopMusic(0.3);
  }
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
  gain.gain.value = 0.03;
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

/* ------------------------------------------------------------------
 * "Treachery in Bleach" — original generative score (no audio files).
 * Cold detuned drone + sub heartbeat + glassy D-phrygian bells in a
 * long reverb tail. Intensity 0..1 speeds the pulse and adds a tritone.
 * ------------------------------------------------------------------ */
export const SOUNDTRACK_TITLE = 'Treachery in Bleach';

interface Music {
  master: GainNode;
  reverbIn: GainNode;
  nodes: (AudioScheduledSourceNode)[];
  tritone: GainNode;
  filter: BiquadFilterNode;
  timers: number[];
  intensity: number;
}
let music: Music | null = null;

const BELLS = [587.33, 622.25, 698.46, 783.99, 880, 932.33, 1174.66];

function impulse(c: AudioContext, seconds = 3.2): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

function startSynth() {
  const c = getCtx();
  if (!c || music) return;
  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, c.currentTime);
  master.gain.exponentialRampToValueAtTime(0.9, c.currentTime + 4);
  master.connect(c.destination);

  const reverb = c.createConvolver();
  reverb.buffer = impulse(c);
  const reverbIn = c.createGain();
  reverbIn.gain.value = 0.7;
  reverbIn.connect(reverb);
  const wet = c.createGain();
  wet.gain.value = 0.9;
  reverb.connect(wet).connect(master);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  filter.Q.value = 4;
  const drone = c.createGain();
  drone.gain.value = 0.05;
  filter.connect(drone);
  drone.connect(master);
  drone.connect(reverbIn);

  const nodes: AudioScheduledSourceNode[] = [];
  const mk = (f: number, type: OscillatorType, det = 0) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = det;
    o.connect(filter);
    o.start();
    nodes.push(o);
  };
  mk(73.42, 'sawtooth', -7);
  mk(73.42, 'sawtooth', 9);
  mk(110, 'triangle', 4);
  mk(36.71, 'sine');

  // slow breathing of the filter
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();
  nodes.push(lfo);

  // tritone that fades in when intensity rises
  const tritone = c.createGain();
  tritone.gain.value = 0;
  const tri = c.createOscillator();
  tri.type = 'sawtooth';
  tri.frequency.value = 103.83;
  tri.connect(tritone).connect(filter);
  tri.start();
  nodes.push(tri);

  const m: Music = { master, reverbIn, nodes, tritone, filter, timers: [], intensity: 0 };
  music = m;

  const bus = (g: GainNode) => {
    g.connect(master);
    g.connect(reverbIn);
  };
  const thump = (at: number, vol: number) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(70, at);
    o.frequency.exponentialRampToValueAtTime(38, at + 0.22);
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.26);
    o.connect(g);
    g.connect(master);
    o.start(at);
    o.stop(at + 0.3);
  };
  const heartbeat = () => {
    if (music !== m) return;
    const now = c.currentTime;
    thump(now, 0.16 + m.intensity * 0.08);
    thump(now + 0.2, 0.1 + m.intensity * 0.06);
    m.timers.push(window.setTimeout(heartbeat, 1700 - m.intensity * 900));
  };
  const bell = () => {
    if (music !== m) return;
    const now = c.currentTime;
    const f = BELLS[Math.floor(Math.random() * BELLS.length)];
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o2.type = 'sine';
    o.frequency.value = f;
    o2.frequency.value = f * 2.01;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
    o.connect(g);
    o2.connect(g);
    bus(g);
    o.start(now);
    o2.start(now);
    o.stop(now + 3.5);
    o2.stop(now + 3.5);
    m.timers.push(window.setTimeout(bell, (2600 + Math.random() * 3800) * (1 - m.intensity * 0.55)));
  };
  m.timers.push(window.setTimeout(heartbeat, 1200));
  m.timers.push(window.setTimeout(bell, 2200));
}

function setSynthIntensity(level: number) {
  if (!music || !ctx) return;
  const v = Math.min(1, Math.max(0, level));
  music.intensity = v;
  music.tritone.gain.linearRampToValueAtTime(v * 0.05, ctx.currentTime + 2);
  music.filter.frequency.linearRampToValueAtTime(420 + v * 500, ctx.currentTime + 2);
}

function stopSynth(fade: number) {
  const m = music;
  if (!m) return;
  music = null;
  m.timers.forEach((t) => window.clearTimeout(t));
  const c = ctx;
  if (!c) return;
  try {
    m.master.gain.cancelScheduledValues(c.currentTime);
    m.master.gain.setValueAtTime(Math.max(m.master.gain.value, 0.0001), c.currentTime);
    m.master.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + fade);
  } catch {
    /* ignore */
  }
  window.setTimeout(() => m.nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }), fade * 1000 + 100);
}

/* ------------------------------------------------------------------
 * Soundtrack: the bundled "Treachery" track (public/audio/treachery.mp3)
 * loops for the whole run. If the file is missing or cannot be decoded,
 * the generative score above plays instead.
 * ------------------------------------------------------------------ */
export const TRACK_URL = `${import.meta.env.BASE_URL}audio/treachery.mp3`;
const BASE_VOLUME = 0.5;

let track: HTMLAudioElement | null = null;
let trackIntensity = 0;
let fadeTimer: number | null = null;

function fadeTrack(target: number, ms: number, done?: () => void) {
  if (fadeTimer !== null) window.clearInterval(fadeTimer);
  const el = track;
  if (!el) return;
  const from = el.volume;
  const steps = Math.max(1, Math.round(ms / 50));
  let i = 0;
  fadeTimer = window.setInterval(() => {
    i += 1;
    el.volume = Math.min(1, Math.max(0, from + ((target - from) * i) / steps));
    if (i >= steps) {
      if (fadeTimer !== null) window.clearInterval(fadeTimer);
      fadeTimer = null;
      done?.();
    }
  }, 50);
}

function tryPlay(el: HTMLAudioElement) {
  try {
    const p = el.play() as Promise<void> | undefined;
    p?.then(() => fadeTrack(BASE_VOLUME + trackIntensity * 0.25, 2500)).catch(() => {
      /* autoplay blocked: the next tap calls startMusic() again */
    });
  } catch {
    /* media playback unavailable */
  }
}

export function isMusicPlaying() {
  return track !== null || music !== null;
}

export function startMusic() {
  if (!enabled) return;
  if (track) {
    if (track.paused) tryPlay(track);
    return;
  }
  if (music) return;
  if (typeof Audio === 'undefined') return startSynth();
  const el = new Audio(TRACK_URL);
  el.loop = true;
  el.volume = 0;
  el.preload = 'auto';
  el.addEventListener('error', () => {
    if (track !== el) return;
    track = null;
    if (enabled) startSynth();
  });
  track = el;
  tryPlay(el);
}

export function setMusicIntensity(level: number) {
  trackIntensity = Math.min(1, Math.max(0, level));
  if (track && !track.paused) fadeTrack(BASE_VOLUME + trackIntensity * 0.25, 2000);
  setSynthIntensity(level);
}

export function stopMusic(fade = 1.2) {
  const el = track;
  if (el) {
    track = null;
    if (fadeTimer !== null) window.clearInterval(fadeTimer);
    const from = el.volume;
    const steps = Math.max(1, Math.round((fade * 1000) / 50));
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      el.volume = Math.max(0, from * (1 - i / steps));
      if (i >= steps) {
        window.clearInterval(id);
        el.pause();
        el.currentTime = 0;
      }
    }, 50);
  }
  stopSynth(fade);
}
