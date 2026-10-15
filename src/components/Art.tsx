import type { CharacterId } from '../game/types';
import { CHARACTERS } from '../game/characters';

export function Ghost({ laptop = false, className = '', title = 'The Ghost Member' }: { laptop?: boolean; className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 160" role="img" aria-label={title}>
      <defs>
        <radialGradient id="ghostGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#E6DDFF" />
          <stop offset="100%" stopColor="#B9A4FF" />
        </radialGradient>
      </defs>
      <path
        d="M70 12c-27 0-44 20-44 47v70l11-9 11 10 11-10 11 10 11-10 11 10 11-10 11 9V59c0-27-17-47-44-47z"
        fill="url(#ghostGlow)"
        opacity="0.96"
      />
      <ellipse cx="55" cy="58" rx="5.5" ry="8" fill="#100C18" />
      <ellipse cx="86" cy="58" rx="5.5" ry="8" fill="#100C18" />
      <ellipse cx="70" cy="78" rx="5" ry="3.5" fill="#100C18" opacity="0.8" />
      <circle cx="46" cy="72" r="5" fill="#FF8FB1" opacity="0.35" />
      <circle cx="96" cy="72" r="5" fill="#FF8FB1" opacity="0.35" />
      {laptop && (
        <g>
          <path d="M30 108l-12-6 4-3 20 6z" fill="#E6DDFF" />
          <path d="M110 108l12-6-4-3-20 6z" fill="#E6DDFF" />
          <rect x="36" y="92" width="68" height="40" rx="4" fill="#2B2238" stroke="#B9A4FF" strokeWidth="2" />
          <rect x="41" y="97" width="58" height="30" rx="2" fill="#F5EFE6" />
          <text x="70" y="110" textAnchor="middle" fontSize="7" fill="#100C18" fontWeight="700">GROUP REPORT</text>
          <text x="70" y="121" textAnchor="middle" fontSize="6" fill="#100C18">Authors: ME (25%)</text>
        </g>
      )}
    </svg>
  );
}

const skin: Record<CharacterId, string> = { chidi: '#8A5A3C', tobi: '#6B4129', mariam: '#A8714B', unknown: '#E6DDFF' };

