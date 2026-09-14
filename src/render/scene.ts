import { VIEW_H, VIEW_W } from './canvas';
import { bake, blit } from './bake';
import { LIVERIES, SCENE_COLORS as C } from './palette';
import { EMU_SUBURBAN_HEAD, EMU_SUBURBAN_MID } from './sprites/trains';
import { WHEEL_FRAMES } from './sprites/wheels';
import { BUILDING, CATENARY_POLE, HOUSE, STATION_SIGN, TREE } from './sprites/scenery';
import { drawText, measureText } from './bitmapFont';
import type { SceneKind, VehicleId } from '../data/types';

/** 地面（線路の基準）の y 座標。 */
const GROUND_Y = 132;
const TRAIN_Y = GROUND_Y - 30;
const TRAIN_X = 96;

export interface SceneState {
  /** 走行距離（論理ピクセル）。背景スクロールと車輪回転を駆動する。 */
  distance: number;
  /** 現在の速度（px/秒）。0 なら停車中。 */
  speed: number;
  scene: SceneKind;
  vehicle: VehicleId;
  /** 停車中の駅名（漢字）。null なら走行中。 */
  stoppedAt: string | null;
  /** 進行方向。折り返すと -1 になる。 */
  direction: 1 | -1;
  /** ミス演出の残り時間（秒）。画面シェイクと火花に使う。 */
  shake: number;
  sparks: readonly Spark[];
  /** 経過時間（秒）。揺れの位相に使う。 */
  time: number;
  /** 速度計を出すか。タイトルでは隠す。 */
  showSpeed: boolean;
}

export interface Spark {
  x: number; y: number; vx: number; vy: number; life: number;
}

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

function drawSky(ctx: CanvasRenderingContext2D, scene: SceneKind): void {
  if (scene === 'tunnel') {
    ctx.fillStyle = '#15181f';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    return;
  }
  // 空はバンド塗り（グラデーションだとドット感が壊れる）
  const bands = 6;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    ctx.fillStyle = mixHex(C.skyTop, C.skyBottom, t);
    ctx.fillRect(0, Math.floor((i * GROUND_Y) / bands), VIEW_W, Math.ceil(GROUND_Y / bands) + 1);
  }
}

function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const mixed = pa.map((v, i) => Math.round(v + (pb[i]! - v) * t));
  return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** 遠景の山並み。距離の 0.15 倍でゆっくり流れる。 */
function drawFarHills(ctx: CanvasRenderingContext2D, distance: number): void {
  const off = mod(distance * 0.15, 160);
  ctx.fillStyle = C.farHill;
  for (let base = -160; base < VIEW_W + 160; base += 160) {
    const x0 = base - off;
    for (let x = 0; x < 160; x++) {
      const h = 20 + Math.round(14 * Math.sin(x * 0.06) + 8 * Math.sin(x * 0.021 + 1.7));
      const px = Math.round(x0 + x);
      if (px < 0 || px >= VIEW_W) continue;
      ctx.fillRect(px, GROUND_Y - 34 - h, 1, h + 34);
    }
  }
}

/** 中景。建物・民家・木。0.45 倍速。 */
function drawMidground(ctx: CanvasRenderingContext2D, distance: number, scene: SceneKind): void {
  const period = 96;
  const off = mod(distance * 0.45, period);
  const liv = { A: C.building, O: C.roof, G: '#5d7f96', D: '#7a6552', T: '#5f8c4e', M: C.pole, F: '#fff', K: '#000', S: '#000' };
  for (let base = -period; base < VIEW_W + period; base += period) {
    const x0 = Math.round(base - off);
    if (scene === 'city') {
      blit(ctx, bake('bld', BUILDING, liv), x0 + 6, GROUND_Y - 26 - BUILDING.h);
      blit(ctx, bake('house', HOUSE, liv), x0 + 30, GROUND_Y - 26 - HOUSE.h);
      blit(ctx, bake('bld', BUILDING, liv), x0 + 58, GROUND_Y - 26 - BUILDING.h);
    } else if (scene === 'suburb') {
      blit(ctx, bake('house', HOUSE, liv), x0 + 8, GROUND_Y - 26 - HOUSE.h);
      blit(ctx, bake('tree', TREE, liv), x0 + 34, GROUND_Y - 26 - TREE.h);
      blit(ctx, bake('house', HOUSE, liv), x0 + 52, GROUND_Y - 26 - HOUSE.h);
    } else {
      blit(ctx, bake('tree', TREE, liv), x0 + 12, GROUND_Y - 26 - TREE.h);
      blit(ctx, bake('tree', TREE, liv), x0 + 46, GROUND_Y - 26 - TREE.h);
      blit(ctx, bake('house', HOUSE, liv), x0 + 68, GROUND_Y - 26 - HOUSE.h);
    }
  }
  // 田畑の帯
  ctx.fillStyle = C.field;
  ctx.fillRect(0, GROUND_Y - 26, VIEW_W, 26);
  ctx.fillStyle = C.fieldAlt;
  const fOff = mod(distance * 0.7, 12);
  for (let x = -12; x < VIEW_W + 12; x += 12) {
    ctx.fillRect(Math.round(x - fOff), GROUND_Y - 16, 6, 4);
  }
}

