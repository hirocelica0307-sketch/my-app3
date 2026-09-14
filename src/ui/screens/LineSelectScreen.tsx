import { Furigana } from '../components/Furigana';
import { getStation } from '../../data/stations';
import type { Line } from '../../data/types';

interface Props {
  lines: readonly Line[];
  index: number;
  bestOf: (lineId: string) => number | null;
}

/** 難易度を★と、ひらがなの言葉の両方で見せる。 */
function difficultyOf(line: Line): { stars: string; word: string } {
  const d = line.difficultyOverride ?? 40;
  if (d < 20) return { stars: '★☆☆☆☆', word: 'やさしい' };
  if (d < 32) return { stars: '★★☆☆☆', word: 'すこしやさしい' };
  if (d < 50) return { stars: '★★★☆☆', word: 'ふつう' };
  if (d < 76) return { stars: '★★★★☆', word: 'むずかしい' };
  return { stars: '★★★★★', word: 'とてもむずかしい' };
}

/**
 * 路線選択。
 * 背景の Canvas に岡山県の路線図が描かれ、選んだ路線が光る。
 * 日本語は Canvas に描けないので、こちら（DOM）で地図の上に重ねる。
 */
export function LineSelectScreen({ lines, index, bestOf }: Props) {
  const current = lines[index]!;
  const d = difficultyOf(current);
  const origin = getStation(current.stops[0]!);
  const dest = getStation(current.stops[current.stops.length - 1]!);
  const best = bestOf(current.id);

  return (
    <div className="mapselect">
      <div className="mapselect-head">
        <Furigana kana="ろせん">路線</Furigana>を えらんでください
      </div>

      {/* 選択中の路線名だけを大きく。前後の名前まで出すと地図に重なって読めない */}
      <div className="mapselect-now">
        <span className="ms-prev">{lines[(index - 1 + lines.length) % lines.length]!.nameJp}</span>
        <span className="ms-cur">
          <Furigana kana={current.nameKana}>{current.nameJp}</Furigana>
        </span>
        <span className="ms-next">{lines[(index + 1) % lines.length]!.nameJp}</span>
      </div>

      <div className="mapselect-card" style={{ ['--line-color' as string]: current.lineColor }}>
        <div className="ms-title">
          <span className="ms-type">{current.trainType}</span>
          <Furigana kana={current.nameKana}>{current.nameJp}</Furigana>
          {current.nickname !== undefined && <span className="ms-nick">（{current.nickname}）</span>}
        </div>
        <div className="ms-route">
          <Furigana kana={origin.kana}>{origin.kanji}</Furigana>
          <span className="ms-arrow">▸▸</span>
          <Furigana kana={dest.kana}>{dest.kanji}</Furigana>
        </div>
        <div className="ms-facts">
          <span className="ms-stars">{d.stars}</span>
          <span className="ms-word">{d.word}</span>
          <span>{current.stops.length}えき</span>
          <span className="ms-best">{best === null ? 'きろくなし' : `¥${best.toLocaleString('ja-JP')}`}</span>
        </div>
      </div>

      <div className="mapselect-hint">↑↓ で えらんで Enter　[Esc] もどる</div>
    </div>
  );
}
