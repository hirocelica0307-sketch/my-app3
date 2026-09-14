import type { Line, LineId } from '../types';
import { KIBI_LINE } from './kibi';
import { UNO_LINE } from './uno';
import { SANYO_MAIN_DOWN } from './sanyo-main';
import { SETO_OHASHI_LINE } from './seto-ohashi';
import { TSUYAMA_LINE } from './tsuyama';
import { HAKUBI_LINE } from './hakubi';

/** やさしい順に並べる。路線選択画面はこの順で出る。 */
export const LINES: readonly Line[] = [
  KIBI_LINE,
  UNO_LINE,
  SANYO_MAIN_DOWN,
  SETO_OHASHI_LINE,
  TSUYAMA_LINE,
  HAKUBI_LINE,
];

export const LINE_MAP: ReadonlyMap<LineId, Line> = new Map(LINES.map((l) => [l.id, l]));

export function getLine(id: LineId): Line {
  const l = LINE_MAP.get(id);
  if (l === undefined) throw new Error(`unknown line: ${id}`);
  return l;
}

export const DEFAULT_LINE_ID = KIBI_LINE.id;