/** 線路。枕木は16px周期でスクロールする。 */
function drawTrack(ctx: CanvasRenderingContext2D, distance: number): void {
  ctx.fillStyle = C.ballast;
  ctx.fillRect(0, GROUND_Y - 4, VIEW_W, VIEW_H - GROUND_Y + 4);
  const off = mod(distance, 16);
  ctx.fillStyle = C.sleeper;
  for (let x = -16; x < VIEW_W + 16; x += 16) {
    ctx.fillRect(Math.round(x - off), GROUND_Y, 10, 3);
  }
  ctx.fillStyle = C.rail;
  ctx.fillRect(0, GROUND_Y - 2, VIEW_W, 2);
  ctx.fillStyle = C.railShine;
  ctx.fillRect(0, GROUND_Y - 2, VIEW_W, 1);
}

/** 近景の架線柱。等速で流れるので速度がいちばん体感できる。 */
function drawPoles(ctx: CanvasRenderingContext2D, distance: number): void {
  const period = 48;
  const off = mod(distance, period);
  const liv = { M: C.pole };
  for (let base = -period; base < VIEW_W + period; base += period) {
    blit(ctx, bake('pole', CATENARY_POLE, liv), base - off, GROUND_Y - CATENARY_POLE.h);
  }
}

/** ホームと駅名標。停車中だけ画面中央に置く。 */
function drawPlatform(ctx: CanvasRenderingContext2D, kanji: string | null): void {
  const y = GROUND_Y - 12;
  ctx.fillStyle = C.platformSide;
  ctx.fillRect(0, y, VIEW_W, 12);
  ctx.fillStyle = C.platform;
  ctx.fillRect(0, y, VIEW_W, 3);
  ctx.fillStyle = C.platformEdge;
  ctx.fillRect(0, y + 3, VIEW_W, 1);
  if (kanji === null) return;
  const liv = { F: C.signFace, K: C.signPost, S: C.signBand, M: C.signPost };
  blit(ctx, bake('sign', STATION_SIGN, liv), 232, y - STATION_SIGN.h + 2);
}

/** 編成。先頭車は右向き（進行方向）。 */
function drawTrain(ctx: CanvasRenderingContext2D, s: SceneState): void {
  const liv = LIVERIES[s.vehicle];
  const head = bake(`head:${s.vehicle}`, EMU_SUBURBAN_HEAD, liv);
  const mid = bake(`mid:${s.vehicle}`, EMU_SUBURBAN_MID, liv);
  // 走行中だけ上下に1px微振動させる
  const bob = s.speed > 0 ? Math.round(Math.sin(s.time * 14) * 0.6) : 0;
  const y = TRAIN_Y + bob;
  const flip = s.direction === -1;

  const cars: Array<[HTMLCanvasElement, number]> = flip
    ? [[head, TRAIN_X], [mid, TRAIN_X + EMU_SUBURBAN_HEAD.w + 1]]
    : [[mid, TRAIN_X], [head, TRAIN_X + EMU_SUBURBAN_MID.w + 1]];

  for (const [sprite, x] of cars) blit(ctx, sprite, x, y, flip && sprite === head);

  // 車輪。走行距離から回転フレームを選ぶので、減速すると回転も遅くなる。
  const circumference = Math.PI * 8;
  const frame = Math.floor(mod(s.distance / circumference, 1) * WHEEL_FRAMES.length);
  const wheel = bake(`wheel:${frame}`, WHEEL_FRAMES[frame]!, { K: '#1a1d24', U: '#4a5058', P: '#8a919b' });
  const wheelY = y + 17;
  for (const carX of [TRAIN_X, TRAIN_X + EMU_SUBURBAN_MID.w + 1]) {
    for (const dx of [6, 16, 26, 36]) blit(ctx, wheel, carX + dx, wheelY);
  }
}

function drawSparks(ctx: CanvasRenderingContext2D, sparks: readonly Spark[]): void {
  ctx.fillStyle = '#ffe066';
  for (const s of sparks) {
    if (s.life <= 0) continue;
    ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
  }
}

/** 速度計。走行中に画面隅へ出す（Canvas 内の数字はビットマップフォント）。 */
function drawSpeedo(ctx: CanvasRenderingContext2D, speed: number): void {
  const kmh = Math.round(speed * 0.9);
  const label = `${kmh} KM/H`;
  const w = measureText(label) + 6;
  ctx.fillStyle = 'rgba(10,12,16,0.62)';
  ctx.fillRect(VIEW_W - w - 4, 4, w, 13);
  drawText(ctx, label, VIEW_W - w - 1, 7, '#9fe8a0');
}

export function renderScene(ctx: CanvasRenderingContext2D, s: SceneState): void {
  ctx.save();
  if (s.shake > 0) ctx.translate(Math.round(Math.sin(s.shake * 90) * 1.5), 0);

  drawSky(ctx, s.scene);
  drawFarHills(ctx, s.distance);
  drawMidground(ctx, s.distance, s.scene);
  drawPoles(ctx, s.distance);
  drawTrack(ctx, s.distance);
  drawPlatform(ctx, s.stoppedAt);
  drawTrain(ctx, s);
  drawSparks(ctx, s.sparks);
  if (s.speed > 0 && s.stoppedAt === null && s.showSpeed) drawSpeedo(ctx, s.speed);

  ctx.restore();
}
