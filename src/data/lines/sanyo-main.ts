import type { Line, SceneKind, StationId } from '../types';

/** 駅列と区間距離から segments を組み立てる小さなヘルパ。 */
function buildSegments(
  stops: readonly StationId[],
  kmFromOrigin: readonly number[],
  scenes: readonly SceneKind[],
) {
  return stops.slice(1).map((to, i) => ({
    from: stops[i]!,
    to,
    km: Number((kmFromOrigin[i + 1]! - kmFromOrigin[i]!).toFixed(1)),
    scene: scenes[i]!,
  }));
}

const STOPS: readonly StationId[] = [
  'okayama', 'kitanagase', 'niwase', 'nakashou', 'kurashiki',
  'nishiachi', 'shinkurashiki', 'konkou', 'kamogata', 'satoshou', 'kasaoka',
];

/** 岡山からの営業キロ。 */
const KM = [0, 2.7, 5.5, 11.0, 15.9, 19.9, 25.0, 30.6, 34.4, 38.0, 43.6];

const SCENES: readonly SceneKind[] = [
  'city', 'city', 'suburb', 'suburb', 'suburb',
  'rural', 'rural', 'rural', 'rural', 'rural',
];

export const SANYO_MAIN_DOWN: Line = {
  id: 'sanyo-main-down',
  nameJp: '山陽本線',
  nameKana: 'さんようほんせん',
  company: 'JR西日本',
  lineColor: '#0072bc',
  vehicle: '115-yellow',
  destination: '笠岡',
  trainType: '普通',
  stops: STOPS,
  segments: buildSegments(STOPS, KM, SCENES),
  fareRule: 'jr-honshu-main',
  scopeNote: '岡山県内区間（岡山→笠岡）',
};
