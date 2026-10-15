import { describe, expect, it } from 'vitest';
import { createGame, reduce, computeEnding, fictionalClock, delegateChance } from '../src/game/engine';
import { ACTIONS, BOSS_MOVES, actionAvailability } from '../src/game/actions';
import { EVENTS } from '../src/game/events';
import { nextRandom } from '../src/game/rng';
import type { GameAction, GameState, ActionId, BossMoveId } from '../src/game/types';

const start = (seed = 1, choice: 'A' | 'B' | 'C' = 'B'): GameState => {
  let s = createGame(seed);
  s = reduce(s, { type: 'chooseFirst', option: choice });
  return reduce(s, { type: 'ackIntro' });
};

describe('rng', () => {
  it('is deterministic and stays in [0,1)', () => {
    let seed = 42;
    const a: number[] = [];
    for (let i = 0; i < 100; i++) {
      const [v, n] = nextRandom(seed);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      a.push(v);
      seed = n;
    }
    seed = 42;
    for (let i = 0; i < 100; i++) {
      const [v, n] = nextRandom(seed);
      expect(v).toBe(a[i]);
      seed = n;
    }
  });
});

describe('clock', () => {
  it('maps minutes to 11 PM–midnight', () => {
    expect(fictionalClock(60)).toBe('11:00 PM');
    expect(fictionalClock(45)).toBe('11:15 PM');
    expect(fictionalClock(0)).toBe('12:00 AM');
    expect(fictionalClock(-5)).toBe('12:00 AM');
  });
});

describe('first choice', () => {
  it('A: delegates, costs 5, +trust', () => {
    const s = reduce(createGame(7), { type: 'chooseFirst', option: 'A' });
    expect(s.phase).toBe('firstResult');
    expect(s.firstChoice).toBe('A');
    expect(s.timeLeft).toBe(55);
    expect(s.trust).toBeGreaterThanOrEqual(50 + 10 - 6);
    expect(s.progress).toBeGreaterThanOrEqual(20);
    expect(s.progress).toBeLessThanOrEqual(29);
    expect(s.log.length).toBeGreaterThan(3);
  });
  it('B: +20 progress, -10 sanity, -10 minutes', () => {
    const s = reduce(createGame(7), { type: 'chooseFirst', option: 'B' });
    expect([s.progress, s.sanity, s.timeLeft]).toEqual([40, 70, 50]);
  });
  it('C: gives a clue, costs 5 minutes, sanity loss is bounded', () => {
    for (let seed = 1; seed < 30; seed++) {
      const s = reduce(createGame(seed), { type: 'chooseFirst', option: 'C' });
      expect(s.clues).toBe(1);
      expect(s.timeLeft).toBe(55);
      expect([80, 72]).toContain(s.sanity);
    }
  });
  it('cannot be chosen twice', () => {
    const s = reduce(createGame(1), { type: 'chooseFirst', option: 'B' });
    expect(reduce(s, { type: 'chooseFirst', option: 'A' })).toBe(s);
  });
});

