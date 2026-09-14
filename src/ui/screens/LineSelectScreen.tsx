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
  if (d < 45) return { stars: '★★★☆☆', word: 'ふつう' };
  if (d < 65) return { stars: '★★★★☆', word: 'むずかしい' };
  return { stars: '★★★★★', word: 'とてもむずかしい' };
}

/** 岡山駅の発車標に見立てた路線選択。すべてふりがな付き。 */
export function LineSelectScreen({ lines, index, bestOf }: Props) {
  const current = lines[index]!;
  const dest = getStation(current.stops[current.stops.length - 1]!);
  const origin = getStation(current.stops[0]!);

  return (
    <div className="overlay">
      <div className="panel board-panel">
        <div className="board-head">
          <Furigana kana="ろせん">路線</Furigana>を えらんでください
        </div>

        <ul className="board">
          {lines.map((line, i) => {
            const d = difficultyOf(line);
            const to = getStation(line.stops[line.stops.length - 1]!);
            const best = bestOf(line.id);
            return (
              <li key={line.id} className={`board-row${i === index ? ' selected' : ''}`}>
                <span className="board-cursor">{i === index ? '▸' : ''}</span>
                <span className="board-type">{line.trainType}</span>
                <span className="board-name">
                  <Furigana kana={line.nameKana}>{line.nameJp}</Furigana>
                </span>
                <span className="board-dest">
                  <Furigana kana={to.kana}>{to.kanji}</Furigana>
                </span>
                <span className="board-stars">{d.stars}</span>
                <span className="board-best">
                  {best === null ? '—' : `¥${best.toLocaleString('ja-JP')}`}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="board-detail">
          <span className="board-detail-word">{difficultyOf(current).word}</span>
          <span>
            <Furigana kana={origin.kana}>{origin.kanji}</Furigana>
            {' 〜 '}
            <Furigana kana={dest.kana}>{dest.kanji}</Furigana>
            {`　${current.stops.length}えき`}
          </span>
        </div>
        {current.nickname !== undefined && (
          <div className="board-nickname">「{current.nickname}」ともよばれます</div>
        )}

        <div className="keyhint">↑↓ でえらんで Enter　[Esc] もどる</div>
      </div>
    </div>
  );
}