export function Portrait({ id, size = 64, glitch = false }: { id: CharacterId; size?: number; glitch?: boolean }) {
  const c = CHARACTERS[id];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${c.name}, ${c.title}`}
      className={glitch ? 'portrait portrait-glitch' : 'portrait'}
    >
      <circle cx="50" cy="50" r="48" fill="#191323" stroke={c.color} strokeWidth="3" />
      {id === 'chidi' && (
        <g>
          <path d="M20 96c2-18 16-26 30-26s28 8 30 26z" fill="#65D6A3" />
          <circle cx="50" cy="46" r="22" fill={skin.chidi} />
          <path d="M28 42c0-16 10-22 22-22s22 6 22 22c-6-8-14-10-22-10s-16 2-22 10z" fill="#1B1420" />
          <circle cx="42" cy="48" r="3" fill="#100C18" />
          <circle cx="58" cy="48" r="3" fill="#100C18" />
          <rect x="35" y="43" width="14" height="11" rx="3" fill="none" stroke="#F5EFE6" strokeWidth="1.6" />
          <rect x="51" y="43" width="14" height="11" rx="3" fill="none" stroke="#F5EFE6" strokeWidth="1.6" />
          <path d="M43 62q7-4 14 0" stroke="#100C18" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M74 30q3 6 0 9q-3-3 0-9z" fill="#7FD3FF" />
          <path d="M26 34q-3 6 0 8q3-2 0-8z" fill="#7FD3FF" />
        </g>
      )}
      {id === 'tobi' && (
        <g>
          <path d="M18 96c2-18 16-26 32-26s30 8 32 26z" fill="#F28C28" />
          <circle cx="50" cy="46" r="22" fill={skin.tobi} />
          <path d="M27 40c1-12 10-18 23-18s22 6 23 18c-4-4-10-5-23-5s-19 1-23 5z" fill="#0F0B14" />
          <circle cx="42" cy="47" r="2.8" fill="#100C18" />
          <circle cx="58" cy="47" r="2.8" fill="#100C18" />
          <path d="M40 57q10 10 20 0z" fill="#F5EFE6" stroke="#100C18" strokeWidth="1.4" />
          <rect x="62" y="68" width="26" height="18" rx="2" fill="#F5EFE6" stroke="#B9A4FF" strokeWidth="1.5" />
          <text x="75" y="80" textAnchor="middle" fontSize="8" fill="#100C18" fontWeight="700">94</text>
        </g>
      )}
      {id === 'mariam' && (
        <g>
          <path d="M20 96c2-18 14-26 30-26s28 8 30 26z" fill="#FF8FB1" />
          <path d="M24 56c-6-24 6-40 26-40s32 16 26 40c0 8-4 14-8 16V56H32v16c-4-2-8-8-8-16z" fill="#1B1420" />
          <circle cx="50" cy="48" r="20" fill={skin.mariam} />
          <path d="M30 42c4-12 12-16 20-16s16 4 20 16c-6-4-12-6-20-6s-14 2-20 6z" fill="#1B1420" />
          <circle cx="43" cy="49" r="2.8" fill="#100C18" />
          <circle cx="57" cy="49" r="2.8" fill="#100C18" />
          <path d="M44 58q6 5 12 0" stroke="#100C18" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="64" y="64" width="22" height="26" rx="3" fill="#F5EFE6" />
          <path d="M68 71h14M68 77h14M68 83h9" stroke="#FF8FB1" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {id === 'unknown' && (
        <g>
          <path d="M50 14c-18 0-30 14-30 32v42l7-6 7 6 8-6 8 6 8-6 7 6 7-6 7 6V46c0-18-12-32-30-32z" fill="#B9A4FF" />
          <ellipse cx="40" cy="45" rx="4" ry="6" fill="#100C18" />
          <ellipse cx="60" cy="45" rx="4" ry="6" fill="#100C18" />
          <ellipse cx="50" cy="60" rx="3.5" ry="2.5" fill="#100C18" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <h1 className={compact ? 'wordmark wordmark-compact' : 'wordmark'}>
      <span className="wm-top">Group Project</span>
      <span className="wm-bottom">
        The Haunt<span className="wm-i">i</span>ng
      </span>
    </h1>
  );
}

/** Rainy dorm room. Purely decorative; sits behind the UI. */
export function DormScene({ dim = false, fan = 0 }: { dim?: boolean; fan?: number }) {
  return (
    <div className={`dorm ${dim ? 'dorm-dim' : ''}`} aria-hidden="true" data-fan={fan}>
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" className="dorm-svg">
        <defs>
          <radialGradient id="lamp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB45E" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFB45E" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="winSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2B1F45" />
            <stop offset="100%" stopColor="#15102A" />
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="#100C18" />
        {/* window */}
        <g transform="translate(70 40)">
          <rect width="260" height="230" rx="6" fill="url(#winSky)" stroke="#3A2D49" strokeWidth="6" />
          <path d="M20 215v-80h30v-30h26v30h24v-50h34v50h28v-20h30v100z" fill="#1D1531" />
          <rect x="60" y="150" width="6" height="8" fill="#FFB45E" opacity="0.8" />
          <rect x="130" y="130" width="6" height="8" fill="#FFB45E" opacity="0.6" />
          <rect x="190" y="160" width="6" height="8" fill="#B9A4FF" opacity="0.7" />
          <path d="M130 0v230M0 115h260" stroke="#3A2D49" strokeWidth="5" />
          <g className="rain-lines" stroke="#B9A4FF" strokeWidth="1.2" opacity="0.45">
            {Array.from({ length: 22 }).map((_, i) => (
              <line key={i} x1={10 + i * 11.5} y1={-20} x2={4 + i * 11.5} y2={0} style={{ animationDelay: `${(i * 137) % 900}ms`, animationDuration: `${700 + ((i * 53) % 500)}ms` }} />
            ))}
          </g>
        </g>
        {/* shelf + books */}
        <rect x="430" y="110" width="300" height="8" fill="#2A2038" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={445 + i * 26} y={70 + (i % 3) * 4} width="20" height={40 - (i % 3) * 4} fill={['#3A2D49', '#F28C28', '#4C3A66', '#65D6A3', '#3A2D49', '#B9A4FF'][i]} opacity="0.85" />
        ))}
        {/* wall clock */}
        <circle cx="590" cy="190" r="34" fill="#191323" stroke="#F28C28" strokeWidth="4" />
        <path d="M590 190V168M590 190l14 8" stroke="#F5EFE6" strokeWidth="3" strokeLinecap="round" />
        {/* desk */}
        <rect x="0" y="360" width="800" height="140" fill="#1B1426" />
        <rect x="0" y="352" width="800" height="14" fill="#2D2140" />
        {/* lamp */}
        <circle cx="610" cy="330" r="190" fill="url(#lamp)" className="lamp-glow" />
        <path d="M640 352l-8-70 34-44" stroke="#8A7899" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M652 224l34 4-12 26z" fill="#F28C28" />
        {/* laptop */}
        <g className="laptop-body">
          <path d="M340 352l-14-110h190l-14 110z" fill="#241B33" stroke="#4C3A66" strokeWidth="3" />
          <path d="M350 342l-10-92h160l-10 92z" fill="#B9A4FF" opacity="0.16" />
          <rect x="300" y="352" width="260" height="10" rx="4" fill="#3A2D49" />
        </g>
        {/* cups + notes */}
        <rect x="170" y="318" width="26" height="34" rx="4" fill="#E6DDFF" opacity="0.75" />
        <rect x="210" y="326" width="22" height="26" rx="4" fill="#F5EFE6" opacity="0.65" />
        <rect x="90" y="338" width="64" height="14" fill="#4C3A66" />
        <rect x="96" y="326" width="56" height="12" fill="#F28C28" opacity="0.8" />
        <rect x="660" y="340" width="40" height="12" fill="#F5EFE6" opacity="0.75" transform="rotate(-6 680 346)" />
      </svg>
      <div className="grain" />
    </div>
  );
}
