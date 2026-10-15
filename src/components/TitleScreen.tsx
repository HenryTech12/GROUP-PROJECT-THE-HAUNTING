import { useState } from 'react';
import { Info, Volume2, VolumeX, X } from 'lucide-react';
import type { EndingId } from '../game/types';
import { DormScene, Ghost, Wordmark } from './Art';

export function TitleScreen({ onStart, sound, onSound, discovered, openingSeen }: { onStart: () => void; sound: boolean; onSound: () => void; discovered: EndingId[]; openingSeen: boolean }) {
  const [about, setAbout] = useState(false);
  return (
    <div className="title">
      <DormScene />
      <div className="title-ghost" aria-hidden="true">
        <p className="title-ghost-say">Before we begin, just put my name first on the cover page.</p>
        <Ghost laptop className="ghost-small" />
      </div>
      <main className="title-main">
        <Wordmark />
        <p className="subtitle">
          They contributed nothing.
          <br />
          They will take the credit.
        </p>
        <p className="support">One assignment. Four teammates. One hour.</p>
        <button className="primary-btn big" onClick={onStart} data-testid="start">
          START SURVIVAL
        </button>
        {openingSeen && <p className="hint">You have seen the opening. You can skip it this time.</p>}
        {discovered.length > 0 && <p className="hint">Endings found: {discovered.length}/3</p>}
      </main>
      <div className="title-tools">
        <button className="icon-btn" onClick={onSound} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button className="icon-btn" onClick={() => setAbout(true)} aria-label="About and credits">
          <Info size={18} />
        </button>
      </div>
      {about && (
        <div className="modal-backdrop" onClick={() => setAbout(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="About" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>About</h2>
              <button className="icon-btn" onClick={() => setAbout(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <p className="modal-body">
              Group Project: The Haunting is a 3–5 minute horror-comedy about a late assignment and a teammate who has been dead since before the course began. Manage time, sanity and trust, then face the Ghost Member.
            </p>
            <p className="modal-body">Every character, ghost and group chat is fictional. Any resemblance to your own group project is a coincidence and a warning.</p>
          </div>
        </div>
      )}
    </div>
  );
}
