import type { CSSResult, PropertyValues, TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { RESUMABILITY_SCRIPT } from '../lib/resumability-analyzer.js';
import type { ResumabilityData } from '../lib/types.js';
import { styles } from './performance-tab.styles.js';
import { refreshSmallIcon } from './shared/icons.js';
import { Toast } from './shared/toast.js';

/**
 * Performance and resumability analysis tab. Shows a lazy-loading score ring,
 * handler statistics, prefetch status, and a serialization breakdown chart
 * for the inspected Qwik application.
 */
@customElement('qwik-performance-tab')
export class PerformanceTab extends LitElement {
  static override styles: CSSResult = styles;

  @property({ attribute: false }) data: ResumabilityData | null = null;

  @state() private _localData: ResumabilityData | null = null;
  @state() private _isLoading = false;
  @state() private _fetchFailed = false;

  private get _data(): ResumabilityData | null {
    return this.data ?? this._localData;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this._data) {
      this._fetchFailed = false;
      this._fetch();
    }
  }

  override willUpdate(changed: PropertyValues) {
    // Re-fetch when parent resets data to null (e.g. after PAGE_CHANGED).
    // Perf data reads from runtime/qwik-json, not accumulated DOM elements,
    // so re-fetching after navigation is safe and accurate.
    if (changed.has('data') && !this.data && !this._isLoading) {
      this._localData = null;
      this._fetchFailed = false;
      this._fetch();
    }
  }

  override render() {
    if (this._isLoading)
      return html`<div class="loading">Analyzing resumability...</div>`;
    if (!this._data)
      return html`<div class="empty">
        No Qwik app
        found.${
          this._fetchFailed
            ? html`<br /><button
                @click=${this._fetch}
                aria-label="Retry analysis"
              >
                Retry
              </button>`
            : nothing
        }
      </div>`;

    const d = this._data;
    const lazyPct =
      d.totalListeners > 0
        ? Math.round((d.pendingListeners / d.totalListeners) * 100)
        : 100;
    const circumference = 2 * Math.PI * 34;
    const dashOffset = circumference - (lazyPct / 100) * circumference;
    const ringColor = 'var(--accent)';

    return html`
      <div class="content">
        <div class="score-hero">
          <div
            class="score-ring"
            role="img"
            aria-label="Lazy loading score: ${lazyPct}%"
          >
            <svg viewBox="0 0 80 80">
              <circle class="score-ring-bg" cx="40" cy="40" r="34" />
              <circle
                class="score-ring-fill"
                cx="40"
                cy="40"
                r="34"
                style="stroke: ${ringColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${dashOffset}"
              />
            </svg>
            <div class="score-number" style="color: ${ringColor}">
              ${lazyPct}%
            </div>
          </div>
          <div class="score-info">
            <h3>
              Lazy Loading Status
              <button
                class="refresh-inline"
                @click=${this._fetch}
                title="Refresh"
                aria-label="Refresh resumability data"
              >
                ${refreshSmallIcon}
              </button>
            </h3>
            <p>
              ${d.pendingListeners} of ${d.totalListeners} event handlers are
              still lazy (not yet downloaded).
            </p>
            <p>Container: <strong>${d.containerState}</strong></p>
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${d.totalListeners}</div>
            <div class="stat-label">Total Handlers</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${d.pendingListeners}</div>
            <div class="stat-label">Lazy</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${d.resumedListeners}</div>
            <div class="stat-label">Downloaded</div>
          </div>
          <div class="stat-card">
            <div class="stat-value purple">
              ${this._formatSize(d.serializationSize)}
            </div>
            <div class="stat-label">qwik/json Size</div>
          </div>
        </div>

        <div class="section-title">Prefetch Status</div>
        ${this._renderPrefetchBar(d.prefetchStatus)}
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${d.prefetchStatus.totalModules}</div>
            <div class="stat-label">Total Modules</div>
          </div>
          <div class="stat-card">
            <div class="stat-value green">
              ${this._formatSize(d.prefetchStatus.loadedSize)}
            </div>
            <div class="stat-label">Downloaded</div>
          </div>
        </div>

        <div class="section-title">
          Serialization Breakdown (${d.serializationBreakdown.totalObjects}
          objects)
        </div>
        ${this._renderBreakdownChart(d.serializationBreakdown)}
        ${
          d.serializationBreakdown.topObjects.length > 0
            ? html`
              <div class="section-title">Largest Serialized Objects</div>
              <div class="top-list">
                ${d.serializationBreakdown.topObjects.map(
                  (obj) => html`
                    <div class="top-row">
                      <span class="top-index">#${obj.index}</span>
                      <span class="top-type">${obj.type}</span>
                      <span class="top-preview">${obj.preview}</span>
                      <span class="top-size"
                        >${this._formatSize(obj.size)}</span
                      >
                    </div>
                  `,
                )}
              </div>
            `
            : nothing
        }
      </div>
    `;
  }

  private _renderPrefetchBar(
    prefetchStatus: ResumabilityData['prefetchStatus'],
  ): TemplateResult {
    return html`
      <div class="prefetch-bar">
        ${
          prefetchStatus.loadedModules > 0
            ? html`<div
              class="prefetch-loaded"
              style="width: ${
                (prefetchStatus.loadedModules /
                  Math.max(prefetchStatus.totalModules, 1)) *
                100
              }%"
            >
              ${prefetchStatus.loadedModules} loaded
            </div>`
            : nothing
        }
        ${
          prefetchStatus.pendingModules > 0
            ? html`<div class="prefetch-pending">
              ${prefetchStatus.pendingModules} pending
            </div>`
            : nothing
        }
      </div>
    `;
  }

  private _renderBreakdownChart(b: ResumabilityData['serializationBreakdown']) {
    const total = b.totalObjects || 1;
    const items = [
      { label: 'string', count: b.string, color: 'var(--string-color)' },
      { label: 'object', count: b.object, color: 'var(--accent)' },
      { label: 'array', count: b.array, color: 'var(--live-color)' },
      { label: 'number', count: b.number, color: 'var(--number-color)' },
      { label: 'signal', count: b.signal, color: 'var(--signal-color)' },
      { label: 'computed', count: b.computed, color: 'var(--computed-color)' },
      { label: 'qrl', count: b.qrl, color: 'var(--qrl-color)' },
      { label: 'other', count: b.other, color: 'var(--text-muted)' },
    ].filter((i) => i.count > 0);

    return html`
      <div class="bar-chart">
        ${items.map(
          (item) => html`
            <div class="bar-row">
              <span class="bar-label">${item.label}</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  style="width: ${Math.max(
                    (item.count / total) * 100,
                    2,
                  )}%; background: ${item.color}"
                ></div>
              </div>
              <span class="bar-count">${item.count}</span>
            </div>
          `,
        )}
      </div>
    `;
  }

  private _fetch() {
    if (this._isLoading) return;
    this._isLoading = true;
    this._fetchFailed = false;
    try {
      chrome.devtools.inspectedWindow.eval(
        RESUMABILITY_SCRIPT,
        (result: unknown, err: unknown) => {
          if (!err && result && typeof result === 'object') {
            this._localData = result as ResumabilityData;
            this.dispatchEvent(
              new CustomEvent('data-fetched', {
                detail: this._localData,
                bubbles: true,
                composed: true,
              }),
            );
          } else {
            this._localData = null;
            this._fetchFailed = true;
            Toast.show('Failed to analyze resumability', 'warning');
          }
          this._isLoading = false;
        },
      );
    } catch (err) {
      console.debug('[Qwik DevTools] Failed to run resumability analysis', err);
      Toast.show('Failed to analyze resumability', 'warning');
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
    'qwik-performance-tab': PerformanceTab;
  }
}
