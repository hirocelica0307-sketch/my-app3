import type { Line } from '../../data/types';
import { getStation } from '../../data/stations';
import { createTypingState } from '../typing/matcher';
import type { TypingState } from '../typing/types';
import { emptyStats, type RunStats } from '../typing/stats';
import { calcFareById } from './fare';
import { COMBO_BONUS_PER_STATION, TERMINAL_BONUS_RATE } from './scoring';

/**
 * 車種ごとの1kmあたり走行秒数。速さの体感を作る。
 * 岡山近郊は駅間 2〜6km が中心なので、この係数で 0.45〜1.0 秒程度に収まる。
 */
export const SEC_PER_KM: Record<string, number> = {
  '115-yellow': 0.16, '213-marine': 0.11, '105-red': 0.16,
  'kiha40-orange': 0.21, 'kiha120-mizurin': 0.21, 'hot7000': 0.11,
  ibara: 0.21, 'momo-tram': 0.6, 'n700-shinkansen': 0.06,
};

/**
 * ミスのコストは走行時間への固定加算にする。
 * 率で掛けると駅間が短い区間で 0.1 秒未満になり、ペナルティとして体感できない。
 */
export const BRAKE_SEC_PER_MISS = 0.3;
export const MAX_BRAKE_SEC = 2.0;

export class RunContext {
  readonly line: Line;
  /** stops のインデックス。次に打つ駅を指す。 */
  stopIndex = 1;
  direction: 1 | -1 = 1;
  laps = 0;
  /** 発駅からの累計営業キロ。折り返しても加算し続ける。 */
  km = 0;
  typing: TypingState;
  stats: RunStats = emptyStats();
  combo = 0;
  maxCombo = 0;
  comboStations = 0;
  missesAtStation = 0;
  reachedCount = 0;

  constructor(line: Line) {
    this.line = line;
    this.typing = createTypingState(this.currentStation().kana);
  }

  /** いま打っている駅。 */
  currentStation() {
    return getStation(this.line.stops[this.stopIndex]!);
  }

  originStation() {
    return getStation(this.line.stops[0]!);
  }

  /** 直前に通過した駅（走行中の出発駅）。 */
  previousStation() {
    const i = this.stopIndex - this.direction;
    const clamped = Math.min(Math.max(i, 0), this.line.stops.length - 1);
    return getStation(this.line.stops[clamped]!);
  }

  /** いま向かっている区間。 */
  currentSegment() {
    const i = this.direction === 1 ? this.stopIndex - 1 : this.stopIndex;
    return this.line.segments[Math.min(Math.max(i, 0), this.line.segments.length - 1)]!;
  }

  get baseFare(): number {
    return calcFareById(this.line.fareRule, this.km);
  }

  get bonus(): number {
    const combo = this.comboStations * COMBO_BONUS_PER_STATION;
    const terminal = Math.round(this.baseFare * TERMINAL_BONUS_RATE * this.laps);
    return combo + terminal;
  }

  get fare(): number {
    return this.baseFare + this.bonus;
  }

  /** 終点（または起点まで戻った）か。 */
  atTerminal(): boolean {
    return this.direction === 1
      ? this.stopIndex >= this.line.stops.length - 1
      : this.stopIndex <= 0;
  }

  /** 区間の基本走行秒数（ミスなしの場合）。 */
  private baseTravelSeconds(): number {
    const perKm = SEC_PER_KM[this.line.vehicle] ?? 0.16;
    return Math.min(Math.max(this.currentSegment().km * perKm, 0.45), 2.4);
  }

  /** 現区間の走行秒数。ミスした分だけ延びる。 */
  travelSeconds(): number {
    return this.baseTravelSeconds() + this.brakePenalty(this.missesAtStation);
  }

  private brakePenalty(misses: number): number {
    return Math.min(misses * BRAKE_SEC_PER_MISS, MAX_BRAKE_SEC);
  }

  /**
   * いま起きたミスで実際に増えた秒数。
   * HUD に「制動 -0.3秒」と数値で出す。見えないペナルティは学習に繋がらない。
   */
  lastBrakeCost(): number {
    return this.brakePenalty(this.missesAtStation) - this.brakePenalty(this.missesAtStation - 1);
  }

  recordMiss(): void {
    this.stats.misses++;
    this.missesAtStation++;
    this.combo = 0;
    const kana = this.typing.nodes[this.typing.nodeIndex]?.kana;
    if (kana !== undefined) {
      this.stats.missByKana[kana] = (this.stats.missByKana[kana] ?? 0) + 1;
    }
  }

  recordHit(): void {
    this.stats.correct++;
  }

  /** 駅を打ち終えた。運賃を加算し、次の駅へ進める。 */
  completeStation(): void {
    this.km += this.currentSegment().km;
    this.reachedCount++;
    if (this.missesAtStation === 0) {
      this.combo++;
      this.comboStations++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
    }
    this.missesAtStation = 0;
  }

  /** 次の駅へ。終点なら折り返す。 */
  advance(): { turnaround: boolean } {
    if (this.atTerminal()) {
      this.direction = this.direction === 1 ? -1 : 1;
      this.laps++;
      this.stopIndex += this.direction;
      this.typing = createTypingState(this.currentStation().kana);
      return { turnaround: true };
    }
    this.stopIndex += this.direction;
    this.typing = createTypingState(this.currentStation().kana);
    return { turnaround: false };
  }
}
