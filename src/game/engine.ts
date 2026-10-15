import { CHARACTERS } from './characters';
import { ACTION_BY_ID, CLUES, actionAvailability, bossMoveAvailability } from './actions';
import {
  BASE_CLAIM,
  BOSS_MIN_TIME,
  BOSS_TRIGGER_PROGRESS,
  BOSS_TRIGGER_TIME,
  GOOD_ENDING_MIN_PROGRESS,
  MAX_BOSS_ROUNDS,
  MAX_CLAIM,
  MAX_CLUES,
  MAX_EVENTS,
  MAX_TIME,
  START,
  SUBMIT_MIN_PROGRESS,
} from './constants';
import { EVENTS, EVENT_BY_ID } from './events';
import { nextRandom, randomSeed } from './rng';
import type {
  ActionId,
  Deltas,
  Effect,
  EndingId,
  FirstChoiceId,
  Flag,
  GameAction,
  GameState,
  LogKind,
  Outcome,
  SpeakerId,
} from './types';

export const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

/** 11:00 PM when timeLeft is 60, 12:00 AM when it is 0. */
export function fictionalClock(timeLeft: number): string {
  const passed = clamp(MAX_TIME - Math.round(timeLeft), 0, MAX_TIME);
  if (passed >= MAX_TIME) return '12:00 AM';
  return `11:${String(passed).padStart(2, '0')} PM`;
}

const emptyFlags = (): Record<Flag, boolean> => ({
  referencesBad: false,
  tobiConverted: false,
  ghostEdited: false,
  offeredAck: false,
  fileCorrupt: false,
  metGhostClaim: false,
});

export function createGame(seed: number = randomSeed()): GameState {
  return {
    phase: 'firstChoice',
    seed,
    progress: START.progress,
    sanity: START.sanity,
    trust: START.trust,
    timeLeft: START.time,
    clues: 0,
    claim: BASE_CLAIM,
    coordination: 0,
    flags: emptyFlags(),
    firstChoice: null,
    log: [],
    logId: 0,
    eventsSeen: [],
    pendingEvent: null,
    lastOutcome: null,
    actionCounts: { write: 0, delegate: 0, confront: 0, meeting: 0, investigate: 0, break: 0, references: 0 },
    consecutiveWrites: 0,
    turnsSinceEvent: 0,
    breakdowns: 0,
    bossRound: 0,
    bossOutcome: 'unresolved',
    ending: null,
    endReason: null,
  };
}

/* ---------- internal helpers (operate on a private copy) ---------- */

function copy(s: GameState): GameState {
  return {
    ...s,
    flags: { ...s.flags },
    log: [...s.log],
    eventsSeen: [...s.eventsSeen],
    actionCounts: { ...s.actionCounts },
  };
}

function rand(s: GameState): number {
  const [v, seed] = nextRandom(s.seed);
  s.seed = seed;
  return v;
}

function pick<T>(s: GameState, list: T[]): T {
  return list[Math.floor(rand(s) * list.length) % list.length];
}

function say(s: GameState, speaker: SpeakerId, text: string, kind: LogKind = 'chat') {
  s.logId += 1;
  s.log.push({ id: s.logId, clock: fictionalClock(s.timeLeft), speaker, text, kind });
}

function apply(s: GameState, e: Effect) {
  if (e.progress) s.progress = clamp(s.progress + e.progress);
  if (e.sanity) s.sanity = clamp(s.sanity + e.sanity);
  if (e.trust) s.trust = clamp(s.trust + e.trust);
  if (e.time) s.timeLeft = clamp(s.timeLeft - e.time, 0, MAX_TIME);
  if (e.clue) s.clues = clamp(s.clues + e.clue, 0, MAX_CLUES);
  if (e.claim) s.claim = clamp(s.claim + e.claim, 0, MAX_CLAIM);
  e.setFlags?.forEach((f) => (s.flags[f] = true));
  e.clearFlags?.forEach((f) => (s.flags[f] = false));
}

