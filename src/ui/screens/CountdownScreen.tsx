interface Props { count: number; lineName: string; destination: string }

export function CountdownScreen({ count, lineName, destination }: Props) {
  return (
    <div className="overlay">
      <div className="panel">
        <div className="title-sub">{lineName}　{destination}行</div>
        <div className="big">{count === 0 ? '発車！' : count}</div>
        <div className="keyhint">日本語入力（IME）が OFF か たしかめてください</div>
      </div>
    </div>
  );
}
