/**
 * IME（日本語入力）が ON かどうかの検知。
 * 1打鍵ごとの判定は IME OFF が前提なので、ON のまま始まると何も打てない。
 *
 * 検知は多重化する:
 *   1. keydown の isComposing
 *   2. keyCode === 229（isComposing が来ない古いブラウザのフォールバック）
 *   3. 常時フォーカスした不可視 input の compositionstart
 */
export class ImeWatcher {
  private composing = false;
  private listeners = new Set<(on: boolean) => void>();
  private input: HTMLInputElement | null = null;

  attach(): void {
    if (this.input !== null) return;
    const el = document.createElement('input');
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('spellcheck', 'false');
    el.setAttribute('aria-hidden', 'true');
    el.tabIndex = -1;
    // display:none だとフォーカスできないので、見えない大きさで置く
    Object.assign(el.style, {
      position: 'fixed', top: '0', left: '0',
      width: '1px', height: '1px', opacity: '0',
      border: 'none', padding: '0', pointerEvents: 'none',
    });
    el.addEventListener('compositionstart', () => this.set(true));
    el.addEventListener('compositionend', () => { el.value = ''; this.set(false); });
    el.addEventListener('input', () => { el.value = ''; });
    document.body.appendChild(el);
    this.input = el;
    el.focus({ preventScroll: true });
  }

  detach(): void {
    this.input?.remove();
    this.input = null;
    this.listeners.clear();
  }

  /** フォーカスが外れると compositionstart を拾えなくなるので取り戻す。 */
  refocus(): void {
    this.input?.focus({ preventScroll: true });
  }

  /** keydown から IME 状態を更新する。true なら打鍵として扱ってはいけない。 */
  inspectKeydown(e: KeyboardEvent): boolean {
    const on = e.isComposing || e.keyCode === 229;
    if (on) this.set(true);
    else if (this.composing && !on) this.set(false);
    return on;
  }

  get isOn(): boolean {
    return this.composing;
  }

  subscribe(fn: (on: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private set(on: boolean): void {
    if (this.composing === on) return;
    this.composing = on;
    for (const fn of this.listeners) fn(on);
  }
}
