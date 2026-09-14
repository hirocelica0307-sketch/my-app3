/** 論理解像度。すべての描画座標はこの中の整数で考える。 */
export const VIEW_W = 320;
export const VIEW_H = 180;

export interface Stage {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** 現在の整数倍スケール。 */
  scale: number;
}

/**
 * 320x180 の論理解像度を持つ Canvas を用意する。
 * CSS で**整数倍**に拡大し、image-rendering: pixelated を効かせることで
 * ぼやけない本物のドット絵になる。
 */
export function createStage(canvas: HTMLCanvasElement): Stage {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (ctx === null) throw new Error('2d context unavailable');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx, scale: 1 };
}

/** 親要素に収まる最大の整数倍スケールを求める。 */
export function fitScale(containerW: number, containerH: number): number {
  const raw = Math.min(containerW / VIEW_W, containerH / VIEW_H);
  return Math.max(1, Math.floor(raw));
}
