import type { Station, StationId } from './types';

/**
 * 全路線が共有する駅レジストリ。
 * 同じ駅は必ず1つの id だけを持つ。
 *
 * `landmarks` は「その駅ならでは」と確認できたものだけを入れる。
 * 確証が無い駅は空のままにする（推測で埋めると、遊ぶ人に嘘を教えることになる）。
 */
const LIST: readonly Station[] = [
  // ===== 山陽本線 岡山県内（東端 三石 → 西端 笠岡）=====
  { id: 'mitsuishi', kanji: '三石', kana: 'みついし', pref: '岡山', sprite: 'rural', verified: true,
    landmarks: [{ sprite: 'brickkiln', label: '耐火煉瓦' }],
    note: 'ろう石の産地。耐火煉瓦のまち。県境の駅。' },
  { id: 'yoshinaga', kanji: '吉永', kana: 'よしなが', pref: '岡山', sprite: 'rural', verified: true,
    landmarks: [{ sprite: 'thatched', label: '八塔寺ふるさと村' }] },
  { id: 'wake', kanji: '和気', kana: 'わけ', pref: '岡山', sprite: 'rural', verified: true,
    landmarks: [{ sprite: 'torii', label: '和気神社' }, { sprite: 'wisteria', label: '藤' }],
    note: '和気清麻呂ゆかりの地。和気神社の藤で知られる。' },
  { id: 'kumayama', kanji: '熊山', kana: 'くまやま', pref: '岡山', sprite: 'rural', verified: true,
    landmarks: [{ sprite: 'ruins', label: '熊山遺跡' }] },
  { id: 'mantomi', kanji: '万富', kana: 'まんとみ', pref: '岡山', rare: true, sprite: 'rural', verified: true,
    landmarks: [{ sprite: 'brewery', label: 'ビール工場' }] },
  { id: 'seto', kanji: '瀬戸', kana: 'せと', pref: '岡山', sprite: 'rural', verified: true },
  { id: 'jouto', kanji: '上道', kana: 'じょうとう', pref: '岡山', rare: true, sprite: 'rural', verified: true,
    note: '「かみみち」ではなく「じょうとう」と読む。' },
  { id: 'higashi-okayama', kanji: '東岡山', kana: 'ひがしおかやま', pref: '岡山', sprite: 'urban', verified: true,
    landmarks: [{ sprite: 'junction', label: '赤穂線分岐' }],
    note: 'ここで赤穂線が分かれる。' },
  { id: 'takashima', kanji: '高島', kana: 'たかしま', pref: '岡山', sprite: 'urban', verified: true },
  { id: 'nishigawara', kanji: '西川原', kana: 'にしがわら', pref: '岡山', rare: true, sprite: 'urban', verified: true,
    landmarks: [{ sprite: 'campus', label: '就実大学' }],
    note: '副名称は「西川原・就実」。' },
  { id: 'okayama', kanji: '岡山', kana: 'おかやま', pref: '岡山', sprite: 'terminal', verified: true,
    landmarks: [{ sprite: 'castle', label: '岡山城' }, { sprite: 'peach', label: '桃・きびだんご' }],
    note: '岡山県の玄関口。新幹線と在来線8方向が集まる。' },
  { id: 'kitanagase', kanji: '北長瀬', kana: 'きたながせ', pref: '岡山', sprite: 'urban', verified: true,
    landmarks: [{ sprite: 'dome', label: '岡山ドーム' }] },
  { id: 'niwase', kanji: '庭瀬', kana: 'にわせ', pref: '岡山', sprite: 'urban', verified: true,
    landmarks: [{ sprite: 'gate', label: '庭瀬往来' }] },
  { id: 'nakashou', kanji: '中庄', kana: 'なかしょう', pref: '岡山', sprite: 'urban', verified: true,
    landmarks: [{ sprite: 'campus', label: '川崎医科大学' }] },
  { id: 'kurashiki', kanji: '倉敷', kana: 'くらしき', pref: '岡山', sprite: 'terminal', verified: true,
    landmarks: [{ sprite: 'kura', label: '美観地区' }, { sprite: 'denim', label: 'デニム' }],
    note: '白壁の美観地区の玄関口。伯備線が分岐する。' },
  { id: 'nishiachi', kanji: '西阿知', kana: 'にしあち', pref: '岡山', rare: true, sprite: 'rural', verified: true },
  { id: 'shinkurashiki', kanji: '新倉敷', kana: 'しんくらしき', pref: '岡山', sprite: 'shinkansen', verified: true,
    landmarks: [{ sprite: 'shinkansen', label: '山陽新幹線' }],
    note: '山陽新幹線が停まる。旧・玉島駅。' },
  { id: 'konkou', kanji: '金光', kana: 'こんこう', pref: '岡山', rare: true, sprite: 'rural', verified: true,
    landmarks: [{ sprite: 'shrinehall', label: '金光教本部' }],
    note: '「かねみつ」ではなく「こんこう」と読む。' },
  { id: 'kamogata', kanji: '鴨方', kana: 'かもがた', pref: '岡山', sprite: 'rural', verified: true,
    landmarks: [{ sprite: 'somen', label: '手延べそうめん' }] },
  { id: 'satoshou', kanji: '里庄', kana: 'さとしょう', pref: '岡山', sprite: 'rural', verified: true,
    landmarks: [{ sprite: 'atom', label: '仁科芳雄博士生誕地' }] },
  { id: 'kasaoka', kanji: '笠岡', kana: 'かさおか', pref: '岡山', sprite: 'terminal', verified: true,
    landmarks: [{ sprite: 'horseshoecrab', label: 'カブトガニ' }, { sprite: 'ramen', label: '笠岡ラーメン' }],
    note: 'カブトガニ繁殖地。ここから先は広島県。' },
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
