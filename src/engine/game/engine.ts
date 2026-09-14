import type { Line } from '../../data/types';
import { feedKey } from '../typing/matcher';
import { renderRomaji, furiganaSplit } from '../typing/hint';
import { getStation } from '../../data/stations';
import { RunContext } from './run';
import { RunTimer } from './timer';
import { buildSummary, type RunSummary } from './scoring';
import { renderScene, type SceneState, type Spark } from '../../render/scene';
import type { RomajiDisplay } from '../typing/types';

export type TimeLimit = 60 | 120 | 180;
export type Phase = 'title' | 'countdown' | 'atStation' | 'departing' | 'turnaround' | 'result';

/** 走行アニメーションで1区間に費やす見かけの距離（論理px）。 */
const SEGMENT_PIXELS = 240;
const COUNTDOWN_SEC = 3;
const TURNAROUND_SEC = 1.5;

export interface Toast { id: number; text: string; life: number }

export interface Snapshot {
  phase: Phase;
  paused: boolean;
  imeOn: boolean;
  countdown: number;
  remainSec: number;
  timeLimit: TimeLimit;
  lineName: string;
  trainType: string;
  destination: string;
  lineColor: string;
  /** 現在打っている駅。 */
  stationKanji: string;
  stationKana: string;
  stationNote: string | null;
  romaji: RomajiDisplay;
  furigana: { done: number; active: number };
  showRomaji: boolean;
  nextStationKanji: string | null;
  nextSegmentKm: number;
  fare: number;
  combo: number;
  toasts: readonly Toast[];
  missFlash: boolean;
  summary: RunSummary | null;
  isNewRecord: boolean;
}

export interface EngineOptions {
  line: Line;
  timeLimit: TimeLimit;
  showRomaji: boolean;
  onFinish?: (summary: RunSummary) => boolean;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private lastFrame = 0;
  private listeners = new Set<() => void>();
  private snapshot: Snapshot;
  private notifyAccum = 0;

  private phase: Phase = 'title';
  private paused = false;
  private imeOn = false;
  private run: RunContext;
  private timer = new RunTimer();
  private options: EngineOptions;

  private phaseElapsed = 0;
  private travelSec = 0;
  private segmentStartDistance = 0;
  private toasts: Toast[] = [];
  private toastId = 0;
  private missFlash = 0;
  private summary: RunSummary | null = null;
  private isNewRecord = false;

  private scene: SceneState = {
    distance: 0, speed: 0, scene: 'suburb', vehicle: '115-yellow',
    stoppedAt: null, direction: 1, shake: 0, sparks: [], time: 0,
  };

  constructor(options: EngineOptions) {
    this.options = options;
    this.run = new RunContext(options.line);
    this.scene.vehicle = options.line.vehicle;
    this.scene.scene = this.run.currentSegment().scene;
    this.snapshot = this.buildSnapshot();
  }

