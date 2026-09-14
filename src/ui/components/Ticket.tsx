import type { RunSummary } from '../../engine/game/scoring';
import { storageFailed, ticketNumber } from '../../storage/save';

interface Props {
  summary: RunSummary;
  lineColor: string;
  isNewRecord: boolean;
}

const yen = (n: number) => `¥ ${n.toLocaleString('ja-JP')}`;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, ' ')}.${d.getDate()}`;
}

/** リザルト画面。切符（乗車券）の券面として組む。 */
export function Ticket({ summary: s, lineColor, isNewRecord }: Props) {
  return (
    <div className="ticket-wrap">
      <div className="ticket-panel">
        <div className="ticket" style={{ ['--ticket-color' as string]: lineColor }}>
          {isNewRecord && <div className="new-record">NEW RECORD</div>}

          <div className="ticket-head">
            <div className="ticket-title">乗車券</div>
            <div className="ticket-fare">{yen(s.fare)}</div>
          </div>

          <div className="ticket-route">
            <div className="ticket-stn">
              <div className="ticket-stn-kanji">{s.originKanji}</div>
              <div className="ticket-stn-kana">{s.originKana}</div>
            </div>
            <div className="ticket-arrow">&gt;&gt;&gt;</div>
            <div className="ticket-stn">
              <div className="ticket-stn-kanji">{s.reachedKanji}</div>
              <div className="ticket-stn-kana">{s.reachedKana}</div>
            </div>
          </div>

          <div className="ticket-via">
            <span>経由: {s.lineName}</span>
            <span>営業キロ {s.km.toFixed(1)}km{s.laps > 0 ? `（${s.laps}折返）` : ''}</span>
          </div>

          <div className="ticket-grid">
            <span className="label">打鍵数</span>
            <span className="value">{s.keystrokes.toLocaleString('ja-JP')}<span className="unit">打</span></span>
            <span className="label">正確率</span>
            <span className="value">{s.accuracy.toFixed(1)}%</span>

            <span className="label">KPM</span>
            <span className="value">{Math.round(s.kpm)}</span>
            <span className="label">WPM</span>
            <span className="value">{Math.round(s.wpm)}</span>

            <span className="label">到達駅</span>
            <span className="value">{s.reachedCount}<span className="unit">駅</span></span>
            <span className="label">最長コンボ</span>
            <span className="value">{s.maxCombo}<span className="unit">駅</span></span>

            <span className="label">制限時間</span>
            <span className="value">{s.timeLimit}<span className="unit">秒</span></span>
            <span className="label">ミス</span>
            <span className="value">{s.misses}<span className="unit">回</span></span>
          </div>

          <div className="ticket-breakdown">
            内訳: 運賃 {yen(s.baseFare)} + ボーナス {yen(s.bonus)}
          </div>

          <div className="ticket-foot">
            <span className="punch" />
            <span>{today()} 発行　岡山鉄道タイピング ({ticketNumber()})</span>
            <span className="ticket-note">※ミス前途無効・下車後は再挑戦できます</span>
          </div>

          <div className="ticket-magnetic" />
        </div>

        <div className="ticket-actions">
          <b>[R]</b> もう一度　<b>[Esc]</b> タイトルへ
        </div>
        <div className="ticket-disclaimer">
          運賃はゲーム用の簡易計算であり、実際の運賃とは異なります。
          {storageFailed() && <span className="storage-warn">　記録を保存できませんでした。</span>}
        </div>
      </div>
    </div>
  );
}
