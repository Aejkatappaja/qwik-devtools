import type { CSSResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { TOAST_DISMISS_MS } from '../../lib/constants.js';
import { styles } from './toast.styles.js';

interface ToastItem {
  id: number;
  message: string;
  variant: 'error' | 'warning' | 'info';
}

let nextId = 0;

/**
 * Floating toast notifications. Dispatches from anywhere via:
 * `this.dispatchEvent(new CustomEvent('devtools-toast', { detail: { message, variant }, bubbles: true, composed: true }))`
 *
 * Or use the static helper: `Toast.show(message, variant)`
 */
@customElement('qwik-toast')
export class Toast extends LitElement {
  static override styles: CSSResult = styles;

  @state() private _toasts: ToastItem[] = [];

  private static _instances = new Set<Toast>();

  override connectedCallback() {
    super.connectedCallback();
    Toast._instances.add(this);
    this.ownerDocument.addEventListener(
      'devtools-toast',
      this._onToast as EventListener,
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    Toast._instances.delete(this);
    this.ownerDocument.removeEventListener(
      'devtools-toast',
      this._onToast as EventListener,
    );
  }

  /** Show on the most recently added instance only, with dedup */
  private static _lastMessages = new Map<string, number>();

  static show(
    message: string,
    variant: 'error' | 'warning' | 'info' = 'error',
  ) {
    // Dedup: skip if same message shown in last 2 seconds
    const key = `${variant}:${message}`;
    const now = Date.now();
    const lastShown = Toast._lastMessages.get(key);
    if (lastShown && now - lastShown < 2000) return;
    Toast._lastMessages.set(key, now);

    // Show on first instance only
    const first = Toast._instances.values().next().value;
    if (first) {
      first.add(message, variant);
    }
  }

  add(message: string, variant: 'error' | 'warning' | 'info') {
    const id = nextId++;
    this._toasts = [...this._toasts, { id, message, variant }];
    setTimeout(() => this._dismiss(id), TOAST_DISMISS_MS);
  }

  override render() {
    if (this._toasts.length === 0) return nothing;
    return html`<div role="status" aria-live="polite">${this._toasts.map(
      (t) => html`
        <div
          class="toast"
          data-variant=${t.variant}
          data-toast-id=${t.id}
          @click=${this._handleToastClick}
        >
          ${t.message}
        </div>
      `,
    )}</div>`;
  }

  private _onToast = (
    e: CustomEvent<{ message: string; variant: 'error' | 'warning' | 'info' }>,
  ) => {
    this.add(e.detail.message, e.detail.variant);
  };

  private _handleToastClick(e: Event) {
    const id = (e.currentTarget as HTMLElement).dataset.toastId;
    if (id) this._dismiss(Number(id));
  }

  private _dismiss(id: number) {
    this._toasts = this._toasts.filter((t) => t.id !== id);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-toast': Toast;
  }
}
