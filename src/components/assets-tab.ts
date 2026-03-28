import type { CSSResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ASSET_EXTRACTION_SCRIPT } from '../lib/asset-explorer.js';
import { QWIK_JSON_SCRIPT_TYPE } from '../lib/constants.js';
import type { AssetData } from '../lib/types.js';
import { styles } from './assets-tab.styles.js';
import { refreshSmallIcon } from './shared/icons.js';
import { Toast } from './shared/toast.js';

/**
 * Displays a summary of page assets (scripts, stylesheets, images, preloads)
 * extracted from the inspected Qwik page via an eval script.
 * Fully self-contained: fetches its own data on first open and on manual rescan.
 */
@customElement('qwik-assets-tab')
export class AssetsTab extends LitElement {
  static override styles: CSSResult = styles;

  /** Parent sets this to null on PAGE_CHANGED to trigger auto-refetch. */
  @property({ attribute: false }) refetchSignal: number | null = null;

  @state() private _data: AssetData | null = null;
  @state() private _isLoading = false;
  @state() private _fetchFailed = false;
  @state() private _lastFetched: string | null = null;

  private _lastRefetchSignal: number | null = null;
  private _initTimeout: ReturnType<typeof setTimeout> | null = null;

  override connectedCallback() {
    super.connectedCallback();
    if (!this._data) {
      // Delay initial fetch slightly — the tab may be created before
      // the page has finished loading all scripts/styles/preloads.
      this._initTimeout = setTimeout(() => this._fetchAssets(), 500);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._initTimeout) {
      clearTimeout(this._initTimeout);
      this._initTimeout = null;
    }
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (
      changed.has('refetchSignal') &&
      this.refetchSignal !== this._lastRefetchSignal
    ) {
      this._lastRefetchSignal = this.refetchSignal;
      this._fetchAssets();
    }
  }

  override render() {
    if (this._isLoading)
      return html`<div class="loading">Scanning assets...</div>`;
    if (!this._data && !this._fetchFailed)
      return html`<div class="loading">Scanning assets...</div>`;
    if (!this._data)
      return html`<div class="empty">
        No asset data available.<br /><button
          @click=${() => this._fetchAssets()}
          aria-label="Retry asset scan"
        >
          Retry
        </button>
      </div>`;

    const d = this._data;

    return html`
      <div class="content">
        <div class="assets-header">
          ${this._lastFetched ? html`<span class="last-fetched">Updated ${this._lastFetched}</span>` : nothing}
          <button class="refresh-btn" @click=${() => this._fetchAssets()} title="Rescan assets" aria-label="Rescan assets">
            ${refreshSmallIcon} Rescan
          </button>
        </div>
        ${
          d.images.length > 0
            ? html`
              <div class="section-title">Images (${d.images.length})</div>
              ${d.images.map(
                (img) => html`
                  <div class="asset-row">
                    <span class="asset-type">${img.format}</span>
                    <span class="asset-url">${img.src || '(no src)'}</span>
                    <span class="asset-dims"
                      >${img.naturalWidth}×${img.naturalHeight}</span
                    >
                  </div>
                `,
              )}
            `
            : nothing
        }
        ${
          d.scripts.length > 0
            ? html`
              <div class="section-title">Scripts (${d.scripts.length})</div>
              ${[...d.scripts]
                .sort((a, b) => b.size - a.size)
                .map(
                  (s) => html`
                    <div class="asset-row">
                      <span class="asset-type"
                        >${s.type === QWIK_JSON_SCRIPT_TYPE ? 'json' : 'js'}</span
                      >
                      <span class="asset-url">${s.url}</span>
                      <span class="asset-size"
                        >${this._formatSize(s.size)}</span
                      >
                    </div>
                  `,
                )}
            `
            : nothing
        }
        ${
          d.styles.length > 0
            ? html`
              <div class="section-title">Stylesheets (${d.styles.length})</div>
              ${[...d.styles]
                .sort((a, b) => b.size - a.size)
                .map(
                  (s) => html`
                    <div class="asset-row">
                      <span class="asset-type">css</span>
                      <span class="asset-url">${s.url}</span>
                      <span class="asset-size"
                        >${this._formatSize(s.size)}</span
                      >
                    </div>
                  `,
                )}
            `
            : nothing
        }
        ${
          d.preloads.length > 0
            ? html`
              <div class="section-title">
                Preloaded Resources (${d.preloads.length})
              </div>
              ${d.preloads.map(
                (p) => html`
                  <div class="asset-row">
                    <span class="asset-type">${p.type}</span>
                    <span class="asset-url">${p.url}</span>
                    <span class="asset-size">${this._formatSize(p.size)}</span>
                  </div>
                `,
              )}
            `
            : nothing
        }
      </div>
    `;
  }

  private _fetchAssets() {
    if (this._isLoading) return;
    this._isLoading = true;
    this._fetchFailed = false;
    try {
      chrome.devtools.inspectedWindow.eval(
        ASSET_EXTRACTION_SCRIPT,
        (result: unknown, err: unknown) => {
          if (!err && result && typeof result === 'object') {
            this._data = result as AssetData;
            this._lastFetched = new Date().toLocaleTimeString();
          } else {
            this._fetchFailed = true;
            Toast.show('Failed to scan assets', 'warning');
          }
          this._isLoading = false;
        },
      );
    } catch (err) {
      console.debug('[Qwik DevTools] Failed to fetch assets', err);
      Toast.show('Failed to scan assets', 'warning');
      this._fetchFailed = true;
      this._isLoading = false;
    }
  }

  private _formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-assets-tab': AssetsTab;
  }
}
