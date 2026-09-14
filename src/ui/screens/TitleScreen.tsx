interface Props {
  best: number | null;
  lineName: string;
  destination: string;
  timeLimit: number;
  pointerCoarse: boolean;
}

export function TitleScreen({ best, lineName, destination, timeLimit, pointerCoarse }: Props) {
  return (
    <div className="overlay soft">
      <div>
        <div className="title-logo">岡山鉄道タイピング</div>
        <div className="title-sub">OKAYAMA RAIL TYPING</div>

        <div className="title-meta">
          本日の路線　{lineName}　{destination}行（{timeLimit}秒）<br />
          最高運賃　{best === null ? '記録なし' : `¥${best.toLocaleString('ja-JP')}`}
        </div>

        <div className="title-press">▶ PRESS SPACE</div>

        <div className="keyhint">
          駅名をローマ字で入力します。日本語入力は<b>OFF</b>にしてください。
        </div>
        {pointerCoarse && (
          <div className="keyhint warn">※本作はPCキーボード専用です</div>
        )}
      </div>
    </div>
  );
}
