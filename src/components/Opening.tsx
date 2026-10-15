import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, FastForward, Play } from 'lucide-react';
import { CHARACTERS, CHARACTER_ORDER } from '../game/characters';
import type { CharacterId } from '../game/types';
import { DormScene, Ghost, Portrait, Wordmark } from './Art';
import { sfx } from '../audio';

type Who = CharacterId | 'player';
type Item =
  | { kind: 'msg'; id: number; who: Who; text: string; time: string }
  | { kind: 'notice'; id: number; text: string };

interface Scene {
  items: Item[];
  banner: boolean;
  typing: boolean;
  voice: 0 | 1 | 2 | 3 | 4 | 5;
  dim: boolean;
  clock: string;
  glitch: boolean;
  fan: 0 | 1 | 2;
  laptop: 'open' | 'flicker' | 'closed';
  overlay: string | null;
  reveal: boolean;
  black: boolean;
  rewind: boolean;
}

const initial: Scene = {
  items: [],
  banner: false,
  typing: false,
  voice: 0,
  dim: false,
  clock: '11:00 PM',
  glitch: false,
  fan: 0,
  laptop: 'open',
  overlay: null,
  reveal: false,
  black: true,
  rewind: false,
};

const msg = (who: Who, text: string, time: string): ((s: Scene) => Scene) => (s) => ({
  ...s,
  typing: false,
  items: [...s.items, { kind: 'msg', id: s.items.length, who, text, time }],
});
const notice = (text: string): ((s: Scene) => Scene) => (s) => ({ ...s, items: [...s.items, { kind: 'notice', id: s.items.length, text }] });

interface Step {
  wait: number;
  run: (s: Scene) => Scene;
}

export const CHAT_STEPS: Step[] = [
  { wait: 700, run: (s) => ({ ...s, black: false }) },
  { wait: 1700, run: (s) => ({ ...s, banner: true }) },
  { wait: 1500, run: msg('chidi', "Guys, who's submitting the assignment?", '10:57 PM') },
  { wait: 1800, run: msg('tobi', "Relax. I've finished the slides.", '10:58 PM') },
  { wait: 1800, run: msg('chidi', 'The lecturer asked for a 15-page written report.', '10:58 PM') },
  { wait: 1800, run: msg('tobi', 'Good news. My slides are 94 pages.', '10:59 PM') },
  { wait: 1800, run: msg('mariam', "Can we have a quick meeting to discuss why we haven't started?", '10:59 PM') },
  { wait: 2000, run: msg('player', 'We have 60 minutes. Please. Somebody write something.', '11:00 PM') },
  { wait: 1900, run: msg('unknown', 'Sorry guys 😭 just woke up. What\'s the course code?', '11:00 PM') },
  { wait: 1600, run: (s) => ({ ...notice('Unknown Member changed their group profile picture.')(s), glitch: true }) },
  { wait: 160, run: (s) => ({ ...s, glitch: false }) },
  { wait: 1700, run: (s) => ({ ...msg('unknown', 'Also, who has my matric number? I need it for the cover page.', '11:00 PM')(s), fan: 1 }) },
  { wait: 1400, run: (s) => ({ ...s, typing: true }) },
  { wait: 1300, run: (s) => ({ ...s, typing: false }) },
  { wait: 900, run: (s) => ({ ...s, typing: true }) },
  { wait: 1600, run: (s) => ({ ...s, typing: false, voice: 1 }) },
  { wait: 1700, run: (s) => ({ ...s, voice: 2 }) },
  { wait: 5400, run: (s) => ({ ...s, voice: 3 }) },
  { wait: 1700, run: (s) => ({ ...s, voice: 4, rewind: true }) },
  { wait: 1500, run: (s) => ({ ...msg('unknown', 'Guys, why is my part missing?', '11:01 PM')(s), voice: 5, rewind: false, dim: true, clock: '11:01 PM', fan: 2 }) },
  { wait: 2000, run: msg('unknown', "I can see that you're online, Henry.", '11:01 PM') },
  { wait: 1700, run: (s) => ({ ...s, laptop: 'flicker' }) },
  { wait: 1300, run: (s) => ({ ...s, laptop: 'closed', overlay: 'We need to discuss my contribution.' }) },
  { wait: 2400, run: (s) => ({ ...s, overlay: 'I deserve at least 25%.' }) },
  { wait: 2400, run: (s) => ({ ...s, reveal: true }) },
  { wait: 2600, run: (s) => ({ ...s, overlay: null }) },
];

