import { assertShape, type ShapeDef } from './types';

/**
 * 風景パーツ。
 * M=金属（架線柱・支柱） A=壁 O=屋根 G=窓 D=ドア/幹 T=葉 F=看板面 K=枠 S=帯
 */
/** 架線柱。近景を1.0倍速で流す。 */
export const CATENARY_POLE: ShapeDef = assertShape('CATENARY_POLE', {
  w: 7,
  h: 26,
  rows: [
    "M.M.M.M",
    ".MMMMM.",
    ".M.M.M.",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
    "...M...",
  ],
});

/** 中景の民家。 */
export const HOUSE: ShapeDef = assertShape('HOUSE', {
  w: 18,
  h: 16,
  rows: [
    ".....OOOOOOOO.....",
    "....OOOOOOOOOO....",
    "...OOOOOOOOOOOO...",
    "..OOOOOOOOOOOOOO..",
    ".OOOOOOOOOOOOOOOO.",
    ".AAAAAAAAAAAAAAAA.",
    ".AAAAAAAAAAAAAAAA.",
    ".AAGGAAAGGAAAGGAA.",
    ".AAGGAAAGGAAAGGAA.",
    ".AAGGAAAGGAAAGGAA.",
    ".AAAAAAAAAAAAAAAA.",
    ".AAAAAADDDAAAAAAA.",
    ".AAAAAADDDAAAAAAA.",
    ".AAAAAADDDAAAAAAA.",
    ".AAAAAADDDAAAAAAA.",
    ".AAAAAADDDAAAAAAA.",
  ],
});

/** 中景のビル。city シーンで使う。 */
export const BUILDING: ShapeDef = assertShape('BUILDING', {
  w: 14,
  h: 30,
  rows: [
    "OOOOOOOOOOOOOO",
    "AAAAAAAAAAAAAA",
    "AAGGAGGAGGAGGA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAGGAGGAGGAGGA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAGGAGGAGGAGGA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAGGAGGAGGAGGA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAGGAGGAGGAGGA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAGGAGGAGGAGGA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAGGAGGAGGAGGA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAA",
  ],
});

/** 中景の木。 */
export const TREE: ShapeDef = assertShape('TREE', {
  w: 11,
  h: 14,
  rows: [
    "...TTTTT...",
    "..TTTTTTT..",
    "..TTTTTTT..",
    "..TTTTTTT..",
    ".TTTTTTTTT.",
    ".TTTTTTTTT.",
    ".TTTTTTTTT.",
    "..TTTTTTT..",
    "..TTTTTTT..",
    "..TTDDTTT..",
    "....DD.....",
    "....DD.....",
    "....DD.....",
    "....DD.....",
  ],
});

/** 駅名標。停車時にホーム上に立てる。 */
export const STATION_SIGN: ShapeDef = assertShape('STATION_SIGN', {
  w: 22,
  h: 14,
  rows: [
    "KKKKKKKKKKKKKKKKKKKKKK",
    "KFFFFFFFFFFFFFFFFFFFFK",
    "KFFFFFFFFFFFFFFFFFFFFK",
    "KFFFFFFFFFFFFFFFFFFFFK",
    "KFFFFFFFFFFFFFFFFFFFFK",
    "KFFFFFFFFFFFFFFFFFFFFK",
    "KFFFFFFFFFFFFFFFFFFFFK",
    "KFFFFFFFFFFFFFFFFFFFFK",
    "KSSSSSSSSSSSSSSSSSSSSK",
    "KKKKKKKKKKKKKKKKKKKKKK",
    "..........MM..........",
    "..........MM..........",
    "..........MM..........",
    "..........MM..........",
  ],
});
