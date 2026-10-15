import { CHARACTERS } from '../game/characters';
import { CLUES } from '../game/actions';
import { MAX_CLUES } from '../game/constants';
import type { GameState } from '../game/types';

export function DocPanel({ state }: { state: GameState }) {
  const pages = Math.round((state.progress / 100) * 15);
  const refs = Math.max(0, Math.min(5, Math.floor(state.progress / 20)) - (state.flags.referencesBad ? 2 : 0));
  const formatted = state.progress >= 60;
  return (
    <div className="doc">
      <h2 className="panel-title">EEE 204 — Group Report</h2>
      <p className="doc-sub">Due 12:00 AM. Autosaved by someone.</p>
      <div className="pages" aria-label={`${pages} of 15 pages written`}>
        {Array.from({ length: 15 }).map((_, i) => (
          <i key={i} className={i < pages ? 'page page-done' : 'page'} />
        ))}
      </div>
      <ul className="checklist">
        <li className={pages >= 15 ? 'done' : ''}>15-page technical report <em>{pages}/15</em></li>
        <li className={refs >= 5 ? 'done' : state.flags.referencesBad ? 'warn' : ''}>
          5 academic references <em>{refs}/5{state.flags.referencesBad ? ' (2 fake)' : ''}</em>
        </li>
        <li className={formatted ? 'done' : ''}>Proper formatting <em>{formatted ? 'ok' : 'pending'}</em></li>
        <li className="done">All members listed <em>{state.claim > 0 ? '5 (one disputed)' : '4'}</em></li>
      </ul>
      <div className="cover">
        <span>Cover page</span>
        <p>
          {state.flags.ghostEdited || state.claim >= 30 ? (
            <><b style={{ color: CHARACTERS.unknown.color }}>Unknown Member (25%)</b>, Henry, Chidi, Tobi, Mariam</>
          ) : (
            <>Henry, Chidi, Tobi, Mariam, <b style={{ color: CHARACTERS.unknown.color }}>Unknown Member (disputed)</b></>
          )}
        </p>
      </div>
      <div className="evidence">
        <h3>Evidence file <em>{state.clues}/{MAX_CLUES}</em></h3>
        {state.clues === 0 ? (
          <p className="muted">Nothing yet. Investigate the ghost to build a case.</p>
        ) : (
          <ol>
            {CLUES.slice(0, state.clues).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
