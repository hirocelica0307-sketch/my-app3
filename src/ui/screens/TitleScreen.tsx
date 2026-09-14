interface Props {
  best: number | null;
  lineName: string;
  destination: string;
  timeLimit: number;
  scopeNote: string;
  pointerCoarse: boolean;
}

export function TitleScreen({ best, lineName, destination, timeLimit, scopeNote, pointerCoarse }: Props) {
  return (
    <div className="overlay soft">
      <div>
        <div className="title-logo">岡山鉄道タイピング</div>
        <div className="title-sub">OKAYAMA RAIL TYPING</div>

        <div className="title-meta">
          {lineName}　{destination}ゆき　{scopeNote}<br />
          {timeLimit}秒の最高運賃　{best === null ? '記録なし' : `¥${best.toLocaleString('ja-JP')}`}
        </div>

        <div className="title-press">▶ PRESS SPACE</div>

        <div className="keyhint">
          駅名をローマ字で入力します。日本語入力は<b>OFF</b>にしてください。
        </div>
        {pointerCoarse && <div className="keyhint warn">※本作はPCキーボード専用です</div>}
      </div>
    </div>
  );
}
