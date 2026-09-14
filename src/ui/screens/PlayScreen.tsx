import { StationNameDisplay } from '../components/StationNameDisplay';
import { TimerBar } from '../components/TimerBar';
import type { Snapshot } from '../../engine/game/engine';

interface Props { snap: Snapshot }

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

export function PlayScreen({ snap }: Props) {
  return (
    <div className="hud">
      <div className="hud-top">
        <span className="hud-label">{snap.trainType}</span>
        <span className="hud-value">{snap.lineName} {snap.destination}行</span>
        <TimerBar remain={snap.remainSec} limit={snap.timeLimit} />
        <span className="hud-value">{snap.remainSec.toFixed(1)}s</span>
        <span className="hud-value">{yen(snap.fare)}</span>
        {snap.combo > 1 && <span className="combo">COMBO {snap.combo}</span>}
      </div>

      <div className="toasts">
        {snap.toasts.map((t) => (
          <div key={t.id} className="toast">{t.text}</div>
        ))}
      </div>

      {snap.phase === 'turnaround' ? (
        <div className="station turnaround">
          <div className="station-kanji">折り返し</div>
          <div className="station-kana">まもなく {snap.stationKanji} 方面へ発車します</div>
        </div>
      ) : (
        <StationNameDisplay snap={snap} />
      )}

      <div className="hud-bottom">
        <span className="hud-label">次は</span>
        <span className="hud-value">
          {snap.phase === 'departing' ? snap.stationKanji : snap.nextStationKanji ?? '終点'}
        </span>
        <span className="hud-label">{snap.nextSegmentKm.toFixed(1)}km</span>
        <span style={{ marginLeft: 'auto' }} className="hud-label">
          {snap.stationNote ?? ''}
        </span>
      </div>
    </div>
  );
}
