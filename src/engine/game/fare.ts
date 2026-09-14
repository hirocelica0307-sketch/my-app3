import { getFareRule, type FareRule } from '../../data/fareTable';

/**
 * 発駅からの累計営業キロに対する通し運賃。
 * 区間ごとの加算ではないので、帯をまたぐ瞬間だけ運賃が跳ね上がる。
 */
export function calcFare(rule: FareRule, km: number): number {
  if (km <= 0) return 0;
  const capped = rule.maxKm === undefined ? km : Math.min(km, rule.maxKm);
  const effective = capped * (rule.localSurchargeRate ?? 1);
  for (const band of rule.bands) {
    if (effective <= band.maxKm) return band.yen;
  }
  // 帯を超えた分（折り返しで長距離化した場合）は線形に伸ばす
  const last = rule.bands[rule.bands.length - 1]!;
  return last.yen + Math.ceil((effective - last.maxKm) / 10) * 200;
}

export function calcFareById(ruleId: string, km: number): number {
  return calcFare(getFareRule(ruleId), km);
}
