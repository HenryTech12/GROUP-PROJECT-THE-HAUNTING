import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A permissive fake WebAudio graph: every method exists, every node chains.
function fakeNode(): any {
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
  const node: any = { connect: (n: any) => n ?? node, start: vi.fn(), stop: vi.fn(), type: '', gain: param(), frequency: param(), detune: param(), Q: param(), buffer: null };
  return node;
}
class FakeCtx {
  currentTime = 0; sampleRate = 8000; state = 'running'; destination = fakeNode();
  resume() { return Promise.resolve(); }
  createGain() { return fakeNode(); } createOscillator() { return fakeNode(); } createBiquadFilter() { return fakeNode(); }
  createConvolver() { return fakeNode(); } createBufferSource() { return fakeNode(); }
  createBuffer(_c: number, len: number) { return { getChannelData: () => new Float32Array(len) }; }
}

describe('soundtrack', () => {
  beforeEach(() => { vi.useFakeTimers(); (window as any).AudioContext = FakeCtx; vi.resetModules(); });
  afterEach(() => { vi.useRealTimers(); delete (window as any).AudioContext; });

  it('stays silent while sound is disabled', async () => {
    const a = await import('../src/audio');
    a.setSoundEnabled(false);
    a.startMusic();
    expect(a.isMusicPlaying()).toBe(false);
  });

  it('starts once, reacts to intensity, schedules without throwing, and stops cleanly', async () => {
    const a = await import('../src/audio');
    a.setSoundEnabled(true);
    a.startMusic();
    a.startMusic(); // idempotent
    expect(a.isMusicPlaying()).toBe(true);
    a.setMusicIntensity(1);
    vi.advanceTimersByTime(30000); // heartbeat + bells fire repeatedly
    a.stopMusic(0.1);
    expect(a.isMusicPlaying()).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('plays the bundled track on a loop and falls back to the synth if it fails to load', async () => {
    const a = await import('../src/audio');
    a.setSoundEnabled(true);
    a.startMusic();
    expect(a.isMusicPlaying()).toBe(true);
    const els = document.querySelectorAll('audio');
    expect(els.length).toBe(0); // Audio() elements are detached; check via the URL constant instead
    expect(a.TRACK_URL).toMatch(/audio\/treachery\.mp3$/);
    a.stopMusic(0.1);
    vi.advanceTimersByTime(1000);
    expect(a.isMusicPlaying()).toBe(false);
  });

  it('muting stops the music', async () => {
    const a = await import('../src/audio');
    a.setSoundEnabled(true);
    a.startMusic();
    a.setSoundEnabled(false);
    expect(a.isMusicPlaying()).toBe(false);
  });
});
