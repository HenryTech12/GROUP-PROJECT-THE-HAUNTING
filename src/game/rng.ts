/** Small deterministic PRNG (mulberry32). State is just a 32-bit integer so it lives in game state. */
export function nextRandom(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) >>> 0;
  const newSeed = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, newSeed];
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
