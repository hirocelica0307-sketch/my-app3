import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameEngine } from './engine/game/engine';
import { createKeyListener } from './engine/input/keyboard';
import { ImeWatcher } from './engine/input/ime';
import { createStage, fitScale, VIEW_H, VIEW_W } from './render/canvas';
import { getLine, DEFAULT_LINE_ID } from './data/lines';
import { bestFare, loadSave, recordScore } from './storage/save';
import { useEngineSnapshot } from './ui/hooks/useGameEngine';
import { PlayScreen } from './ui/screens/PlayScreen';
import { TitleScreen } from './ui/screens/TitleScreen';
import { CountdownScreen } from './ui/screens/CountdownScreen';
import { Ticket } from './ui/components/Ticket';
import { ImeWarning } from './ui/components/ImeWarning';
import type { RunSummary } from './engine/game/scoring';

export function App() {
  const line = useMemo(() => getLine(DEFAULT_LINE_ID), []);
  const settings = useMemo(() => loadSave().settings, []);
  const timeLimit = settings.defaultTimeLimit;

  const onFinish = useCallback((s: RunSummary): boolean => {
    return recordScore(line.id, timeLimit, {
      fare: s.fare, baseFare: s.baseFare, bonus: s.bonus,
      reachedKanji: s.reachedKanji, reachedCount: s.reachedCount, km: s.km,
      keystrokes: s.keystrokes, correct: s.correct, misses: s.misses,
      accuracy: s.accuracy, kpm: s.kpm, maxCombo: s.maxCombo, laps: s.laps,
      playedAt: Date.now(),
    }, s.elapsedSec);
  }, [line.id, timeLimit]);

  const engine = useMemo(
    () => new GameEngine({ line, timeLimit, showRomaji: settings.showRomaji, onFinish }),
    [line, timeLimit, settings.showRomaji, onFinish],
  );
  const snap = useEngineSnapshot(engine);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const [best, setBest] = useState<number | null>(() => bestFare(line.id, timeLimit));
  const pointerCoarse = useMemo(
    () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches,
    [],
  );

  // Canvas を engine に繋ぐ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const stage = createStage(canvas);
    engine.attach(stage.ctx);

    const resize = () => {
      const box = stageRef.current;
      const outer = appRef.current;
      if (box === null || outer === null) return;
      const scale = fitScale(outer.clientWidth - 8, outer.clientHeight - 8);
      stage.scale = scale;
      box.style.width = `${VIEW_W * scale}px`;
      box.style.height = `${VIEW_H * scale}px`;
      box.style.setProperty('--scale', String(scale));
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (appRef.current !== null) ro.observe(appRef.current);

    return () => { ro.disconnect(); engine.detach(); };
  }, [engine]);

  // IME 監視
  useEffect(() => {
    const watcher = new ImeWatcher();
    watcher.attach();
    const unsub = watcher.subscribe((on) => engine.setImeOn(on));
    const refocus = () => watcher.refocus();
    window.addEventListener('pointerdown', refocus);
    window.addEventListener('focus', refocus);
    return () => {
      unsub();
      window.removeEventListener('pointerdown', refocus);
      window.removeEventListener('focus', refocus);
      watcher.detach();
    };
  }, [engine]);

  // キーボード
  useEffect(() => {
    const watcher = new ImeWatcher();
    const listener = createKeyListener(
      {
        onChar: (key) => {
          if (engine.currentPhase === 'result' && (key === 'r' || key === 'R')) {
            engine.restart();
            return;
          }
          engine.handleChar(key);
        },
        onCommand: (key) => {
          const phase = engine.currentPhase;
          if (key === ' ' && phase === 'title') engine.start();
          else if (key === 'Escape' && phase === 'result') {
            setBest(bestFare(line.id, timeLimit));
            window.location.reload();
          } else if (key === 'Escape' && (phase === 'atStation' || phase === 'departing')) {
            engine.setPaused(!snap.paused);
          }
        },
      },
      (e) => watcher.inspectKeydown(e),
    );
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [engine, snap.paused, line.id, timeLimit]);

  // タブが隠れたら自動ポーズ
  useEffect(() => {
    const onVis = () => { if (document.hidden) engine.setPaused(true); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [engine]);

  const retro = settings.retroEffects;

  return (
    <div className="app" ref={appRef}>
      <div
        ref={stageRef}
        className={`stage${retro ? ' scanlines vignette' : ''}`}
      >
        <canvas ref={canvasRef} />

        {(snap.phase === 'atStation' || snap.phase === 'departing' || snap.phase === 'turnaround') && (
          <PlayScreen snap={snap} />
        )}

        {snap.phase === 'title' && (
          <TitleScreen
            best={best}
            lineName={line.nameJp}
            destination={line.destination}
            timeLimit={timeLimit}
            pointerCoarse={pointerCoarse}
          />
        )}

        {snap.phase === 'countdown' && (
          <CountdownScreen
            count={snap.countdown}
            lineName={line.nameJp}
            destination={line.destination}
          />
        )}

        {snap.phase === 'result' && snap.summary !== null && (
          <Ticket summary={snap.summary} lineColor={line.lineColor} isNewRecord={snap.isNewRecord} />
        )}

        {snap.imeOn && <ImeWarning />}

        {snap.paused && !snap.imeOn && snap.phase !== 'result' && (
          <div className="overlay">
            <div>
              <div className="big">一時停止</div>
              <div className="keyhint">[Esc] で再開</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
