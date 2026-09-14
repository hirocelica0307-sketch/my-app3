import { useLayoutEffect, useRef } from 'react';
import type { Snapshot } from '../../engine/game/engine';

interface Props {
  snap: Snapshot;
}

/**
 * 駅名の3段表示。
 * 漢字は熟字訓（美袋=みなぎ）があってかなと対応が取れないので進捗着色しない。
 * ふりがなはノード単位、ローマ字は打鍵単位で着色する。
 */
export function StationNameDisplay({ snap }: Props) {
  const romajiRef = useRef<HTMLDivElement>(null);

  // 長い駅名（早雲の里荏原 / 東山・おかでんミュージアム）でも1行に収める。
  // 改行するとカーソル追従が破綻するので、縮小で逃がす。
  useLayoutEffect(() => {
    const el = romajiRef.current;
    if (el === null) return;
    el.style.removeProperty('transform');
    const parent = el.parentElement;
    if (parent === null) return;
    const avail = parent.clientWidth - 8;
    if (el.scrollWidth > avail && el.scrollWidth > 0) {
      el.style.transform = `scaleX(${Math.max(0.55, avail / el.scrollWidth)})`;
      el.style.transformOrigin = 'center';
    }
  }, [snap.stationKanji, snap.romaji.committed, snap.romaji.active]);

  const kana = snap.stationKana;
  const { done, active } = snap.furigana;

  return (
    <div className={`station${snap.missFlash ? ' flash' : ''}`}>
      <div className="station-kanji">{snap.stationKanji}</div>
      <div className="station-kana">
        <span className="k-done">{kana.slice(0, done)}</span>
        <span className="k-active">{kana.slice(done, done + active)}</span>
        <span>{kana.slice(done + active)}</span>
      </div>
      {snap.showRomaji && (
        <div className="station-romaji" ref={romajiRef}>
          <span className="r-done">{snap.romaji.committed}{snap.romaji.active}</span>
          <span className="caret">&nbsp;</span>
          <span className="r-rest">{snap.romaji.rest}</span>
          <span className="r-next">{snap.romaji.upcoming}</span>
        </div>
      )}
    </div>
  );
}
