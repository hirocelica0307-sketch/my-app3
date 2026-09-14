export function ImeWarning() {
  return (
    <div className="overlay">
      <div className="warn-box">
        <div className="warn">⚠ 日本語入力（IME）がONです</div>
        <div style={{ marginTop: '0.8em' }}>
          <b>［半角/全角］</b>キーを押して<br />
          半角英数入力に切り替えてください
        </div>
        <div className="keyhint">Mac は［英数］キー、または Ctrl+Space</div>
        <div className="keyhint">ゲームは一時停止中です</div>
      </div>
    </div>
  );
}