interface Snapshot {
  progress: number;
  sanity: number;
  trust: number;
  timeLeft: number;
  clues: number;
}
const snap = (s: GameState): Snapshot => ({
  progress: s.progress,
  sanity: s.sanity,
  trust: s.trust,
  timeLeft: s.timeLeft,
  clues: s.clues,
});

function conclude(before: Snapshot, s: GameState, title: string, lines: string[]) {
  breakdownCheck(s, lines);
  const deltas: Deltas = {
    progress: s.progress - before.progress,
    sanity: s.sanity - before.sanity,
    trust: s.trust - before.trust,
    time: before.timeLeft - s.timeLeft,
    clues: s.clues - before.clues,
  };
  s.lastOutcome = { title, lines, deltas } satisfies Outcome;
}

/** Sanity 0 never locks the game: you break down, lose a little, and carry on. */
function breakdownCheck(s: GameState, lines: string[]) {
  if (s.sanity > 0 || s.phase === 'ended') return;
  s.breakdowns += 1;
  s.sanity = 12;
  s.trust = clamp(s.trust - 5);
  if (s.phase === 'boss') {
    s.claim = clamp(s.claim + 4, 0, MAX_CLAIM);
    lines.push('BREAKDOWN. You laugh at the ghost for eleven seconds. It takes notes. Claim +4, trust -5.');
  } else {
    s.timeLeft = clamp(s.timeLeft - 2, 0, MAX_TIME);
    lines.push('BREAKDOWN. You stare at the wall for two minutes. Sanity resets to 12, trust -5.');
  }
  say(s, 'system', 'You had a breakdown. You are back. Mostly.', 'system');
}

export function computeEnding(s: Pick<GameState, 'progress' | 'bossOutcome'>): EndingId {
  if (s.progress < SUBMIT_MIN_PROGRESS) return 'overdue';
  if (s.bossOutcome === 'banished' && s.progress >= GOOD_ENDING_MIN_PROGRESS) return 'last-word';
  return 'credit';
}

function endGame(s: GameState, reason: 'submitted' | 'deadline' | 'realtime') {
  s.phase = 'ended';
  s.pendingEvent = null;
  s.endReason = reason;
  s.ending = computeEnding(s);
}

function shouldStartBoss(s: GameState) {
  return s.phase === 'playing' && (s.timeLeft <= BOSS_TRIGGER_TIME || s.progress >= BOSS_TRIGGER_PROGRESS);
}

function startBoss(s: GameState) {
  s.phase = 'boss';
  s.pendingEvent = null;
  s.timeLeft = Math.max(s.timeLeft, BOSS_MIN_TIME);
  s.bossRound = 0;
  say(s, 'unknown', 'Hello team. Have we finished? Wonderful. About my 25%.', 'ghost');
  say(s, 'system', 'The Ghost Member has frozen the clock. Midnight is coming anyway.', 'system');
}