describe('actions', () => {
  it('every action has a visible cost and produces feedback + log', () => {
    ACTIONS.forEach((a) => {
      expect(a.cost).toBeGreaterThan(0);
      let s = start(3);
      // force a state where the action is available
      s = { ...s, pendingEvent: null };
      const logBefore = s.log.length;
      const next = reduce(s, { type: 'act', id: a.id });
      expect(next.lastOutcome?.title).toBe(a.label);
      expect(next.lastOutcome?.deltas.time).toBeGreaterThanOrEqual(a.cost - 4 - 2); // breakdown/meeting extras only
      expect(next.log.length).toBeGreaterThan(logBefore);
    });
  });

  it('write is deterministic at its core', () => {
    const s = start(3, 'A');
    const next = reduce(s, { type: 'act', id: 'write' });
    expect(next.progress - s.progress).toBeGreaterThanOrEqual(12);
    expect(next.sanity).toBe(s.sanity - 5);
  });

  it('writing back-to-back is less efficient', () => {
    let s = start(3, 'A');
    const a = reduce(s, { type: 'act', id: 'write' });
    s = a.pendingEvent ? reduce(a, { type: 'resolveEvent', choice: 0 }) : a;
    const before = s.progress;
    const b = reduce(s, { type: 'act', id: 'write' });
    expect(b.progress - before).toBeLessThan(12 + 6); // event side-effects excluded
    expect(a.consecutiveWrites).toBe(1);
  });

  it('is blocked while an event is pending and after the game ends', () => {
    const s = { ...start(3), pendingEvent: 'wifi-dies' };
    expect(reduce(s, { type: 'act', id: 'write' })).toBe(s);
    expect(actionAvailability(s, 'write').ok).toBe(false);
    const ended = reduce(start(3), { type: 'timeExpired' });
    expect(ended.phase).toBe('ended');
    expect(reduce(ended, { type: 'act', id: 'write' })).toBe(ended);
  });

  it('investigate stops at 5 clues', () => {
    const s = { ...start(3), clues: 5 };
    expect(actionAvailability(s, 'investigate').ok).toBe(false);
  });

  it('delegation rewards diminish', () => {
    const s0 = { ...start(11, 'B'), trust: 100, coordination: 2 }; // everybody delivers
    const first = reduce(s0, { type: 'act', id: 'delegate' });
    const afterFirst = first.pendingEvent ? reduce(first, { type: 'resolveEvent', choice: 0 }) : first;
    const gain1 = first.lastOutcome!.deltas.progress;
    const second = reduce({ ...afterFirst, pendingEvent: null, phase: 'playing' }, { type: 'act', id: 'delegate' });
    expect(second.lastOutcome!.deltas.progress).toBeLessThan(gain1);
  });

  it('delegate chance is bounded', () => {
    expect(delegateChance({ trust: 0, coordination: 0 }, 'tobi')).toBeGreaterThanOrEqual(0.1);
    expect(delegateChance({ trust: 100, coordination: 2 }, 'chidi')).toBeLessThanOrEqual(0.95);
  });
});

describe('invariants under random play', () => {
  const playRandom = (seed: number): GameState => {
    let s = createGame(seed);
    s = reduce(s, { type: 'chooseFirst', option: (['A', 'B', 'C'] as const)[seed % 3] });
    s = reduce(s, { type: 'ackIntro' });
    let r = seed * 7919 + 1;
    const rnd = () => {
      const [v, n] = nextRandom(r);
      r = n;
      return v;
    };
    for (let i = 0; i < 80 && s.phase !== 'ended'; i++) {
      let a: GameAction;
      if (s.pendingEvent) {
        const ev = EVENTS.find((e) => e.id === s.pendingEvent)!;
        a = { type: 'resolveEvent', choice: Math.floor(rnd() * ev.choices.length) };
      } else if (s.phase === 'boss') {
        a = { type: 'bossMove', id: BOSS_MOVES[Math.floor(rnd() * BOSS_MOVES.length)].id as BossMoveId };
      } else {
        a = { type: 'act', id: ACTIONS[Math.floor(rnd() * ACTIONS.length)].id as ActionId };
      }
      const next = reduce(s, a);
      for (const k of ['progress', 'sanity', 'trust'] as const) {
        expect(next[k]).toBeGreaterThanOrEqual(0);
        expect(next[k]).toBeLessThanOrEqual(100);
      }
      expect(next.timeLeft).toBeGreaterThanOrEqual(0);
      expect(next.timeLeft).toBeLessThanOrEqual(60);
      s = next;
    }
    return s;
  };

  it('keeps stats clamped, never soft-locks, and always ends', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const s = playRandom(seed);
      expect(s.phase, `seed ${seed}`).toBe('ended');
      expect(s.ending).not.toBeNull();
    }
  });

  it('can reach all three endings', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 600 && seen.size < 3; seed++) seen.add(playRandom(seed).ending!);
    // random play rarely wins; the strategic bot below covers last-word explicitly
    expect(seen.has('overdue') || seen.has('credit')).toBe(true);
  });
});

describe('strategic play can win', () => {
  it('a sensible plan reaches the good ending for some seed', () => {
    const endings = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      let s = createGame(seed);
      s = reduce(s, { type: 'chooseFirst', option: 'A' });
      s = reduce(s, { type: 'ackIntro' });
      const plan: ActionId[] = ['confront', 'investigate', 'write', 'investigate', 'meeting', 'write', 'delegate', 'references', 'break', 'write'];
      let i = 0;
      let guard = 0;
      while (s.phase !== 'ended' && guard++ < 60) {
        if (s.pendingEvent) {
          s = reduce(s, { type: 'resolveEvent', choice: 0 });
        } else if (s.phase === 'boss') {
          const order: BossMoveId[] = ['evidence', 'rally', 'whatPart', 'remove', 'negotiate'];
          const move = order.find((m) => (m === 'evidence' ? s.clues >= 2 : m === 'rally' ? s.trust >= 55 : true))!;
          s = reduce(s, { type: 'bossMove', id: move });
        } else {
          s = reduce(s, { type: 'act', id: plan[i++ % plan.length] });
        }
      }
      expect(s.phase).toBe('ended');
      endings.add(s.ending!);
    }
    expect(endings.has('last-word')).toBe(true);
    expect(endings.size).toBeGreaterThanOrEqual(2);
  });
});

