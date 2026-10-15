import type { CharacterId } from './types';

export interface Character {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  color: string;
  style: string;
  /** Base chance that a delegated task comes back usable. */
  reliability: number;
  hook: string;
}

export const CHARACTERS: Record<CharacterId, Character> = {
  chidi: {
    id: 'chidi',
    name: 'Chidi',
    title: 'The Responsible One',
    description: 'Willing to help. Increasingly panicked.',
    color: '#65D6A3',
    style: 'Short, anxious sentences. Apologises while working.',
    reliability: 0.85,
    hook: 'Gets steadier as team trust rises.',
  },
  tobi: {
    id: 'tobi',
    name: 'Tobi',
    title: 'The PowerPoint Prophet',
    description: 'Can produce slides at supernatural speed. Cannot write a paragraph.',
    color: '#F28C28',
    style: 'Cheerful, confident, always mentions slide counts.',
    reliability: 0.35,
    hook: 'Confront him to turn slides into report text.',
  },
  mariam: {
    id: 'mariam',
    name: 'Mariam',
    title: 'The Meeting Enthusiast',
    description: 'Has scheduled three meetings and completed zero tasks.',
    color: '#FF8FB1',
    style: 'Corporate. Speaks in agendas and action items.',
    reliability: 0.6,
    hook: 'Give her a concrete, named task and she delivers.',
  },
  unknown: {
    id: 'unknown',
    name: 'Unknown Member',
    title: 'The Ghost',
    description: 'Offline, unresponsive, and somehow still editing the document.',
    color: '#B9A4FF',
    style: 'Polite. Unbothered. Entitled. Slightly translucent.',
    reliability: 0,
    hook: 'Collect clues to weaken the 25% claim.',
  },
};

export const CHARACTER_ORDER: CharacterId[] = ['chidi', 'tobi', 'mariam', 'unknown'];

export const speakerName = (id: string): string => {
  if (id === 'player') return 'You';
  if (id === 'system') return 'System';
  if (id === 'lecturer') return 'Dr. Okoro (Lecturer)';
  return CHARACTERS[id as CharacterId]?.name ?? id;
};
