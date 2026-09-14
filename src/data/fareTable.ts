export interface FareBand { readonly maxKm: number; readonly yen: number }

export interface FareRule {
  readonly id: string;
  readonly label: string;
  readonly bands: readonly FareBand[];
  /** 地方交通線の擬制キロ係数。 */
  readonly localSurchargeRate?: number;
  /** 折り返しでキロが伸びすぎたときの頭打ち。 */
  readonly maxKm?: number;
}

/**
 * 本州幹線の段階運賃に近づけた簡易テーブル。
 * 擬制キロ・特定区間運賃までは再現しない（README とリザルトに免責を表示する）。
 */
const JR_HONSHU_MAIN: FareRule = {
  id: 'jr-honshu-main',
  label: 'JR西日本 幹線',
  maxKm: 300,
  bands: [
    { maxKm: 3, yen: 150 }, { maxKm: 6, yen: 190 }, { maxKm: 10, yen: 200 },
    { maxKm: 15, yen: 240 }, { maxKm: 20, yen: 330 }, { maxKm: 25, yen: 420 },
    { maxKm: 30, yen: 510 }, { maxKm: 35, yen: 590 }, { maxKm: 40, yen: 680 },
    { maxKm: 45, yen: 770 }, { maxKm: 50, yen: 860 }, { maxKm: 60, yen: 990 },
    { maxKm: 70, yen: 1170 }, { maxKm: 80, yen: 1340 }, { maxKm: 90, yen: 1520 },
    { maxKm: 100, yen: 1690 }, { maxKm: 120, yen: 1980 }, { maxKm: 140, yen: 2310 },
    { maxKm: 160, yen: 2640 }, { maxKm: 180, yen: 2970 }, { maxKm: 200, yen: 3300 },
  ],
};

export const FARE_RULES: ReadonlyMap<string, FareRule> = new Map([
  [JR_HONSHU_MAIN.id, JR_HONSHU_MAIN],
]);

export function getFareRule(id: string): FareRule {
  const r = FARE_RULES.get(id);
  if (r === undefined) throw new Error(`unknown fare rule: ${id}`);
  return r;
}