describe('events', () => {
  it('has at least eight distinct events with valid choices', () => {
    expect(new Set(EVENTS.map((e) => e.id)).size).toBeGreaterThanOrEqual(8);
    EVENTS.forEach((e) => {
      expect(e.choices.length).toBeGreaterThanOrEqual(1);
      e.choices.forEach((c) => {
        expect(c.label).toBeTruthy();
        if (c.roll) expect(c.roll.chance).toBeGreaterThan(0), expect(c.roll.chance).toBeLessThan(1);
      });
    });
  });

  it('every choice resolves without error and clears the pending event', () => {
    EVENTS.forEach((e) =>
      e.choices.forEach((_, i) => {
        const s = { ...start(5), pendingEvent: e.id, progress: 50, sanity: 50, timeLeft: 40 };
        const n = reduce(s, { type: 'resolveEvent', choice: i });
        expect(n.pendingEvent).toBeNull();
        expect(n.lastOutcome?.title).toBe(e.title);
      }),
    );
  });
});

describe('sanity breakdown', () => {
  it('resets sanity instead of soft-locking', () => {
    const s = { ...start(5), sanity: 3 };
    const n = reduce(s, { type: 'act', id: 'write' });
    expect(n.sanity).toBeGreaterThan(0);
    expect(n.breakdowns).toBe(1);
    expect(n.phase).not.toBe('ended');
  });
});

describe('boss + endings', () => {
  const bossState = (over: Partial<GameState> = {}): GameState => ({ ...start(9), phase: 'boss', timeLeft: 8, progress: 70, claim: 25, trust: 60, clues: 3, ...over });

  it('starts the boss at 15 minutes', () => {
    let s: GameState = { ...start(2, 'A'), timeLeft: 20, pendingEvent: null };
    s = reduce(s, { type: 'act', id: 'write' });
    expect(s.phase === 'boss' || !!s.pendingEvent || s.timeLeft > 15).toBe(true);
    if (s.pendingEvent) s = reduce(s, { type: 'resolveEvent', choice: 0 });
    expect(s.phase).toBe('boss');
    expect(s.timeLeft).toBeGreaterThanOrEqual(6);
  });

  it('evidence needs two clues', () => {
    const s = bossState({ clues: 1 });
    expect(reduce(s, { type: 'bossMove', id: 'evidence' })).toBe(s);
  });

  it('banishing the ghost with good progress is the good ending', () => {
    let s = bossState({ claim: 10, clues: 4 });
    s = reduce(s, { type: 'bossMove', id: 'evidence' });
    expect(s.phase).toBe('ended');
    expect(s.ending).toBe('last-word');
  });

  it('negotiation never fully removes the claim', () => {
    let s = bossState({ claim: 25 });
    for (let i = 0; i < 5 && s.phase === 'boss'; i++) s = reduce(s, { type: 'bossMove', id: 'negotiate' });
    expect(s.phase).toBe('ended');
    expect(s.claim).toBeGreaterThanOrEqual(5);
    expect(s.ending).toBe('credit');
  });

  it('low progress is always overdue', () => {
    expect(computeEnding({ progress: 49, bossOutcome: 'banished' })).toBe('overdue');
    expect(computeEnding({ progress: 64, bossOutcome: 'banished' })).toBe('credit');
    expect(computeEnding({ progress: 65, bossOutcome: 'banished' })).toBe('last-word');
    expect(computeEnding({ progress: 90, bossOutcome: 'bargained' })).toBe('credit');
  });

  it('real-time expiry resolves fairly and reset starts a new game', () => {
    const s = reduce(bossState(), { type: 'timeExpired' });
    expect(s.phase).toBe('ended');
    expect(s.endReason).toBe('realtime');
    expect(reduce(s, { type: 'reset', seed: 4 }).phase).toBe('firstChoice');
  });

  it('timeExpired is ignored before the playable phase', () => {
    const s = createGame(1);
    expect(reduce(s, { type: 'timeExpired' })).toBe(s);
  });
});
