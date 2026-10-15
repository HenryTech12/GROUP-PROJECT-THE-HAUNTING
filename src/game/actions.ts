import type { ActionId, BossMoveId, GameState } from './types';
import { MAX_CLUES } from './constants';

export interface ActionDef {
  id: ActionId;
  label: string;
  cost: number;
  tagline: string;
  effects: string;
}

export const ACTIONS: ActionDef[] = [
  { id: 'write', label: 'Write the report', cost: 10, tagline: 'Open the doc and type until it hurts.', effects: '+12 progress · -5 sanity' },
  { id: 'delegate', label: 'Delegate tasks', cost: 6, tagline: 'Name a person, a task and a deadline.', effects: '+trust · teammates may deliver' },
  { id: 'confront', label: 'Confront Tobi', cost: 5, tagline: 'Slides are not a technical report.', effects: 'Chance to turn slides into text' },
  { id: 'meeting', label: 'Team meeting', cost: 8, tagline: 'Mariam will be thrilled.', effects: '+6 trust · risk of absurdity' },
  { id: 'investigate', label: 'Investigate the ghost', cost: 6, tagline: 'Read the version history. Carefully.', effects: '+1 clue · -4 sanity' },
  { id: 'break', label: 'Take a break', cost: 5, tagline: 'Water. Window. Do not look at the window.', effects: '+15 sanity · trust may slip' },
  { id: 'references', label: 'Fix the references', cost: 7, tagline: 'Check that the journals exist.', effects: '+4 progress (+9 if flagged)' },
];

export const ACTION_BY_ID = Object.fromEntries(ACTIONS.map((a) => [a.id, a])) as Record<ActionId, ActionDef>;

export const CLUES = [
  'Last seen: yesterday. Last edited: right now.',
  'The avatar is a photo of an empty chair, taken from the chair\'s point of view.',
  'Their only commit message is "I was here", dated 2011. The course was founded in 2014.',
  'Every edit ends the same way: "Please credit me."',
  'Their matric number is 000000. Registered for EEE 204 in 1987. Attendance: perfect, somehow.',
];

export interface Availability {
  ok: boolean;
  reason?: string;
}

export function actionAvailability(s: GameState, id: ActionId): Availability {
  if (s.phase !== 'playing' || s.pendingEvent) return { ok: false, reason: 'Not available right now' };
  if (s.timeLeft <= 0) return { ok: false, reason: 'Out of time' };
  if (id === 'investigate' && s.clues >= MAX_CLUES) return { ok: false, reason: 'You have found everything' };
  return { ok: true };
}

export interface BossMoveDef {
  id: BossMoveId;
  label: string;
  tagline: string;
  effects: string;
}

export const BOSS_MOVES: BossMoveDef[] = [
  { id: 'evidence', label: 'Present the evidence', tagline: 'Read the clues aloud to the ghost.', effects: 'Needs 2 clues · more clues hit harder' },
  { id: 'whatPart', label: 'Ask: "What part?"', tagline: 'Quietly. Without blinking.', effects: 'Claim -5 (-8 with a clue) · -2 sanity' },
  { id: 'rally', label: 'Rally the team', tagline: 'Chidi, Tobi and Mariam, together.', effects: 'Needs 55 trust · claim -10 · +4 progress' },
  { id: 'negotiate', label: 'Offer acknowledgements', tagline: 'A line in the footer. Final offer.', effects: 'Claim down to 5 at best · safe' },
  { id: 'remove', label: 'Remove from group', tagline: 'Long-press. Select. Remove.', effects: 'Gamble: banish now, or be possessed' },
];

export function bossMoveAvailability(s: GameState, id: BossMoveId): Availability {
  if (s.phase !== 'boss') return { ok: false, reason: 'Not available right now' };
  if (id === 'evidence' && s.clues < 2) return { ok: false, reason: `Needs 2 clues (you have ${s.clues})` };
  if (id === 'rally' && s.trust < 55) return { ok: false, reason: `Needs 55 trust (you have ${s.trust})` };
  return { ok: true };
}
