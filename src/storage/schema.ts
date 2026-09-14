export type TimeLimit = 60 | 120 | 180;
export type ScoreKey = string; // `${lineId}:${timeLimit}`

export interface ScoreEntry {
  fare: number;
  baseFare: number;
  bonus: number;
  reachedKanji: string;
  reachedCount: number;
  km: number;
  keystrokes: number;
  correct: number;
  misses: number;
  accuracy: number;
  kpm: number;
  maxCombo: number;
  laps: number;
  playedAt: number;
}

export interface Settings {
  showRomaji: boolean;
  defaultTimeLimit: TimeLimit;
  retroEffects: boolean;
}

export interface GlobalStats {
  totalRuns: number;
  totalKeystrokes: number;
  totalMisses: number;
  totalSeconds: number;
  missByKana: Record<string, number>;
}

export interface SaveDataV1 {
  version: 1;
  playCount: number;
  highScores: Record<ScoreKey, ScoreEntry[]>;
  settings: Settings;
  stats: GlobalStats;
}

export const DEFAULT_SAVE: SaveDataV1 = {
  version: 1,
  playCount: 0,
  highScores: {},
  settings: { showRomaji: true, defaultTimeLimit: 60, retroEffects: true },
  stats: { totalRuns: 0, totalKeystrokes: 0, totalMisses: 0, totalSeconds: 0, missByKana: {} },
};

export const TOP_N = 5;
export const MAX_MISS_KANA_ENTRIES = 200;
