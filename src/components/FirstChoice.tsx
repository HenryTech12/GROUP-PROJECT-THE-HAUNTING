import { ArrowRight } from 'lucide-react';
import { CHARACTERS } from '../game/characters';
import type { FirstChoiceId, GameState } from '../game/types';
import { DormScene, Portrait } from './Art';
import { DeltaChips } from './ActionPanel';

const OPTIONS: { id: FirstChoiceId; title: string; desc: string; effects: string }[] = [
  { id: 'A', title: 'Everyone gets a task. No excuses.', desc: 'Take control and delegate specific tasks with deadlines.', effects: '−5 min · +10 trust · progress depends on who delivers' },
  { id: 'B', title: 'Forget them. I\'ll do everything myself.', desc: 'Open the report and start writing. At least one person here is competent.', effects: '−10 min · +20 progress · −10 sanity' },
  { id: 'C', title: 'Where is this 25% contributor?', desc: 'Investigate the Ghost Member\'s document activity history.', effects: '−5 min · +1 clue · may cost sanity' },
];

const OPENING_CHAT = [
  { who: 'chidi' as const, text: 'Henry, please tell me you have a plan.' },
  { who: 'mariam' as const, text: 'We should schedule a meeting to discuss our plan.' },
  { who: 'tobi' as const, text: "I've made a title slide for the meeting." },
];

export function FirstChoice({ state, onChoose, onContinue }: { state: GameState; onChoose: (o: FirstChoiceId) => void; onContinue: () => void }) {
  const result = state.phase === 'firstResult';
  return (
    <div className="first">
      <DormScene dim />
      <div className="first-inner">
        <h2 className="first-title">{result ? 'The team reacts' : 'You need a plan'}</h2>
        <div className="stat-strip" aria-label="Starting stats">
          <span>Progress <b>{state.progress}</b></span>
          <span>Sanity <b>{state.sanity}</b></span>
          <span>Trust <b>{state.trust}</b></span>
          <span>Time <b>{state.timeLeft} min</b></span>
        </div>
        {!result ? (
          <>
            <ul className="mini-chat">
              {OPENING_CHAT.map((m) => (
                <li key={m.who} style={{ ['--who' as string]: CHARACTERS[m.who].color }}>
                  <Portrait id={m.who} size={36} />
                  <div><b>{CHARACTERS[m.who].name}</b><p>{m.text}</p></div>
                </li>
              ))}
            </ul>
            <ul className="option-list">
              {OPTIONS.map((o) => (
                <li key={o.id}>
                  <button className="option" onClick={() => onChoose(o.id)} data-option={o.id}>
                    <strong>{o.title}</strong>
                    <span>{o.desc}</span>
                    <em>{o.effects}</em>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <ul className="mini-chat">
              {state.log.filter((l) => l.kind !== 'system' || l.speaker === 'system').map((l) => (
                <li key={l.id} style={{ ['--who' as string]: l.speaker in CHARACTERS ? CHARACTERS[l.speaker as keyof typeof CHARACTERS].color : '#F28C28' }}>
                  <div><b>{l.speaker === 'player' ? 'You' : l.speaker === 'system' ? 'System' : CHARACTERS[l.speaker as keyof typeof CHARACTERS]?.name}</b><p>{l.text}</p></div>
                </li>
              ))}
            </ul>
            {state.lastOutcome && (
              <section className="outcome">
                <h3>{state.lastOutcome.title}</h3>
                <DeltaChips d={state.lastOutcome.deltas} />
                <ul className="outcome-lines">{state.lastOutcome.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
              </section>
            )}
            <button className="primary-btn" onClick={onContinue} data-testid="begin">
              Begin the assignment <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