  // ---- React 連携 ----

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };

  /** 変化が無ければ同じ参照を返す（React の無限ループ検知を避ける）。 */
  getSnapshot = (): Snapshot => this.snapshot;

  private emit(): void {
    this.snapshot = this.buildSnapshot();
    for (const fn of this.listeners) fn();
  }

  // ---- ライフサイクル ----

  attach(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
    this.lastFrame = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - this.lastFrame) / 1000, 0.1);
      this.lastFrame = now;
      this.update(dt);
      if (this.ctx !== null) renderScene(this.ctx, this.scene);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  detach(): void {
    cancelAnimationFrame(this.raf);
    this.ctx = null;
    this.listeners.clear();
  }

  start(): void {
    this.phase = 'countdown';
    this.phaseElapsed = 0;
    this.emit();
  }

  restart(): void {
    this.run = new RunContext(this.options.line);
    this.timer.reset();
    this.scene.distance = 0;
    this.scene.speed = 0;
    this.scene.direction = 1;
    this.scene.stoppedAt = null;
    this.scene.sparks = [];
    this.toasts = [];
    this.summary = null;
    this.isNewRecord = false;
    this.phase = 'countdown';
    this.phaseElapsed = 0;
    this.emit();
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) this.timer.pause();
    else if (this.phase === 'atStation' || this.phase === 'departing') this.timer.start();
    this.emit();
  }

  setImeOn(on: boolean): void {
    if (this.imeOn === on) return;
    this.imeOn = on;
    // IME が ON の間はタイマーを止める（打てないのに時間だけ減るのを防ぐ）
    if (on) this.timer.pause();
    else if (!this.paused && (this.phase === 'atStation' || this.phase === 'departing')) this.timer.start();
    this.emit();
  }

  setShowRomaji(show: boolean): void {
    this.options = { ...this.options, showRomaji: show };
    this.emit();
  }

  get currentPhase(): Phase { return this.phase; }

  // ---- 入力 ----

  handleChar(key: string): void {
    if (this.phase !== 'atStation' || this.paused || this.imeOn) return;
    const result = feedKey(this.run.typing, key);
    if (result.type === 'ignore') return;

    if (result.type === 'miss') {
      this.run.recordMiss();
      this.missFlash = 0.12;
      this.scene.shake = 0.16;
      const cost = this.run.lastBrakeCost();
      this.pushToast(cost > 0 ? `制動 -${cost.toFixed(1)}秒` : '制動 上限');
      this.spawnSparks();
      this.emit();
      return;
    }

    this.run.recordHit();
    this.run.typing = result.state;
    if (result.finished) this.departStation();
    this.emit();
  }

  // ---- 進行 ----

  private departStation(): void {
    this.run.completeStation();
    this.travelSec = this.run.travelSeconds();
    this.segmentStartDistance = this.scene.distance;
    this.phase = 'departing';
    this.phaseElapsed = 0;
    this.scene.stoppedAt = null;
    this.scene.scene = this.run.currentSegment().scene;
  }

  private arriveStation(): void {
    const { turnaround } = this.run.advance();
    this.scene.speed = 0;
    if (turnaround) {
      this.scene.direction = this.run.direction;
      this.phase = 'turnaround';
      this.phaseElapsed = 0;
      this.timer.pause();
      this.pushToast('終点 — 折り返します');
      return;
    }
    this.enterStation();
  }

  private enterStation(): void {
    this.phase = 'atStation';
    this.phaseElapsed = 0;
    this.scene.stoppedAt = this.run.currentStation().kanji;
    this.scene.scene = this.run.currentSegment().scene;
    if (!this.paused && !this.imeOn) this.timer.start();
  }

  private finish(): void {
    this.timer.pause();
    const origin = this.run.originStation();
    const reached = this.run.previousStation();
    this.summary = buildSummary({
      lineId: this.options.line.id,
      lineName: this.options.line.nameJp,
      trainType: this.options.line.trainType,
      originKanji: origin.kanji,
      originKana: origin.kana,
      reachedKanji: reached.kanji,
      reachedKana: reached.kana,
      reachedCount: this.run.reachedCount,
      km: Number(this.run.km.toFixed(1)),
      timeLimit: this.options.timeLimit,
      elapsedSec: this.timer.elapsedSec(),
      baseFare: this.run.baseFare,
      bonus: this.run.bonus,
      stats: this.run.stats,
      maxCombo: this.run.maxCombo,
      laps: this.run.laps,
    });
    this.isNewRecord = this.options.onFinish?.(this.summary) ?? false;
    this.phase = 'result';
    this.scene.speed = 0;
    this.emit();
  }

  private update(dt: number): void {
    this.scene.time += dt;
    this.phaseElapsed += dt;
    if (this.scene.shake > 0) this.scene.shake = Math.max(0, this.scene.shake - dt);
    if (this.missFlash > 0) this.missFlash = Math.max(0, this.missFlash - dt);
    this.stepSparks(dt);
    this.stepToasts(dt);

    if (this.paused || this.imeOn) {
      this.scene.speed = 0;
      return;
    }

    switch (this.phase) {
      case 'countdown':
        if (this.phaseElapsed >= COUNTDOWN_SEC) this.enterStation();
        break;
      case 'turnaround':
        if (this.phaseElapsed >= TURNAROUND_SEC) this.enterStation();
        break;
      case 'departing': {
        const t = Math.min(this.phaseElapsed / this.travelSec, 1);
        this.scene.distance = this.segmentStartDistance + SEGMENT_PIXELS * t;
        this.scene.speed = SEGMENT_PIXELS / this.travelSec;
        if (t >= 1) this.arriveStation();
        break;
      }
      default:
        this.scene.speed = 0;
    }

    if (this.phase === 'atStation' || this.phase === 'departing') {
      if (this.remaining() <= 0) { this.finish(); return; }
    }

    // 毎フレーム React を起こさない。100ms ごとに時間表示だけ更新する。
    this.notifyAccum += dt;
    if (this.notifyAccum >= 0.1) {
      this.notifyAccum = 0;
      this.emit();
    }
  }

  private remaining(): number {
    return Math.max(0, this.options.timeLimit - this.timer.elapsedSec());
  }

  private pushToast(text: string): void {
    this.toasts = [...this.toasts, { id: ++this.toastId, text, life: 1.4 }].slice(-3);
  }

  private stepToasts(dt: number): void {
    if (this.toasts.length === 0) return;
    this.toasts = this.toasts
      .map((t) => ({ ...t, life: t.life - dt }))
      .filter((t) => t.life > 0);
  }

  private spawnSparks(): void {
    const made: Spark[] = [];
    for (let i = 0; i < 5; i++) {
      made.push({
        x: 100 + i * 9, y: 119,
        vx: -30 - Math.random() * 40, vy: -40 - Math.random() * 30,
        life: 0.4 + Math.random() * 0.2,
      });
    }
    this.scene.sparks = [...this.scene.sparks, ...made].slice(-30);
  }

  private stepSparks(dt: number): void {
    if (this.scene.sparks.length === 0) return;
    this.scene.sparks = this.scene.sparks
      .map((s) => ({ ...s, x: s.x + s.vx * dt, y: s.y + s.vy * dt, vy: s.vy + 260 * dt, life: s.life - dt }))
      .filter((s) => s.life > 0);
  }

  private buildSnapshot(): Snapshot {
    const station = this.run.currentStation();
    const nextIndex = this.run.stopIndex + this.run.direction;
    const nextId = this.options.line.stops[nextIndex];
    return {
      phase: this.phase,
      paused: this.paused,
      imeOn: this.imeOn,
      countdown: Math.max(0, Math.ceil(COUNTDOWN_SEC - this.phaseElapsed)),
      remainSec: this.remaining(),
      timeLimit: this.options.timeLimit,
      lineName: this.options.line.nameJp,
      trainType: this.options.line.trainType,
      destination: this.options.line.destination,
      lineColor: this.options.line.lineColor,
      stationKanji: station.kanji,
      stationKana: station.kana,
      stationNote: station.note ?? null,
      romaji: renderRomaji(this.run.typing),
      furigana: furiganaSplit(this.run.typing),
      showRomaji: this.options.showRomaji,
      nextStationKanji: nextId === undefined ? null : getStation(nextId).kanji,
      nextSegmentKm: this.run.currentSegment().km,
      fare: this.run.fare,
      combo: this.run.combo,
      toasts: this.toasts,
      missFlash: this.missFlash > 0,
      summary: this.summary,
      isNewRecord: this.isNewRecord,
    };
  }
}
