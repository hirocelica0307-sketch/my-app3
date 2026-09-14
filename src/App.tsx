import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameEngine, TIME_LIMITS, type TimeLimit } from './engine/game/engine';
import { createKeyListener } from './engine/input/keyboard';
import { ImeWatcher } from './engine/input/ime';
import { createStage, fitScale, VIEW_H, VIEW_W } from './render/canvas';
import { getLine, DEFAULT_LINE_ID } from './data/lines';
import { bestFare, loadSave, recordScore, updateSettings } from './storage/save';
import { useEngineSnapshot } from './ui/hooks/useGameEngine';
import { PlayScreen } from './ui/screens/PlayScreen';
import { TitleScreen } from './ui/screens/TitleScreen';
import { ConfigScreen } from './ui/screens/ConfigScreen';
import { CountdownScreen } from './ui/screens/CountdownScreen';
import { PauseScreen } from './ui/screens/PauseScreen';
import { Ticket } from './ui/components/Ticket';
import { ImeWarning } from './ui/components/ImeWarning';
import type { RunSummary } from './engine/game/scoring';

export function App() {
  const line = useMemo(() => getLine(DEFAULT_LINE_ID), []);
  const settings = useMemo(() => loadSave().settings, []);
  const [timeLimit, setTimeLimitState] = useState<TimeLimit>(settings.defaultTimeLimit);

  // ハイスコアは「路線 × 秒数」で分かれているので、時間を変えたら表示も切り替える
  const [best, setBest] = useState<number | null>(() => bestFare(line.id, settings.defaultTimeLimit));
  const refreshBest = useCallback((t: TimeLimit) => setBest(bestFare(line.id, t)), [line.id]);

  const onFinish = useCallback((s: RunSummary): boolean => {
    const isBest = recordScore(line.id, s.timeLimit as TimeLimit, {
      fare: s.fare, baseFare: s.baseFare, bonus: s.bonus,
      reachedKanji: s.reachedKanji, reachedCount: s.reachedCount, km: s.km,
      keystrokes: s.keystrokes, correct: s.correct, misses: s.misses,
      accuracy: s.accuracy, kpm: s.kpm, maxCombo: s.maxCombo, laps: s.laps,
      playedAt: Date.now(),
    }, s.elapsedSec);
    refreshBest(s.timeLimit as TimeLimit);
    return isBest;
  }, [line.id, refreshBest]);

  const engine = useMemo(
    () => new GameEngine({ line, timeLimit: settings.defaultTimeLimit, showRomaji: settings.showRomaji, onFinish }),
    [line, settings.defaultTimeLimit, settings.showRomaji, onFinish],
  );
  const snap = useEngineSnapshot(engine);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const pointerCoarse = useMemo(
    () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches,
    [],
  );

  const chooseTime = useCallback((t: TimeLimit) => {
    setTimeLimitState(t);
    engine.setTimeLimit(t);
    updateSettings({ defaultTimeLimit: t });
    refreshBest(t);
  }, [engine, refreshBest]);

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

    const runPauseAction = () => {
      switch (engine.pauseSelection) {
        case 'resume': engine.setPaused(false); break;
        case 'restart': engine.restart(); break;
        case 'title': engine.backToTitle(); break;
      }
    };

    const listener = createKeyListener(
      {
        onChar: (key) => {
          const phase = engine.currentPhase;
          const k = key.toLowerCase();
          if (phase === 'result') {
            if (k === 'r') engine.restart();
            return;
          }
          // 一時停止中はメニューのショートカットとして扱う（打鍵にはしない）
          if (engine.isPaused) {
            if (k === 'r') engine.restart();
            else if (k === 't') engine.backToTitle();
            return;
          }
          engine.handleChar(key);
        },
        onCommand: (key) => {
          const phase = engine.currentPhase;

          if (engine.isPaused && phase !== 'result') {
            if (key === 'ArrowUp') engine.movePauseCursor(-1);
            else if (key === 'ArrowDown') engine.movePauseCursor(1);
            else if (key === 'Enter') runPauseAction();
            else if (key === 'Escape') engine.setPaused(false);
            return;
          }

          switch (phase) {
            case 'title':
              if (key === ' ' || key === 'Enter') engine.openConfig();
              break;
            case 'config': {
              const i = TIME_LIMITS.indexOf(timeLimit);
              if (key === 'ArrowLeft') chooseTime(TIME_LIMITS[Math.max(0, i - 1)]!);
              else if (key === 'ArrowRight') chooseTime(TIME_LIMITS[Math.min(TIME_LIMITS.length - 1, i + 1)]!);
              else if (key === 'Enter' || key === ' ') engine.start();
              else if (key === 'Escape') engine.backToTitle();
              break;
            }
            case 'atStation':
            case 'departing':
              if (key === 'Escape') engine.setPaused(true);
              break;
            case 'result':
              if (key === 'Escape') engine.backToTitle();
              break;
          }
        },
      },
      (e) => watcher.inspectKeydown(e),
    );
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [engine, timeLimit, chooseTime]);

  // タブが隠れたら自動ポーズ
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && (engine.currentPhase === 'atStation' || engine.currentPhase === 'departing')) {
        engine.setPaused(true);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [engine]);

  const retro = settings.retroEffects;
  const playing = snap.phase === 'atStation' || snap.phase === 'departing' || snap.phase === 'turnaround';

  return (
    <div className="app" ref={appRef}>
      <div ref={stageRef} className={`stage${retro ? ' scanlines vignette' : ''}`}>
        <canvas ref={canvasRef} />

        {playing && <PlayScreen snap={snap} />}

        {snap.phase === 'title' && (
          <TitleScreen
            best={best}
            lineName={line.nameJp}
            destination={line.destination}
            timeLimit={timeLimit}
            scopeNote={line.scopeNote ?? ''}
            pointerCoarse={pointerCoarse}
          />
        )}

        {snap.phase === 'config' && (
          <ConfigScreen
            selected={timeLimit}
            best={best}
            lineName={line.nameJp}
            destination={line.destination}
            scopeNote={line.scopeNote ?? ''}
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
          <PauseScreen index={snap.pauseIndex} />
        )}
      </div>
    </div>
  );
}