export const CHAT_WAITS = CHAT_STEPS.map((s) => s.wait);

const VOICE_TEXT =
  "Guys, I've done my part. Please don't remove me from the group. You know how hard it is to get a group project these days.";

function useSteps(steps: number, onDone: () => void, waits: number[]) {
  const [idx, setIdx] = useState(0);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (idx >= steps) {
      if (!done.current) {
        done.current = true;
        onDoneRef.current();
      }
      return;
    }
    const t = window.setTimeout(() => setIdx((i) => i + 1), waits[idx]);
    return () => window.clearTimeout(t);
  }, [idx, steps, waits]);
  const advance = useCallback(() => setIdx((i) => Math.min(i + 1, steps)), [steps]);
  return { idx, advance };
}

function Typewriter({ text, speed = 70, instant = false }: { text: string; speed?: number; instant?: boolean }) {
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant) return;
    const id = window.setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), speed);
    return () => window.clearInterval(id);
  }, [text, speed, instant]);
  return <span aria-label={text}>{text.slice(0, n)}</span>;
}

function VoiceCard({ phase, onPlay }: { phase: number; onPlay: () => void }) {
  const words = VOICE_TEXT.split(' ');
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (phase < 2) return;
    const id = window.setInterval(() => setShown((n) => Math.min(words.length, n + 1)), 230);
    return () => window.clearInterval(id);
  }, [phase, words.length]);
  const playing = phase === 2;
  return (
    <div className={`voice ${phase === 4 ? 'voice-rewind' : ''}`}>
      <div className="voice-row">
        <button className="voice-play" onClick={onPlay} aria-label="Play voice message" disabled={phase !== 1}>
          <Play size={18} />
        </button>
        <div className={`wave ${playing ? 'wave-on' : ''}`} aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <i key={i} style={{ animationDelay: `${(i * 70) % 600}ms`, height: `${30 + ((i * 37) % 60)}%` }} />
          ))}
        </div>
        <span className="voice-time">VOICE MESSAGE — 0:07</span>
      </div>
      {phase >= 2 && (
        <p className="voice-transcript" aria-live="polite">
          {words.slice(0, shown).join(' ')}
        </p>
      )}
      {phase >= 3 && <p className="voice-whisper">What part?</p>}
    </div>
  );
}

