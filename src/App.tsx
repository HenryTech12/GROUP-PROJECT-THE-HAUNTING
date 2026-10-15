import { useCallback, useEffect, useReducer, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { createGame, reduce } from './game/engine';
import { REAL_TIME_LIMIT_SECONDS } from './game/constants';
import type { GameAction } from './game/types';
import { useCountdown } from './hooks/useCountdown';
import { loadSaved, persist, type Saved } from './storage';
import { setMusicIntensity, setSoundEnabled, sfx, startMusic, startRain, stopMusic, stopRain } from './audio';
import { TitleScreen } from './components/TitleScreen';
import { Opening } from './components/Opening';
import { FirstChoice } from './components/FirstChoice';
import { Workspace } from './components/Workspace';
import { EndingScreen } from './components/EndingScreen';
import { PauseMenu } from './components/PauseMenu';

type Screen = 'title' | 'opening' | 'game';

export default function App() {
  const [saved, setSaved] = useState<Saved>(() => loadSaved());
  const [screen, setScreen] = useState<Screen>('title');
  const [game, dispatch] = useReducer(reduce, undefined, () => createGame());
  const [paused, setPaused] = useState(false);
  const [runId, setRunId] = useState(0);

  const systemReduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const reduceMotion = saved.reduceMotion ?? systemReduce;

  const update = useCallback((patch: Partial<Saved>) => {
    setSaved((s) => {
      const next = { ...s, ...patch };
      persist(next);
      return next;
    });
  }, []);

  useEffect(() => {
    setSoundEnabled(saved.sound);
    // "Treachery in Bleach" starts when START SURVIVAL is pressed (a user gesture) and plays until the ending
    const inRun = screen !== 'title' && !(screen === 'game' && game.phase === 'ended');
    if (saved.sound && inRun) {
      startMusic();
      startRain();
    } else {
      stopMusic(game.phase === 'ended' ? 2.5 : 0.8);
      stopRain();
    }
  }, [saved.sound, screen, game.phase]);

  useEffect(() => {
    const unlock = () => {
      if (saved.sound && screen !== 'title') startMusic();
    };
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, [saved.sound, screen]);

  useEffect(() => {
    setMusicIntensity(game.phase === 'boss' ? 1 : game.phase === 'playing' && game.timeLeft <= 30 ? 0.5 : 0);
  }, [game.phase, game.timeLeft]);

  const playing = screen === 'game' && (game.phase === 'playing' || game.phase === 'boss');
  const realLeft = useCountdown({
    seconds: REAL_TIME_LIMIT_SECONDS,
    running: playing && !paused,
    resetKey: runId,
    onExpire: () => dispatch({ type: 'timeExpired' }),
  });

  // record ending once
  useEffect(() => {
    if (game.phase === 'ended' && game.ending) {
      setSaved((s) => {
        const next = {
          ...s,
          plays: s.plays + 1,
          bestProgress: Math.max(s.bestProgress, game.progress),
          endings: s.endings.includes(game.ending!) ? s.endings : [...s.endings, game.ending!],
        };
        persist(next);
        return next;
      });
      sfx(game.ending === 'last-word' ? 'good' : 'bad');
      setPaused(false);
    }
  }, [game.phase, game.ending, game.progress]);

  const send = useCallback((a: GameAction) => {
    sfx('tap');
    dispatch(a);
  }, []);

  const startGame = () => {
    dispatch({ type: 'reset' });
    setRunId((n) => n + 1);
    setPaused(false);
    setScreen('game');
  };

  const handleStart = () => {
    sfx('tap');
    setScreen('opening'); // the opening is skippable only after it has been seen once
    dispatch({ type: 'reset' });
  };

  const finishOpening = () => {
    update({ openingSeen: true });
    startGame();
  };

  const toTitle = () => {
    setPaused(false);
    setScreen('title');
  };

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <div className="app" data-reduce={reduceMotion ? 'true' : 'false'}>
        {screen === 'title' && (
          <TitleScreen
            onStart={handleStart}
            sound={saved.sound}
            onSound={() => update({ sound: !saved.sound })}
            discovered={saved.endings}
            openingSeen={saved.openingSeen}
          />
        )}
        {screen === 'opening' && <Opening onFinish={finishOpening} canSkip={saved.openingSeen} reduce={reduceMotion} />}
        {screen === 'game' && (game.phase === 'firstChoice' || game.phase === 'firstResult') && (
          <FirstChoice state={game} onChoose={(option) => send({ type: 'chooseFirst', option })} onContinue={() => send({ type: 'ackIntro' })} />
        )}
        {screen === 'game' && (game.phase === 'playing' || game.phase === 'boss') && (
          <Workspace
            state={game}
            realLeft={realLeft}
            paused={paused}
            onPause={() => setPaused(true)}
            onAct={(id) => send({ type: 'act', id })}
            onBoss={(id) => send({ type: 'bossMove', id })}
            onEvent={(choice) => send({ type: 'resolveEvent', choice })}
          />
        )}
        {screen === 'game' && game.phase === 'ended' && (
          <EndingScreen state={game} discovered={saved.endings} onRestart={startGame} onTitle={toTitle} />
        )}
        {paused && playing && (
          <PauseMenu
            sound={saved.sound}
            reduce={reduceMotion}
            onResume={() => setPaused(false)}
            onSound={() => update({ sound: !saved.sound })}
            onReduce={() => update({ reduceMotion: !reduceMotion })}
            onQuit={toTitle}
          />
        )}
      </div>
    </MotionConfig>
  );
}
