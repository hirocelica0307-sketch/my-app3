import { RailStrip } from '../components/RailStrip';
import { RollSign } from '../components/RollSign';
import { TimerBar } from '../components/TimerBar';
import type { Snapshot } from '../../engine/game/engine';

interface Props { snap: Snapshot }

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

export function PlayScreen({ snap }: Props) {
  return (
    <div className="hud">
      <div className="hud-top">
        <RollSign
          trainType={snap.trainType}
          lineName={snap.lineName}
          destination={snap.destination}
          lineColor={snap.lineColor}
        />
        <TimerBar remain={snap.remainSec} limit={snap.timeLimit} />
        <span className="hud-value">{snap.remainSec.toFixed(1)}s</span>
        {/* 「実際の運賃」とボーナスは混ぜない。混ぜると本物の額に見えなくなる */}
        <span className="hud-value" title="うんちん">{yen(snap.baseFare)}</span>
        {snap.bonus > 0 && <span className="hud-bonus">+{yen(snap.bonus)}</span>}
        <span className="hud-pax" title="のせているお客さん">
          <span className="pax-icon">👥</span>{snap.onboard}
        </span>
        {snap.combo > 1 && <span className="combo">COMBO {snap.combo}</span>}
        <span className="weather-badge">{snap.weatherLabel}</span>
        {/* 一時停止できることが分からないと、やめたいときに困る */}
        <span className="hud-esc">[Esc] メニュー</span>
      </div>

      <div className="toasts">
        {snap.toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>{t.text}</div>
        ))}
      </div>

      {snap.phase === 'turnaround' ? (
        <div className="turnaround-banner">
          <div className="turnaround-title">終点 — 折り返します</div>
          <div className="turnaround-sub">まもなく {snap.destination} 方面へ発車します</div>
        </div>
      ) : (
        <RailStrip snap={snap} />
      )}
    </div>
  );
}
