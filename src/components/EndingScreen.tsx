import { motion } from 'motion/react';
import { RotateCcw, Home } from 'lucide-react';
import { ENDINGS, endingFootnote } from '../game/endings';
import { fictionalClock } from '../game/engine';
import type { EndingId, GameState } from '../game/types';
import { Ghost } from './Art';

export function EndingScreen({ state, discovered, onRestart, onTitle }: { state: GameState; discovered: EndingId[]; onRestart: () => void; onTitle: () => void }) {
  const e = ENDINGS[state.ending ?? 'overdue'];
  const foot = endingFootnote(state);
  return (
    <div className={`ending ending-${e.tone}`}>
      <motion.div className="ending-inner" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Ghost className={`ending-ghost ending-ghost-${e.tone}`} laptop={e.tone !== 'good'} />
        <p className="ending-kicker">{e.kicker}</p>
        <h1 data-testid="ending-title">{e.title}</h1>
        <div className="grade" aria-label={`Grade ${e.grade}`}>{e.grade}</div>
        {e.paragraphs.map((p, i) => (
          <p key={i} className="ending-p">{p}</p>
        ))}
        <dl className="summary">
          <div><dt>Progress</dt><dd>{state.progress}/100</dd></div>
          <div><dt>Sanity</dt><dd>{state.sanity}</dd></div>
          <div><dt>Trust</dt><dd>{state.trust}</dd></div>
          <div><dt>Ghost claim</dt><dd>{state.claim}%</dd></div>
          <div><dt>Clock</dt><dd>{fictionalClock(state.timeLeft)}</dd></div>
        </dl>
        {foot && <p className="ending-foot">{foot}</p>}
        <p className="found">Endings found: {discovered.length}/3</p>
        <div className="ending-buttons">
          <button className="primary-btn" onClick={onRestart} data-testid="restart"><RotateCcw size={18} /> Try again</button>
          <button className="ghost-btn" onClick={onTitle}><Home size={16} /> Title screen</button>
        </div>
      </motion.div>
    </div>
  );
}