function pickEvent(s: GameState): string | null {
  if (s.eventsSeen.length >= MAX_EVENTS) return null;
  const eligible = EVENTS.filter((e) => !s.eventsSeen.includes(e.id) && (!e.when || e.when(s)));
  if (eligible.length === 0) return null;
  const chance = s.turnsSinceEvent >= 2 ? 1 : 0.55;
  if (rand(s) > chance) return null;
  const urgent = new Set(['lecturer-message', 'ghost-claim']);
  const weights = eligible.map((e) => e.weight * (urgent.has(e.id) ? 5 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand(s) * total;
  for (let i = 0; i < eligible.length; i++) {
    r -= weights[i];
    if (r <= 0) return eligible[i].id;
  }
  return eligible[eligible.length - 1].id;
}

/** Runs after any action: resolves deadline, starts the boss, or surfaces an event. */
function afterTurn(s: GameState) {
  if (s.phase === 'ended') return;
  if (s.timeLeft <= 0) {
    endGame(s, 'deadline');
    return;
  }
  if (shouldStartBoss(s)) {
    startBoss(s);
    return;
  }
  if (s.phase === 'playing' && !s.pendingEvent) {
    const id = pickEvent(s);
    if (id) {
      s.pendingEvent = id;
      s.eventsSeen.push(id);
      const ev = EVENT_BY_ID[id];
      say(s, ev.speaker, ev.body, 'event');
    }
  }
}

/** Probability that a given teammate delivers on a delegated task. */
export function delegateChance(s: Pick<GameState, 'trust' | 'coordination'>, id: 'chidi' | 'tobi' | 'mariam'): number {
  return clamp(CHARACTERS[id].reliability + (s.trust - 50) / 200 + 0.05 * s.coordination, 0.1, 0.95);
}

const TASKS = {
  chidi: {
    ok: 'Chidi: "Methodology done. I also fixed your margins. Please never ask me to do maths at midnight."',
    no: 'Chidi: "My laptop is restarting for updates. I am fine. This is fine."',
  },
  tobi: {
    ok: 'Tobi: "Done! 11 paragraphs. Also 3 transition slides. Also a transition slide for the transitions."',
    no: 'Tobi: "I turned your task into slides. They are beautiful. Please clap."',
  },
  mariam: {
    ok: 'Mariam: "Action item complete. I have scheduled a retro to celebrate."',
    no: 'Mariam: "I have drafted an agenda for the task. The task is item 4 on the agenda."',
  },
} as const;

function runDelegation(s: GameState, successProgress: number, lines: string[]) {
  (['chidi', 'tobi', 'mariam'] as const).forEach((id) => {
    const ok = rand(s) < delegateChance(s, id);
    if (ok) {
      apply(s, { progress: successProgress });
      say(s, id, TASKS[id].ok);
      lines.push(`${CHARACTERS[id].name} delivered (+${successProgress}).`);
    } else {
      apply(s, { trust: -2 });
      say(s, id, TASKS[id].no);
      lines.push(`${CHARACTERS[id].name} did not deliver (-2 trust).`);
    }
  });
}

/* ---------- first decision ---------- */

function chooseFirst(state: GameState, option: FirstChoiceId): GameState {
  if (state.phase !== 'firstChoice') return state;
  const s = copy(state);
  const before = snap(s);
  const lines: string[] = [];
  s.firstChoice = option;

  if (option === 'A') {
    apply(s, { time: 5, trust: 10 });
    s.actionCounts.delegate = 1;
    say(s, 'player', 'Everyone gets a task. No excuses. Deadlines are in the doc.');
    runDelegation(s, 3, lines);
    lines.unshift('You took control and handed out named tasks with deadlines.');
  } else if (option === 'B') {
    apply(s, { time: 10, progress: 20, sanity: -10 });
    say(s, 'player', 'Forget them. I will do everything myself.');
    say(s, 'chidi', 'Henry, are you sure? ...Okay. I will pray for your wrists.');
    say(s, 'mariam', 'Noted. Let us circle back after you are done.');
    say(s, 'tobi', 'I will make you a slide that says "you are doing great".');
    lines.push('You opened the report and wrote hard for ten minutes.');
  } else {
    apply(s, { time: 5, clue: 1 });
    say(s, 'player', 'Where is this 25% contributor?');
    say(s, 'system', CLUES[0], 'clue');
    lines.push('You opened the version history. ' + CLUES[0]);
    if (rand(s) < 0.4) {
      apply(s, { sanity: -8 });
      say(s, 'system', 'The cursor moved by itself and highlighted your name.', 'system');
      lines.push('The cursor moved by itself and highlighted your name (-8 sanity).');
    } else {
      lines.push('Nothing moved. You are almost sure.');
    }
    say(s, 'chidi', 'You are investigating the ghost with 55 minutes left?');
  }
  s.phase = 'firstResult';
  conclude(before, s, option === 'A' ? 'Everyone gets a task' : option === 'B' ? 'Going solo' : 'The 25% contributor', lines);
  return s;
}

/* ---------- player actions ---------- */

const ABSURD_MEETINGS = [
  'Mariam opens with an icebreaker: "What colour is your deadline?"',
  'The meeting runs four minutes over to discuss how long the meeting should be.',
  'Mariam shares her screen. It is a meeting about this meeting, in a meeting.',
];

function act(state: GameState, id: ActionId): GameState {
  if (!actionAvailability(state, id).ok) return state;
  const s = copy(state);
  const before = snap(s);
  const def = ACTION_BY_ID[id];
  const lines: string[] = [];
  const count = s.actionCounts[id];
  const wasWriting = id === 'write';

  switch (id) {
    case 'write': {
      const fatigue = Math.min(s.consecutiveWrites, 2);
      const gain = 12 - fatigue * 2;
      apply(s, { time: def.cost, progress: gain, sanity: -(5 + fatigue * 2) });
      say(s, 'player', 'Head down. Typing. Do not look at the second monitor.');
      lines.push(fatigue > 0 ? 'Your hands ache. Back-to-back writing is less efficient.' : 'You wrote two solid pages.');
      break;
    }
    case 'delegate': {
      apply(s, { time: def.cost, trust: 3, progress: 2 });
      const mult = count === 0 ? 1 : count === 1 ? 0.6 : 0.3;
      say(s, 'player', 'Task list posted. Names. Deadlines. No excuses.');
      lines.push(count === 0 ? 'Fresh tasks assigned.' : 'Repeat delegation: people have less to take on, so rewards shrink.');
      runDelegation(s, Math.max(1, Math.round(4 * mult)), lines);
      break;
    }
    case 'confront': {
      apply(s, { time: def.cost });
      say(s, 'player', 'Tobi. A technical report is words. Paragraphs. Sentences.');
      if (s.flags.tobiConverted) {
        apply(s, { progress: 4, sanity: -1 });
        say(s, 'tobi', 'Fine, I will export the speaker notes. I wrote them for fun.');
        lines.push('Tobi turns speaker notes into text. Less impressive the second time.');
      } else {
        const chance = clamp(0.5 + s.trust / 200 + (s.eventsSeen.includes('slide-incident') ? 0.1 : 0), 0.3, 0.85);
        if (rand(s) < chance) {
          apply(s, { progress: 9, trust: 2 });
          s.flags.tobiConverted = true;
          say(s, 'tobi', 'Wait... slide 34 IS a paragraph. I accidentally wrote a section on op-amps.');
          lines.push('Tobi converted slides into report text (+9).');
        } else {
          apply(s, { sanity: -4, progress: 1, trust: -2 });
          say(s, 'tobi', 'You hurt me. I am adding a slide called "Henry Does Not Understand Art".');
          lines.push('Tobi was offended. Slide count: 95.');
        }
      }
      break;
    }
    case 'meeting': {
      apply(s, { time: def.cost, trust: 6 });
      s.coordination = clamp(s.coordination + 1, 0, 2);
      say(s, 'mariam', 'Welcome, everyone! Today we align on alignment. First: ice-breaker.');
      if (rand(s) < 0.35) {
        apply(s, { time: 4, sanity: -3 });
        const line = pick(s, ABSURD_MEETINGS);
        say(s, 'system', line, 'event');
        lines.push(line, 'Absurdity tax: -4 minutes, -3 sanity.');
      } else {
        apply(s, { progress: 3 });
        say(s, 'mariam', 'Action items captured. I assigned myself "follow up".');
        lines.push('A short, rare, productive meeting. Teammates are more coordinated (+3 progress).');
      }
      break;
    }
    case 'investigate': {
      apply(s, { time: def.cost, sanity: -4, clue: 1 });
      say(s, 'player', 'Opening version history. Do not blink.');
      const clue = CLUES[Math.min(s.clues, CLUES.length) - 1] ?? CLUES[CLUES.length - 1];
      say(s, 'system', `Clue ${s.clues}/${MAX_CLUES}: ${clue}`, 'clue');
      lines.push(`Clue ${s.clues}/${MAX_CLUES}: ${clue}`);
      if (rand(s) < 0.3) {
        apply(s, { sanity: -4 });
        say(s, 'unknown', 'Please stop looking at my edits. It is rude.', 'ghost');
        lines.push('A message from the offline user: "Please stop looking at my edits." (-4 sanity)');
      }
      break;
    }
    case 'break': {
      const heavy = s.actionCounts.break >= 2;
      const slipped = s.progress < 40 ? -4 : -1;
      apply(s, { time: def.cost, sanity: heavy ? 8 : 15, trust: slipped });
      say(s, 'player', 'Water. Window. Not looking at the window.');
      say(s, 'chidi', slipped < -1 ? 'Henry. You are on a break. At 11:30. With NOTHING done.' : 'Okay. Fine. Good. Breathe. Good.');
      lines.push(heavy ? 'Breaks help less each time.' : 'You feel almost human.');
      if (slipped < -1) lines.push('The team noticed the break while progress is low.');
      break;
    }
    case 'references': {
      const flagged = s.flags.referencesBad;
      apply(s, { time: def.cost, sanity: -2, progress: flagged ? 9 : 4 });
      s.flags.referencesBad = false;
      say(s, 'chidi', flagged ? 'You fixed it! The journals exist! Praise be.' : 'References look fine. Probably.');
      lines.push(flagged ? 'You replaced the fake journals with real ones (+9).' : 'You tightened the citations (+4).');
      break;
    }
  }

  s.actionCounts[id] += 1;
  s.consecutiveWrites = wasWriting ? s.consecutiveWrites + 1 : 0;
  s.turnsSinceEvent += 1;
  conclude(before, s, def.label, lines);
  afterTurn(s);
  return s;
}

/* ---------- events ---------- */

function resolveEvent(state: GameState, choiceIndex: number): GameState {
  if (state.phase !== 'playing' || !state.pendingEvent) return state;
  const ev = EVENT_BY_ID[state.pendingEvent];
  const choice = ev?.choices[choiceIndex];
  if (!choice) return state;
  const s = copy(state);
  const before = snap(s);
  const lines: string[] = [];

  apply(s, choice.effect);
  say(s, 'player', choice.label);
  say(s, choice.resultSpeaker ?? 'system', choice.resultText.replace(/^[A-Za-z ]+: "(.*)"$/, '$1'));
  lines.push(choice.resultText);
  if (choice.roll) {
    const ok = rand(s) < choice.roll.chance;
    apply(s, ok ? choice.roll.success : choice.roll.fail);
    const text = ok ? choice.roll.successText : choice.roll.failText;
    say(s, 'system', text, 'event');
    lines.push(text);
  }
  s.pendingEvent = null;
  s.turnsSinceEvent = 0;
  conclude(before, s, ev.title, lines);
  // events never chain: only the deadline and the boss can follow one
  if (s.timeLeft <= 0) endGame(s, 'deadline');
  else if (shouldStartBoss(s)) startBoss(s);
  return s;
}

/* ---------- boss ---------- */

const HAUNTS = [
  'The laptop fan howls. The ghost reformats your bibliography.',
  'Your cursor drifts to the cover page and types "Unknown Member (lead author)".',
  'Every tab you have open becomes the same tab: his.',
  'The ghost whispers: "I am the third author. Alphabetically."',
  'The room goes cold. The ghost pings you 25 times.',
];

function bossMove(state: GameState, id: import('./types').BossMoveId): GameState {
  if (!bossMoveAvailability(state, id).ok) return state;
  const s = copy(state);
  const before = snap(s);
  const lines: string[] = [];
  const claimBefore = s.claim;
  apply(s, { time: 1 });

  switch (id) {
    case 'evidence': {
      const hit = 6 + 3 * Math.min(s.clues, 4);
      apply(s, { sanity: -2, claim: -hit });
      say(s, 'player', 'Exhibit A: you were never here. Exhibit B: you were never here.');
      say(s, 'unknown', 'That is... technically an accurate use of my own metadata.', 'ghost');
      lines.push(`The evidence lands. Claim -${hit}.`);
      break;
    }
    case 'whatPart': {
      const hit = s.clues >= 1 ? 8 : 5;
      apply(s, { sanity: -2, claim: -hit });
      say(s, 'player', 'What part?');
      say(s, 'unknown', '...The part. The... emotional part.', 'ghost');
      lines.push(`The ghost has no answer. Claim -${hit}.`);
      break;
    }
    case 'rally': {
      apply(s, { claim: -10, progress: 4 });
      say(s, 'chidi', 'We wrote every page. You did not.');
      say(s, 'tobi', 'I made 94 slides. You made zero. Think about that.');
      say(s, 'mariam', 'Per our minutes: you were not in the meeting.');
      lines.push('The living stand together. Claim -10, +4 progress.');
      break;
    }
    case 'negotiate': {
      const amount = s.flags.offeredAck ? 10 : 6;
      s.claim = Math.max(Math.min(s.claim, 5), s.claim - amount);
      s.bossOutcome = 'bargained';
      apply(s, { sanity: -1 });
      say(s, 'player', 'Final offer: a line in the acknowledgements.');
      say(s, 'unknown', s.claim > 5 ? 'Acknowledgements are a start. I want my name in bold.' : 'Bold. In the footer. And I get a font.', 'ghost');
      lines.push(s.claim < claimBefore ? `He bargains down. Claim -${claimBefore - s.claim}, but never to zero.` : 'He will not go lower than 5% without a fight.');
      break;
    }
    case 'remove': {
      const chance = Math.min(0.8, 0.3 + 0.1 * s.clues + (s.trust >= 60 ? 0.1 : 0));
      if (rand(s) < chance) {
        s.claim = 0;
        say(s, 'player', 'Remove from group.');
        say(s, 'system', 'Unknown Member was removed from the group.', 'system');
        lines.push('It worked. For now.');
      } else {
        apply(s, { sanity: -12, claim: 3 });
        say(s, 'system', 'Unknown Member was removed from the group. Unknown Member was added back to the group.', 'system');
        say(s, 'unknown', 'You cannot remove me. I have admin rights in your head.', 'ghost');
        lines.push('The removal fails. -12 sanity, claim +3.');
      }
      break;
    }
  }

  s.bossRound += 1;
  if (s.claim <= 0) {
    s.bossOutcome = 'banished';
    say(s, 'unknown', 'Fine. I will see myself out. Please credit me in spirit.', 'ghost');
    conclude(before, s, 'The Ghost Member is banished', lines);
    endGame(s, 'submitted');
    return s;
  }
  if (s.bossRound >= MAX_BOSS_ROUNDS) {
    conclude(before, s, 'Midnight', lines);
    endGame(s, 'submitted');
    return s;
  }
  if (s.timeLeft <= 0) {
    conclude(before, s, 'Midnight', lines);
    endGame(s, 'deadline');
    return s;
  }
  const dmg = Math.max(1, 3 + s.bossRound - (s.trust >= 70 ? 2 : 0));
  apply(s, { sanity: -dmg });
  const haunt = HAUNTS[(s.bossRound - 1) % HAUNTS.length];
  say(s, 'unknown', haunt, 'ghost');
  lines.push(`${haunt} (-${dmg} sanity)`);
  conclude(before, s, bossTitle(id), lines);
  return s;
}

function bossTitle(id: string) {
  return { evidence: 'Evidence', whatPart: '"What part?"', rally: 'The team rallies', negotiate: 'Negotiation', remove: 'Remove from group' }[id] ?? 'Confrontation';
}

/* ---------- reducer ---------- */

export function reduce(state: GameState, action: GameAction): GameState {
  if (action.type === 'reset') return createGame(action.seed);
  if (state.phase === 'ended') return state;
  switch (action.type) {
    case 'chooseFirst':
      return chooseFirst(state, action.option);
    case 'ackIntro':
      return state.phase === 'firstResult' ? { ...state, phase: 'playing' } : state;
    case 'act':
      return act(state, action.id);
    case 'resolveEvent':
      return resolveEvent(state, action.choice);
    case 'bossMove':
      return bossMove(state, action.id);
    case 'timeExpired': {
      if (state.phase !== 'playing' && state.phase !== 'boss') return state;
      const s = copy(state);
      say(s, 'system', 'Real time ran out. The deadline resolves itself.', 'system');
      endGame(s, 'realtime');
      return s;
    }
    default:
      return state;
  }
}
