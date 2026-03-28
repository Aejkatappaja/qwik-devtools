import type { CSSResult } from 'lit';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styles } from './error-boundary.styles.js';

/**
 * Error boundary that catches errors in child rendering and shows
 * a fallback UI with retry button. Wraps each tab to prevent a
 * single crash from killing the entire DevTools panel.
 *
 * @property label - Name of the wrapped section (shown in error message)
 */
@customElement('qwik-error-boundary')
export class ErrorBoundary extends LitElement {
  static override styles: CSSResult = styles;

  @property({ type: String }) label = 'Component';

  @state() private _hasError = false;
  @state() private _errorMessage = '';

  override render() {
    if (this._hasError) {
      return html`
        <div class="error-fallback">
          <span class="error-icon">&#x26A0;</span>
          <span class="error-title">${this.label} crashed</span>
          <span class="error-message">${this._errorMessage}</span>
          <button class="retry-btn" @click=${this._retry}>Retry</button>
        </div>
      `;
    }
    return html`<slot @error=${this._handleError}></slot>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Catch unhandled errors from slotted children
    this.addEventListener('error', this._handleError as EventListener);
    window.addEventListener('unhandledrejection', this._handleRejection);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('error', this._handleError as EventListener);
    window.removeEventListener('unhandledrejection', this._handleRejection);
  }

  private _handleError = (e: Event | ErrorEvent) => {
    if (e instanceof ErrorEvent) {
      this._hasError = true;
      this._errorMessage = e.message || 'An unknown error occurred';
    }
  };

  private _handleRejection = (e: PromiseRejectionEvent) => {
    // Only catch rejections from our own shadow tree
    this._hasError = true;
    this._errorMessage = String(e.reason);
  };

  private _retry() {
    this._hasError = false;
    this._errorMessage = '';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-error-boundary': ErrorBoundary;
  }
}
