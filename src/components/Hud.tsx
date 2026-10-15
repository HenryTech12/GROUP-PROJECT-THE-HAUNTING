import { Brain, Clock, FileText, Handshake, Pause } from 'lucide-react';
import { fictionalClock } from '../game/engine';
import { REAL_TIME_LIMIT_SECONDS } from '../game/constants';
import type { GameState } from '../game/types';

function Stat({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  const low = tone === 'sanity' && value <= 25;
  return (
    <div className={`stat stat-${tone} ${low ? 'stat-low' : ''}`}>
      <div className="stat-top">
        {icon}
        <span className="stat-label">{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function Hud({ state, realLeft, onPause }: { state: GameState; realLeft: number; onPause: () => void }) {
  const mm = Math.floor(realLeft / 60);
  const ss = String(realLeft % 60).padStart(2, '0');
  const urgent = state.timeLeft <= 15;
  return (
    <header className="hud">
      <div className={`clock ${urgent ? 'clock-urgent' : ''}`} aria-label={`Fictional time ${fictionalClock(state.timeLeft)}, ${state.timeLeft} minutes remaining`}>
        <Clock size={18} aria-hidden />
        <div>
          <strong>{fictionalClock(state.timeLeft)}</strong>
          <span>{state.timeLeft} min to midnight</span>
        </div>
      </div>
      <div className="stats">
        <Stat label="Progress" value={state.progress} tone="progress" icon={<FileText size={14} aria-hidden />} />
        <Stat label="Sanity" value={state.sanity} tone="sanity" icon={<Brain size={14} aria-hidden />} />
        <Stat label="Trust" value={state.trust} tone="trust" icon={<Handshake size={14} aria-hidden />} />
      </div>
      <div className="session">
        <div className="session-time" aria-label={`Session time left ${mm}:${ss}`}>
          <span>Session</span>
          <strong data-testid="session-clock">{mm}:{ss}</strong>
        </div>
        <div className="bar bar-thin" aria-hidden>
          <i style={{ width: `${(realLeft / REAL_TIME_LIMIT_SECONDS) * 100}%` }} />
        </div>
      </div>
      <button className="icon-btn" onClick={onPause} aria-label="Pause game">
        <Pause size={18} />
      </button>
    </header>
  );
}