function ChatScene({ onDone }: { onDone: () => void }) {
  const { idx, advance } = useSteps(CHAT_STEPS.length, onDone, CHAT_WAITS);
  const scene = CHAT_STEPS.slice(0, idx).reduce((s, st) => st.run(s), initial);
  const listRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    if (scene.items.length > prevCount.current) {
      const last = scene.items[scene.items.length - 1];
      sfx(last.kind === 'notice' ? 'glitch' : 'ping');
    }
    prevCount.current = scene.items.length;
  });

  return (
    <div className={`opening-chat ${scene.dim ? 'is-dim' : ''} ${scene.rewind ? 'is-rewind' : ''}`}>
      <DormScene dim={scene.dim} fan={scene.fan} />
      <div className="clock-badge" aria-label={`Clock ${scene.clock}`}>
        <strong>{scene.clock}</strong>
        <span>59–60 minutes until submission</span>
      </div>
      <div className={`phone laptop-${scene.laptop}`}>
        <header className="chat-head">
          <div className={`group-avatar ${scene.glitch ? 'avatar-glitch' : ''}`}>
            <Portrait id="unknown" size={38} glitch={scene.glitch} />
          </div>
          <div>
            <h2>EEE 204 — Academic Avengers</h2>
            <AnimatePresence>
              {scene.banner && (
                <motion.p className="chat-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  No academic achievement has been recorded for this group.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </header>
        <div className="chat-list" ref={listRef} role="log" aria-live="polite">
          {scene.items.map((it) =>
            it.kind === 'notice' ? (
              <motion.div key={it.id} className="chat-notice" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                {it.text}
              </motion.div>
            ) : (
              <motion.div
                key={it.id}
                className={`bubble ${it.who === 'player' ? 'bubble-me' : ''}`}
                style={{ ['--who' as string]: it.who === 'player' ? '#F28C28' : CHARACTERS[it.who].color }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {it.who !== 'player' && (
                  <span className="bubble-name">
                    {CHARACTERS[it.who].name} <time>{it.time}</time>
                  </span>
                )}
                <p>{it.text}</p>
                {it.who === 'player' && <time className="bubble-time">{it.time}</time>}
              </motion.div>
            ),
          )}
          {scene.voice >= 1 && scene.voice <= 4 && <VoiceCard phase={scene.voice} onPlay={advance} />}
          {scene.typing && (
            <div className="typing" style={{ ['--who' as string]: CHARACTERS.unknown.color }}>
              Unknown Member is typing<span className="dots">…</span>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {scene.overlay && (
          <motion.p key={scene.overlay} className="overlay-line" initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0 }}>
            {scene.overlay}
          </motion.p>
        )}
      </AnimatePresence>
      {scene.reveal && <Ghost className="ghost-reveal" laptop />}
      <div className={`black ${scene.black ? 'black-on' : ''}`} />
      <button className="next-btn" onClick={advance}>
        Next <ArrowRight size={16} />
      </button>
    </div>
  );
}

const TITLE_WAITS = [600, 2200, 2000, 2600, 1500, 3800, 1600];
function TitleScene({ onDone, reduce }: { onDone: () => void; reduce: boolean }) {
  const { idx, advance } = useSteps(TITLE_WAITS.length, onDone, TITLE_WAITS);
  return (
    <div className="opening-title">
      <div className="title-stage">
        {idx >= 1 && (
          <Wordmark compact={false} />
        )}
        {idx >= 1 && (
          <p className="title-typed" aria-hidden="true">
            <Typewriter text="A UNIVERSITY SURVIVAL HORROR" speed={reduce ? 1 : 55} instant={reduce} />
          </p>
        )}
        {idx >= 3 && (
          <p className="tagline">
            They contributed nothing.
            <br />
            They will take the credit.
          </p>
        )}
        {idx >= 4 && <p className="warning">Not everyone will survive the deadline.</p>}
      </div>
      {idx >= 4 && idx < 7 && (
        <div className={`ghost-walk ${idx >= 5 ? 'ghost-pause' : ''} ${idx >= 6 ? 'ghost-vanish' : ''}`}>
          {idx >= 5 && idx < 6 && <p className="ghost-say">Before we begin, just put my name first on the cover page.</p>}
          <Ghost laptop className="ghost-small" />
        </div>
      )}
      <button className="next-btn" onClick={advance}>
        Next <ArrowRight size={16} />
      </button>
    </div>
  );
}

function BriefScene({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="opening-brief">
      <div className="brief-doc">
        <h2>EEE 204 — Group Assignment</h2>
        <p className="brief-deadline">Deadline: 12:00 AM</p>
        <ul>
          <li>15-page technical report</li>
          <li>At least five academic references</li>
          <li>Proper formatting</li>
          <li>All group members listed</li>
        </ul>
        <div className="brief-progress">
          <div className="bar"><i style={{ width: '20%' }} /></div>
          <span>Progress 20/100. The cover page exists. The report is mostly unfinished.</span>
        </div>
      </div>
      <div className="profiles">
        {CHARACTER_ORDER.map((id, i) => {
          const c = CHARACTERS[id];
          return (
            <motion.div key={id} className="profile" style={{ ['--who' as string]: c.color }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 * i }}>
              <Portrait id={id} size={72} />
              <div>
                <h3>{c.name} — {c.title}</h3>
                <p>{c.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <button className="primary-btn" onClick={onFinish}>
        Open the group chat <ArrowRight size={18} />
      </button>
    </div>
  );
}

export function Opening({ onFinish, canSkip, reduce }: { onFinish: () => void; canSkip: boolean; reduce: boolean }) {
  const [scene, setScene] = useState<'chat' | 'title' | 'brief'>('chat');
  return (
    <div className="opening" data-scene={scene}>
      {scene === 'chat' && <ChatScene onDone={() => setScene('title')} />}
      {scene === 'title' && <TitleScene reduce={reduce} onDone={() => setScene('brief')} />}
      {scene === 'brief' && <BriefScene onFinish={onFinish} />}
      {canSkip && scene !== 'brief' && (
        <button className="skip-btn" onClick={onFinish}>
          <FastForward size={16} /> Skip intro
        </button>
      )}
    </div>
  );
}
