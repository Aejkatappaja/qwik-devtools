import type { CSSResult, TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  LIVE_POLL_INTERVAL_MS,
  VIRTUAL_NODE_TAG,
} from '../../lib/constants.js';
import { PageBridge } from '../../lib/page-bridge.js';
import {
  formatLiveKey,
  getLiveType,
  isEditableKey,
} from '../../lib/state-display.js';
import type { QwikComponentNode } from '../../lib/types.js';
import { liveEditorStyles } from './live-editor.styles.js';

/**
 * Handles live DOM state watching, display, and inline editing for a
 * Qwik component node. Polls the inspected page at a fixed interval and
 * renders editable rows for each live value.
 *
 * @property node - The component node whose live state to track
 * @fires live-entries-changed - When the number of live entries changes (detail: number)
 */
@customElement('qwik-live-editor')
export class LiveEditor extends LitElement {
  static override styles: CSSResult = liveEditorStyles;

  @property({ attribute: false }) node: QwikComponentNode | null = null;

  private _bridge = new PageBridge();

  @state() private _liveState: Record<string, unknown> | null = null;
  @state() private _editingKey: string | null = null;
  @state() private _editingValue = '';

  private _liveInterval: ReturnType<typeof setInterval> | null = null;
  private _liveAbort: AbortController | null = null;
  private _prevEntryCount = 0;
  private _wasPollingBeforeHidden = false;

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._stopLiveWatch();
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('node')) {
      if (this.node) {
        this._startLiveWatch(this.node);
      } else {
        this._stopLiveWatch();
      }
    }
  }

  /** Pause polling when DevTools panel is hidden, resume when visible */
  private _onVisibilityChange = () => {
    if (document.hidden) {
      this._wasPollingBeforeHidden = this._liveInterval !== null;
      this._stopLiveWatch();
    } else if (this._wasPollingBeforeHidden && this.node) {
      this._startLiveWatch(this.node);
    }
  };

  /** Restart the live polling loop (e.g. after the tree refreshes). */
  startLiveWatch() {
    if (this.node) this._startLiveWatch(this.node);
  }

  /** Current filtered live entries (excludes className/textContent/error). */
  get liveEntries(): [string, unknown][] {
    if (!this._liveState) return [];
    return Object.entries(this._liveState).filter(
      ([k]) => k !== 'className' && k !== 'textContent' && k !== 'error',
    );
  }

  override render(): TemplateResult | typeof nothing {
    if (
      !this.node ||
      this.node.tagName === VIRTUAL_NODE_TAG ||
      this.liveEntries.length === 0
    ) {
      return nothing;
    }

    const entries = this.liveEntries;
    // Notify parent when entry count changes so it can update section header
    if (entries.length !== this._prevEntryCount) {
      this._prevEntryCount = entries.length;
      this.dispatchEvent(
        new CustomEvent('live-entries-changed', {
          detail: entries.length,
          bubbles: true,
          composed: true,
        }),
      );
    }

    const node = this.node;
    return html`
      ${entries.map(([key, val]) =>
        this._renderEditableLiveRow(key, val, node),
      )}
      <div class="edit-hint">Double-click a value to edit it</div>
    `;
  }

  private _renderEditableLiveRow(
    key: string,
    val: unknown,
    _node: QwikComponentNode,
  ) {
    const isEditing = this._editingKey === key;
    const displayVal = typeof val === 'string' ? `"${val}"` : String(val);
    const editable = isEditableKey(key);
    const label = formatLiveKey(key);
    const liveType = getLiveType(key);
    const typeColor =
      liveType === 'value'
        ? 'var(--signal-color)'
        : liveType === 'boolean'
          ? 'var(--boolean-color)'
          : 'var(--live-color)';

    if (isEditing) {
      return html`
        <div class="live-row">
          <span class="live-key">${label}</span>
          <span class="state-colon">:</span>
          <input
            class="edit-input"
            .value=${this._editingValue}
            @input=${this._handleEditInput}
            @keydown=${this._handleEditKeydown}
            @blur=${this._handleEditBlur}
          />
        </div>
      `;
    }

    return html`
      <div class="live-row">
        <span
          class="state-type-tag"
          style="background: color-mix(in srgb, ${typeColor} 15%, transparent); color: ${typeColor}"
          >${liveType}</span
        >
        <span class="live-key">${label}</span>
        <span class="state-colon">:</span>
        <span
          class="live-value ${editable ? 'editable' : ''}"
          data-key=${key}
          data-val=${String(val)}
          @dblclick=${editable ? this._handleDblClick : undefined}
          >${displayVal}</span
        >
      </div>
    `;
  }

  private _handleEditInput(e: InputEvent) {
    this._editingValue = (e.target as HTMLInputElement).value;
  }

  private _handleEditKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter' && this._editingKey && this.node) {
      this._commitEdit(this._editingKey, this.node);
    }
    if (e.key === 'Escape') {
      this._editingKey = null;
    }
  }

  private _handleEditBlur() {
    if (this._editingKey && this.node) {
      this._commitEdit(this._editingKey, this.node);
    }
  }

  private _handleDblClick(e: Event) {
    const el = e.currentTarget as HTMLElement;
    const key = el.dataset.key;
    const val = el.dataset.val;
    if (key != null) this._startEdit(key, val ?? '');
  }

  private _startEdit(key: string, val: unknown) {
    this._editingKey = key;
    this._editingValue = typeof val === 'string' ? val : String(val);
    this._stopLiveWatch();
    this.updateComplete.then(() => {
      const input = this.shadowRoot?.querySelector(
        '.edit-input',
      ) as HTMLInputElement;
      input?.focus();
      input?.select();
    });
  }

  private _commitEdit(key: string, node: QwikComponentNode) {
    if (!this._editingKey) return;
    const newVal = this._editingValue;
    const qId = node.id;
    this._editingKey = null;

    if (key === 'value') {
      this._bridge.setValue(qId, newVal);
    } else if (key.startsWith('input:')) {
      this._bridge.setChildInputValue(qId, key.substring(6), newVal);
    } else if (key === 'checked') {
      this._bridge.setChecked(qId, newVal === 'true');
    } else if (key === 'open') {
      this._bridge.setOpen(qId, newVal === 'true');
    } else if (key.startsWith('data-')) {
      this._bridge.setData(qId, key.substring(5), newVal);
    } else if (key.startsWith('aria-')) {
      this._bridge.setAria(qId, key, newVal);
    }

    this._startLiveWatch(node);
  }

  private _refreshLiveState(node: QwikComponentNode) {
    if (node.tagName === VIRTUAL_NODE_TAG) return;
    this._bridge.getLiveState(node.id).then(
      (state) => {
        this._liveState = state;
      },
      () => {
        this._liveState = null;
      },
    );
  }

  private _startLiveWatch(node: QwikComponentNode) {
    this._stopLiveWatch();
    this._refreshLiveState(node);
    const abort = new AbortController();
    this._liveAbort = abort;
    const interval = setInterval(() => {
      if (abort.signal.aborted) {
        clearInterval(interval);
        return;
      }
      if (this.node) this._refreshLiveState(this.node);
    }, LIVE_POLL_INTERVAL_MS);
    this._liveInterval = interval;
  }

  private _stopLiveWatch() {
    if (this._liveAbort) {
      this._liveAbort.abort();
      this._liveAbort = null;
    }
    if (this._liveInterval) {
      clearInterval(this._liveInterval);
      this._liveInterval = null;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-live-editor': LiveEditor;
  }
}
