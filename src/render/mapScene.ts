import { VIEW_H, VIEW_W } from './canvas';
import { bake } from './bake';
import { LIVERIES } from './palette';
import { EMU_SUBURBAN_HEAD } from './sprites/trains';
import { drawText, measureText } from './bitmapFont';
import { ISLANDS, MAP_LINES, MAP_LINE_MAP, OKAYAMA, PREF_OUTLINE, type MapLine } from '../data/mapLayout';
import { getLine } from '../data/lines';

/**
 * 路線選択の地図。Canvas に描く。
 *
 * 日本語は DOM 側（LineSelectScreen）に任せ、ここでは
 * 県の輪郭・路線・駅の点・車両のドット絵だけを描く。
 * 路線名のローマ字はビットマップフォントで添える。
 */

const SEA = '#20506e';
const SEA_DEEP = '#18405a';
const LAND = '#33412f';
const LAND_EDGE = '#6f8a63';

function polyline(ctx: CanvasRenderingContext2D, pts: readonly { x: number; y: number }[], width: number): void {
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x + 0.5, p.y + 0.5);
    else ctx.lineTo(p.x + 0.5, p.y + 0.5);
  });
  ctx.stroke();
}

function drawBase(ctx: CanvasRenderingContext2D, time: number): void {
  void time; // 海は renderMap 側で画面全体に塗ってある
  // 陸地
  ctx.fillStyle = LAND;
  ctx.beginPath();
  PREF_OUTLINE.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = LAND_EDGE;
  ctx.lineWidth = 1;
  ctx.stroke();
  // 内陸の山あい（北ほど濃く）。のっぺりした塊に見せない
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(30,48,34,0.55)';
  for (let i = 0; i < 26; i++) {
    const x = 30 + (i * 53) % 260;
    const y = 24 + (i * 29) % 46;
    ctx.beginPath();
    ctx.ellipse(x, y, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // 島
  ctx.fillStyle = LAND;
  for (const is of ISLANDS) {
    ctx.beginPath();
    ctx.ellipse(is.x, is.y, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 岡山駅の印。地図の中心。 */
function drawOkayamaMark(ctx: CanvasRenderingContext2D, pulse: number): void {
  const r = 4 + Math.round(Math.sin(pulse * 2.4) * 0.5 + 0.5);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(OKAYAMA.x + 0.5, OKAYAMA.y + 0.5, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(OKAYAMA.x - 1, OKAYAMA.y - 1, 3, 3);
  drawText(ctx, 'OKAYAMA', OKAYAMA.x - measureText('OKAYAMA') / 2, OKAYAMA.y + 7, '#ffffff');
}

export interface MapSceneState {
  /**
   * 選択中の路線 id。
   * index で渡すと地図と路線一覧の並びを二重管理することになり、
   * 片方だけ並べ替えたときに別の路線が選ばれてしまう。
   */
  selectedId: string;
  time: number;
}

/**
 * 地図は画面の左 62% に収める。
 * 右側は路線の一覧（DOM）に空けておく。15路線を ↑↓ で送るだけだと
 * 今どのあたりを見ているのか分からず、選びにくかった。
 */
const MAP_W = 0.62;

export function renderMap(ctx: CanvasRenderingContext2D, s: MapSceneState): void {
  // 先に画面全体を海で塗る。
  // 縮小した地図だけを描くと、その外側に黒い縁が出て窓のように見える。
  for (let y = 0; y < VIEW_H; y++) {
    ctx.fillStyle = y > 108 ? SEA_DEEP : SEA;
    ctx.fillRect(0, y, VIEW_W, 1);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  for (let row = 0; row < 6; row++) {
    const y = 108 + row * 12;
    const off = (s.time * (6 + row * 3)) % 46;
    for (let x = -46; x < VIEW_W + 46; x += 46) ctx.fillRect(Math.round(x + off), y, 7, 1);
  }
  ctx.save();
  ctx.scale(MAP_W, MAP_W);
  ctx.translate(6, VIEW_H * (1 - MAP_W) * 0.5 / MAP_W);
  drawBase(ctx, s.time);

  const selectedLine = MAP_LINE_MAP.get(s.selectedId);

  // 選択していない路線を先に、細く暗く
  for (const ml of MAP_LINES) {
    if (ml === selectedLine) continue;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    polyline(ctx, ml.path, 1);
  }
  // 駅の点
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (const ml of MAP_LINES) {
    if (ml === selectedLine) continue;
    for (const p of ml.path) ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
  }

  // 選択中の路線を太く、路線カラーで
  if (selectedLine !== undefined) {
    const line = getLine(selectedLine.id);
    ctx.strokeStyle = '#000000';
    polyline(ctx, selectedLine.path, 4);
    ctx.strokeStyle = line.lineColor;
    polyline(ctx, selectedLine.path, 2);
    ctx.fillStyle = '#ffffff';
    for (const p of selectedLine.path) ctx.fillRect(p.x - 1, p.y - 1, 3, 3);

    // 終点に車両を置く
    drawTrainOnMap(ctx, selectedLine, line.vehicle, s.time);

    // ローマ字の路線名（日本語は DOM 側）
    const label = selectedLine.id.toUpperCase().replace(/-/g, ' ');
    const w = measureText(label);
    const lx = selectedLine.align === 'right' ? selectedLine.label.x
      : selectedLine.align === 'left' ? selectedLine.label.x - w
      : selectedLine.label.x - w / 2;
    const bx = Math.max(1, Math.min(VIEW_W - w - 5, lx - 2));
    ctx.fillStyle = 'rgba(8,10,14,0.8)';
    ctx.fillRect(bx, selectedLine.label.y - 2, w + 4, 11);
    drawText(ctx, label, bx + 2, selectedLine.label.y, line.lineColor);
  }

  drawOkayamaMark(ctx, s.time);
  ctx.restore();
}

/** 選択中の路線の終点側に、その路線の車両を小さく置く。 */
function drawTrainOnMap(
  ctx: CanvasRenderingContext2D,
  ml: MapLine,
  vehicle: keyof typeof LIVERIES,
  time: number,
): void {
  // 路線の上を行ったり来たりさせる
  const t = (Math.sin(time * 0.8) + 1) / 2;
  const pos = pointAlong(ml.path, t);
  const sprite = bake(`map:${vehicle}`, EMU_SUBURBAN_HEAD, LIVERIES[vehicle]);
  const w = Math.round(EMU_SUBURBAN_HEAD.w / 2);
  const h = Math.round(EMU_SUBURBAN_HEAD.h / 2);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite, Math.round(pos.x - w / 2), Math.round(pos.y - h - 3), w, h);
  ctx.restore();
}

/** 折れ線上を 0..1 で進んだ位置。 */
function pointAlong(path: readonly { x: number; y: number }[], t: number): { x: number; y: number } {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0]!;
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i]!.x - path[i - 1]!.x, path[i]!.y - path[i - 1]!.y);
    lens.push(d);
    total += d;
  }
  let want = t * total;
  for (let i = 0; i < lens.length; i++) {
    if (want <= lens[i]!) {
      const k = lens[i]! === 0 ? 0 : want / lens[i]!;
      return {
        x: path[i]!.x + (path[i + 1]!.x - path[i]!.x) * k,
        y: path[i]!.y + (path[i + 1]!.y - path[i]!.y) * k,
      };
    }
    want -= lens[i]!;
  }
  return path[path.length - 1]!;
}
