import { useEffect, useRef } from 'react';
import { CHARACTERS, CHARACTER_ORDER } from '../game/characters';
import type { GameState } from '../game/types';
import { Portrait } from './Art';

export function ChatPanel({ state }: { state: GameState }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [state.log.length]);
  return (
    <div className="chat">
      <h2 className="panel-title">Academic Avengers</h2>
      <div className="roster">
        {CHARACTER_ORDER.map((id) => (
          <div key={id} className="roster-item" title={`${CHARACTERS[id].name}: ${CHARACTERS[id].hook}`}>
            <Portrait id={id} size={34} />
            <span>{CHARACTERS[id].name.replace(' Member', '')}</span>
          </div>
        ))}
      </div>
      <ol className="log" ref={ref} aria-live="polite" aria-label="Event history">
        {state.log.map((l) => {
          const color = l.speaker === 'player' ? '#F28C28' : l.speaker in CHARACTERS ? CHARACTERS[l.speaker as keyof typeof CHARACTERS].color : '#B6AABD';
          const name = l.speaker === 'player' ? 'You' : l.speaker === 'system' ? '' : l.speaker === 'lecturer' ? 'Dr. Okoro' : CHARACTERS[l.speaker].name;
          return (
            <li key={l.id} className={`log-item log-${l.kind} ${l.speaker === 'player' ? 'log-me' : ''}`} style={{ ['--who' as string]: color }}>
              {name && <span className="log-name">{name}</span>}
              <p>{l.text}</p>
              <time>{l.clock}</time>
            </li>
          );
        })}
        {state.log.length === 0 && <li className="muted">The chat is quiet. Too quiet.</li>}
      </ol>
    </div>
  );
}
