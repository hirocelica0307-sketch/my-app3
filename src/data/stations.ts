import type { Station, StationId } from './types';

/**
 * 全路線が共有する駅レジストリ。
 * 同じ駅は必ず1つの id だけを持つ（岡山駅は7路線から参照される）。
 */
const LIST: readonly Station[] = [
  // --- 山陽本線 下り（岡山 → 笠岡） ---
  { id: 'okayama', kanji: '岡山', kana: 'おかやま', pref: '岡山', sprite: 'terminal', verified: true,
    note: '岡山県の玄関口。新幹線と在来線8方向が集まる。' },
  { id: 'kitanagase', kanji: '北長瀬', kana: 'きたながせ', pref: '岡山', sprite: 'urban', verified: true },
  { id: 'niwase', kanji: '庭瀬', kana: 'にわせ', pref: '岡山', sprite: 'urban', verified: true },
  { id: 'nakashou', kanji: '中庄', kana: 'なかしょう', pref: '岡山', sprite: 'urban', verified: true },
  { id: 'kurashiki', kanji: '倉敷', kana: 'くらしき', pref: '岡山', sprite: 'terminal', verified: true,
    note: '美観地区の玄関口。伯備線が分岐する。' },
  { id: 'nishiachi', kanji: '西阿知', kana: 'にしあち', pref: '岡山', rare: true, sprite: 'rural', verified: true },
  { id: 'shinkurashiki', kanji: '新倉敷', kana: 'しんくらしき', pref: '岡山', sprite: 'shinkansen', verified: true,
    note: '山陽新幹線が停まる。旧・玉島駅。' },
  { id: 'konkou', kanji: '金光', kana: 'こんこう', pref: '岡山', rare: true, sprite: 'rural', verified: true,
    note: '金光教の本部最寄り。「かねみつ」ではない。' },
  { id: 'kamogata', kanji: '鴨方', kana: 'かもがた', pref: '岡山', sprite: 'rural', verified: true },
  { id: 'satoshou', kanji: '里庄', kana: 'さとしょう', pref: '岡山', sprite: 'rural', verified: true },
  { id: 'kasaoka', kanji: '笠岡', kana: 'かさおか', pref: '岡山', sprite: 'terminal', verified: true,
    note: 'カブトガニ繁殖地で知られる。ここから先は広島県。' },
];

export const STATIONS: ReadonlyMap<StationId, Station> = new Map(
  LIST.map((s) => [s.id, s]),
);

export const ALL_STATIONS: readonly Station[] = LIST;

export function getStation(id: StationId): Station {
  const s = STATIONS.get(id);
  if (s === undefined) throw new Error(`unknown station: ${id}`);
  return s;
}
