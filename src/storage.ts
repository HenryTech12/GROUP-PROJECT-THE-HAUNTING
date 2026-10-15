import type { EndingId } from './game/types';

const KEY = 'gpth:v1';

export interface Saved {
  sound: boolean;
  reduceMotion: boolean | null; // null = follow system
  openingSeen: boolean;
  endings: EndingId[];
  bestProgress: number;
  plays: number;
}

const DEFAULTS: Saved = { sound: false, reduceMotion: null, openingSeen: false, endings: [], bestProgress: 0, plays: 0 };

export function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<Saved>;
    return {
      sound: p.sound === true,
      reduceMotion: typeof p.reduceMotion === 'boolean' ? p.reduceMotion : null,
      openingSeen: p.openingSeen === true,
      endings: Array.isArray(p.endings) ? p.endings.filter((e): e is EndingId => ['last-word', 'credit', 'overdue'].includes(e as string)) : [],
      bestProgress: typeof p.bestProgress === 'number' ? p.bestProgress : 0,
      plays: typeof p.plays === 'number' ? p.plays : 0,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function persist(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable: preferences just won't persist */
  }
}
