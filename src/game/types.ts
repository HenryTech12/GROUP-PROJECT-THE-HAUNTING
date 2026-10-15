export type CharacterId = 'chidi' | 'tobi' | 'mariam' | 'unknown';
export type SpeakerId = CharacterId | 'player' | 'system' | 'lecturer';

export type Phase = 'firstChoice' | 'firstResult' | 'playing' | 'boss' | 'ended';
export type ActionId = 'write' | 'delegate' | 'confront' | 'meeting' | 'investigate' | 'break' | 'references';
export type FirstChoiceId = 'A' | 'B' | 'C';
export type EndingId = 'last-word' | 'credit' | 'overdue';
export type BossMoveId = 'evidence' | 'negotiate' | 'remove' | 'whatPart' | 'rally';
export type BossOutcome = 'banished' | 'bargained' | 'unresolved';

export type Flag =
  | 'referencesBad'
  | 'tobiConverted'
  | 'ghostEdited'
  | 'offeredAck'
  | 'fileCorrupt'
  | 'metGhostClaim';

export interface Effect {
  progress?: number;
  sanity?: number;
  trust?: number;
  /** Fictional minutes spent. Positive = time consumed, negative = time refunded. */
  time?: number;
  clue?: number;
  claim?: number;
  setFlags?: Flag[];
  clearFlags?: Flag[];
}

export interface Deltas {
  progress: number;
  sanity: number;
  trust: number;
  time: number;
  clues: number;
}

export type LogKind = 'chat' | 'system' | 'clue' | 'event' | 'action' | 'ghost';

export interface LogEntry {
  id: number;
  clock: string;
  speaker: SpeakerId;
  text: string;
  kind: LogKind;
}

export interface Outcome {
  title: string;
  lines: string[];
  deltas: Deltas;
}

export interface EventChoice {
  label: string;
  hint: string;
  /** Always applied. */
  effect: Effect;
  /** Optional gamble on top of the base effect. */
  roll?: { chance: number; success: Effect; fail: Effect; successText: string; failText: string };
  resultText: string;
  resultSpeaker?: SpeakerId;
}

export interface GameEvent {
  id: string;
  title: string;
  speaker: SpeakerId;
  body: string;
  weight: number;
  when?: (s: GameState) => boolean;
  choices: EventChoice[];
}

export interface GameState {
  phase: Phase;
  seed: number;
  progress: number;
  sanity: number;
  trust: number;
  timeLeft: number;
  clues: number;
  claim: number;
  coordination: number;
  flags: Record<Flag, boolean>;
  firstChoice: FirstChoiceId | null;
  log: LogEntry[];
  logId: number;
  eventsSeen: string[];
  pendingEvent: string | null;
  lastOutcome: Outcome | null;
  actionCounts: Record<ActionId, number>;
  consecutiveWrites: number;
  turnsSinceEvent: number;
  breakdowns: number;
  bossRound: number;
  bossOutcome: BossOutcome;
  ending: EndingId | null;
  endReason: 'submitted' | 'deadline' | 'realtime' | null;
}

export type GameAction =
  | { type: 'chooseFirst'; option: FirstChoiceId }
  | { type: 'ackIntro' }
  | { type: 'act'; id: ActionId }
  | { type: 'resolveEvent'; choice: number }
  | { type: 'bossMove'; id: BossMoveId }
  | { type: 'timeExpired' }
  | { type: 'reset'; seed?: number };
