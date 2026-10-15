import { useEffect, useRef } from 'react';
import { Play, Volume2, VolumeX, Zap, ZapOff, Home } from 'lucide-react';

export function PauseMenu({ sound, reduce, onResume, onSound, onReduce, onQuit }: { sound: boolean; reduce: boolean; onResume: () => void; onSound: () => void; onReduce: () => void; onQuit: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-label="Paused">
        <h2>Paused</h2>
        <p className="modal-body">The session clock is frozen. The ghost is not.</p>
        <ul className="choice-list">
          <li><button ref={ref} className="choice" onClick={onResume}><strong><Play size={14} /> Resume</strong></button></li>
          <li><button className="choice" onClick={onSound} aria-pressed={sound}><strong>{sound ? <Volume2 size={14} /> : <VolumeX size={14} />} Sound: {sound ? 'on' : 'off'}</strong></button></li>
          <li><button className="choice" onClick={onReduce} aria-pressed={reduce}><strong>{reduce ? <ZapOff size={14} /> : <Zap size={14} />} Reduced motion: {reduce ? 'on' : 'off'}</strong></button></li>
          <li><button className="choice" onClick={onQuit}><strong><Home size={14} /> Quit to title</strong></button></li>
        </ul>
      </div>
    </div>
  );
}
