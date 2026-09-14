import type { Line, LineId } from '../types';
import { SANYO_MAIN_DOWN } from './sanyo-main';

export const LINES: readonly Line[] = [SANYO_MAIN_DOWN];

export const LINE_MAP: ReadonlyMap<LineId, Line> = new Map(
  LINES.map((l) => [l.id, l]),
);

export function getLine(id: LineId): Line {
  const l = LINE_MAP.get(id);
  if (l === undefined) throw new Error(`unknown line: ${id}`);
  return l;
}

export const DEFAULT_LINE_ID = SANYO_MAIN_DOWN.id;
