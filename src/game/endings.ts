import type { EndingId, GameState } from './types';

export interface EndingCopy {
  id: EndingId;
  title: string;
  kicker: string;
  grade: string;
  tone: 'good' | 'mixed' | 'bad';
  paragraphs: string[];
}

export const ENDINGS: Record<EndingId, EndingCopy> = {
  'last-word': {
    id: 'last-word',
    title: 'The Last Word',
    kicker: 'Submitted at 11:59 PM. Your name is first on the cover page.',
    grade: 'A−',
    tone: 'good',
    paragraphs: [
      'The upload bar crawls. The ghost fades out mid-sentence, still insisting it "technically" contributed to the margins.',
      'The lecturer replies at 12:01 AM with a single word: "Received." Chidi cries. Tobi presents the victory in 94 slides. Mariam schedules a retrospective.',
      'Group chat renamed: "Academic Avengers (Living Members Only)".',
    ],
  },
  credit: {
    id: 'credit',
    title: '25% of Nothing',
    kicker: 'Submitted. The cover page lists the ghost first.',
    grade: 'B−',
    tone: 'mixed',
    paragraphs: [
      'The report goes in on time. The group profile picture has been changed to a sheet with eyes.',
      'The lecturer returns the grade a week later. The comment reads: "Strong work. Who is Unknown Member? They appear in the metadata of every page."',
      'Your name is second. Their name is first. They sent a thank-you note: "Pleasure working with you."',
    ],
  },
  overdue: {
    id: 'overdue',
    title: 'Overdue',
    kicker: 'Midnight. The report is not finished.',
    grade: 'F',
    tone: 'bad',
    paragraphs: [
      'The portal closes. The upload button turns grey. The chat goes silent, except for one typing indicator that never resolves.',
      'In the morning the lecturer announces that one group submitted a 94-slide deck. It is yours. It has a ghost on slide 3.',
      'You can still go back. The clock resets every time you press play.',
    ],
  },
};

export function endingFootnote(s: GameState): string {
  const bits: string[] = [];
  if (s.endReason === 'realtime') bits.push('The session clock ran out and the deadline resolved itself.');
  if (s.breakdowns > 0) bits.push(`Breakdowns: ${s.breakdowns}.`);
  if (s.bossOutcome === 'banished') bits.push('You removed the ghost.');
  if (s.bossOutcome === 'bargained') bits.push('You negotiated with the ghost.');
  return bits.join(' ');
}
