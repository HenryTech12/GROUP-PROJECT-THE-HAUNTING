import { Clock } from 'lucide-react';
import { ACTIONS, BOSS_MOVES, actionAvailability, bossMoveAvailability } from '../game/actions';
import { CHARACTERS } from '../game/characters';
import { MAX_BOSS_ROUNDS } from '../game/constants';
import type { ActionId, BossMoveId, Deltas, GameState, Outcome } from '../game/types';
import { Ghost } from './Art';

export function DeltaChips({ d }: { d: Deltas }) {
  const chips: { k: string; v: number; label: string; goodWhenPositive: boolean }[] = [
    { k: 'p', v: d.progress, label: 'progress', goodWhenPositive: true },
    { k: 's', v: d.sanity, label: 'sanity', goodWhenPositive: true },
    { k: 't', v: d.trust, label: 'trust', goodWhenPositive: true },
    { k: 'm', v: -d.time, label: 'min', goodWhenPositive: true },
    { k: 'c', v: d.clues, label: d.clues === 1 ? 'clue' : 'clues', goodWhenPositive: true },
  ];
  return (
    <ul className="chips">
      {chips
        .filter((c) => c.v !== 0)
        .map((c) => (
          <li key={c.k} className={c.v > 0 === c.goodWhenPositive ? 'chip chip-good' : 'chip chip-bad'}>
            {c.v > 0 ? '+' : '−'}
            {Math.abs(c.v)} {c.label}
          </li>
        ))}
    </ul>
  );
}

export function OutcomeCard({ outcome }: { outcome: Outcome | null }) {
  if (!outcome) return null;
  return (
    <section className="outcome" aria-live="polite" data-testid="outcome">
      <h3>{outcome.title}</h3>
      <DeltaChips d={outcome.deltas} />
      <ul className="outcome-lines">
        {outcome.lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </section>
  );
}

export function ActionPanel({
  state,
  paused,
  onAct,
  onBoss,
}: {
  state: GameState;
  paused: boolean;
  onAct: (id: ActionId) => void;
  onBoss: (id: BossMoveId) => void;
}) {
  if (state.phase === 'boss') {
    const ghostLine = [...state.log].reverse().find((l) => l.speaker === 'unknown')?.text;
    return (
      <div className="actions boss">
        <div className="boss-head">
          <Ghost className="boss-ghost" laptop />
          <div>
            <h2 className="panel-title">The Ghost Member</h2>
            <p className="boss-claim">
              Credit claimed <strong>{state.claim}%</strong>
            </p>
            <div className="bar bar-claim" role="progressbar" aria-label="Ghost credit claim" aria-valuenow={state.claim} aria-valuemin={0} aria-valuemax={40}>
              <i style={{ width: `${(state.claim / 40) * 100}%` }} />
            </div>
            <p className="boss-round">Round {Math.min(state.bossRound + 1, MAX_BOSS_ROUNDS)} of {MAX_BOSS_ROUNDS} · bring the claim to 0%</p>
          </div>
        </div>
        {ghostLine && (
          <blockquote className="ghost-quote" style={{ ['--who' as string]: CHARACTERS.unknown.color }}>
            {ghostLine}
          </blockquote>
        )}
        <OutcomeCard outcome={state.lastOutcome} />
        <ul className="action-list">
          {BOSS_MOVES.map((m) => {
            const a = bossMoveAvailability(state, m.id);
            const disabled = !a.ok || paused;
            return (
              <li key={m.id}>
                <button className="action" disabled={disabled} onClick={() => onBoss(m.id)} title={a.reason}>
                  <span className="action-main">
                    <strong>{m.label}</strong>
                    <small>{m.tagline}</small>
                    <em>{a.ok ? m.effects : a.reason}</em>
                  </span>
                  <span className="cost"><Clock size={12} aria-hidden /> 1 min</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return (
    <div className="actions">
      <h2 className="panel-title">What do you do?</h2>
      <OutcomeCard outcome={state.lastOutcome} />
      <ul className="action-list">
        {ACTIONS.map((a) => {
          const av = actionAvailability(state, a.id);
          const disabled = !av.ok || paused;
          return (
            <li key={a.id}>
              <button className="action" disabled={disabled} onClick={() => onAct(a.id)} title={av.reason} data-action={a.id}>
                <span className="action-main">
                  <strong>{a.label}</strong>
                  <small>{a.tagline}</small>
                  <em>{av.ok ? a.effects : av.reason}</em>
                </span>
                <span className="cost"><Clock size={12} aria-hidden /> {a.cost} min</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
