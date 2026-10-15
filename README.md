# Group Project: The Haunting

A horror-comedy survival game about a university assignment due at midnight, three teammates, and a ghost who wants 25% of the credit.

**Stack:** React 19, TypeScript (strict), Vite, motion, lucide-react, Vitest + Testing Library. No backend.

## Run

```bash
npm install
npm run dev        # play at http://localhost:5173
npm test           # engine + UI + timer tests
npm run build      # typecheck + production build in dist/
```

## How it plays (3–5 minutes)

1. Watch the opening (skippable after your first time), then pick a first decision.
2. Spend fictional minutes (11:00 PM → midnight) on seven actions: write, delegate, confront Tobi, hold a meeting, investigate the ghost, take a break, fix references. Eleven events interrupt you with choices.
3. At 15 minutes left (or 95% progress) the Ghost Member boss appears. Cut its credit claim from 25% to 0 using evidence, "What part?", rallying the team, negotiation, or removal.
4. Endings: **The Last Word** (banish the ghost, progress ≥ 65), **25% of Nothing** (submitted, ghost keeps credit), **Overdue** (progress < 50).

A separate 240-second real-time session clock runs only during play (pauses on pause or hidden tab). If it expires, the deadline resolves fairly into an ending.

## Code map

- `src/game/` pure rules, no React: `engine.ts` (reducer, endings), `actions.ts`, `events.ts`, `characters.ts`, `rng.ts` (seeded)
- `src/hooks/useCountdown.ts` real-time timer
- `src/components/` screens and panels, `Art.tsx` holds all SVG art
- `tests/` engine invariants (300 random playthroughs), timer hook, UI flow

Sound is off by default (WebAudio synth, toggle on title or pause menu). Reduced motion follows system settings and can be toggled in the pause menu. Only preferences, opening-seen and endings found are stored in localStorage; active runs are never persisted.
