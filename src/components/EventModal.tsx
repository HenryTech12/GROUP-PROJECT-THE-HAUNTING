import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CHARACTERS, speakerName } from '../game/characters';
import { EVENT_BY_ID } from '../game/events';
import { Portrait } from './Art';

export function EventModal({ eventId, paused, onChoose }: { eventId: string; paused: boolean; onChoose: (i: number) => void }) {
  const ev = EVENT_BY_ID[eventId];
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, [eventId]);
  if (!ev) return null;
  const speakerIsChar = ev.speaker in CHARACTERS;
  return (
    <div className="modal-backdrop">
      <motion.div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        style={{ ['--who' as string]: speakerIsChar ? CHARACTERS[ev.speaker as keyof typeof CHARACTERS].color : '#B6AABD' }}
      >
        <div className="modal-head">
          {speakerIsChar ? <Portrait id={ev.speaker as keyof typeof CHARACTERS} size={52} /> : <div className="sys-badge" aria-hidden>!</div>}
          <div>
            <h2 id="event-title">{ev.title}</h2>
            <span className="modal-from">{speakerName(ev.speaker)}</span>
          </div>
        </div>
        <p className="modal-body">{ev.body}</p>
        <ul className="choice-list">
          {ev.choices.map((c, i) => (
            <li key={c.label}>
              <button ref={i === 0 ? first : undefined} className="choice" disabled={paused} onClick={() => onChoose(i)}>
                <strong>{c.label}</strong>
                <small>{c.hint}</small>
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
