import type { CSSResult, TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { VIRTUAL_NODE_TAG } from '../lib/constants.js';
import {
  formatDecodedValue,
  getStateLabel,
  getTypeColor,
} from '../lib/state-display.js';
import type { ComponentStateEntry, QwikComponentNode } from '../lib/types.js';
import { detailStyles } from './detail-panel.styles.js';
import './detail-sections/component-actions.js';
import './detail-sections/live-editor.js';
import './shared/json-tree.js';
import { checkIcon, copyIcon } from './shared/icons.js';

/**
 * Detail panel for an inspected Qwik component. Shows component header,
 * signals, serialized state, live DOM values with inline editing,
 * props, attributes, children list, and action buttons.
 *
 * @property node - The selected component node to display
 * @property isDevMode - Whether the inspected app is running in dev mode
 * @fires child-select - When a child row is clicked (detail: QwikComponentNode)
 */
@customElement('qwik-detail-panel')
export class DetailPanel extends LitElement {
  static override styles: CSSResult = detailStyles;

  @property({ attribute: false }) node: QwikComponentNode | null = null;
  @property({ attribute: false }) breadcrumb: string[] = [];
  @property({ type: Boolean }) isDevMode = false;

  @state() private _openSections = new Set([
    'signals',
    'state',
    'live',
    'props',
    'attrs',
    'children',
  ]);
  @state() private _copied = false;
  @state() private _liveEntryCount = 0;
  private _copyTimeout: ReturnType<typeof setTimeout> | null = null;

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._copyTimeout) {
      clearTimeout(this._copyTimeout);
      this._copyTimeout = null;
    }
  }

  override render() {
    if (!this.node) {
      return html`<div class="detail-empty">Select a component</div>`;
    }
    return this._renderDetail(this.node);
  }

  private _renderDetail(node: QwikComponentNode) {
    const signals = node.state.filter((s) => s.type === 'signal');
    const otherState = node.state.filter((s) => s.type !== 'signal');
    const attrs = Object.entries(node.attributes).filter(
      ([k]) => !k.startsWith('on:') && !k.startsWith('on-'),
    );

    return html`
      ${this._renderComponentHeader(node)}

      <div class="detail-body">
        ${this._renderSignals(signals)} ${this._renderOtherState(otherState)}
        ${this._renderLiveSection(node)} ${this._renderProps(node)}
        ${
          attrs.length > 0
            ? this._renderSection(
                'attrs',
                'Attributes',
                attrs.length,
                html`
                ${attrs.map(
                  ([k, v]) => html`
                    <div class="attr-row">
                      <span class="attr-key">${k}</span>
                      <span class="attr-val">${v}</span>
                    </div>
                  `,
                )}
              `,
              )
            : nothing
        }
        ${
          !node.hasContext &&
          signals.length === 0 &&
          otherState.length === 0 &&
          this._liveEntryCount === 0
            ? html`<div style="padding: 16px; text-align: center" class="no-data">
              No state data
            </div>`
            : nothing
        }
      </div>

      ${this._renderChildren(node)}

      <div class="meta-row">
        ${
          node.context?.componentQrl
            ? html`<span class="meta-tag">QRL</span>`
            : nothing
        }
      </div>

      <qwik-component-actions
        .node=${node}
        .isDevMode=${this.isDevMode}
      ></qwik-component-actions>
    `;
  }

  private _renderComponentHeader(node: QwikComponentNode): TemplateResult {
    return html`
      <div class="detail-header">
        <div class="detail-title">
          ${
            node.tagName !== VIRTUAL_NODE_TAG
              ? html`<span class="detail-tag">&lt;${node.tagName}&gt;</span>`
              : nothing
          }
          <span class="detail-name">${node.componentName}</span>
          <button class="copy-btn" @click=${this._copyInfo} title=${this._copied ? 'Copied!' : 'Copy component info'} aria-label="Copy component info">
            ${this._copied ? checkIcon : copyIcon}
          </button>
        </div>
        <div class="detail-breadcrumb">
          ${this.breadcrumb.length > 1
            ? html`<div class="breadcrumb-path">
                ${this.breadcrumb.map((name, i) =>
                  i < this.breadcrumb.length - 1
                    ? html`<span class="crumb">${name}</span><span class="crumb-sep">\u203A</span>`
                    : nothing
                )}
              </div>`
            : nothing
          }
          <div class="breadcrumb-meta">
            #${node.id}${node.key ? html` \u00B7 key=${node.key}` : nothing}
          </div>
        </div>
      </div>
    `;
  }

  private async _copyInfo() {
    if (!this.node) return;
    const info = {
      componentName: this.node.componentName,
      tagName: this.node.tagName,
      id: this.node.id,
      key: this.node.key,
      depth: this.node.depth,
      attributes: this.node.attributes,
      state: this.node.state.map(s => ({
        type: s.type,
        value: s.rawValue,
      })),
    };
    await navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    this._copied = true;
    if (this._copyTimeout) clearTimeout(this._copyTimeout);
    this._copyTimeout = setTimeout(() => { this._copied = false; }, 1500);
  }

  private _renderSignals(
    signals: ComponentStateEntry[],
  ): TemplateResult | typeof nothing {
    if (signals.length === 0) return nothing;
    return this._renderSection(
      'signals',
      `Signals`,
      signals.length,
      html`${signals.map((e) => this._renderStateRow(e))}`,
    );
  }

  private _renderOtherState(
    otherState: ComponentStateEntry[],
  ): TemplateResult | typeof nothing {
    if (otherState.length === 0) return nothing;
    return this._renderSection(
      'state',
      `State`,
      otherState.length,
      html`${otherState.map((e) => this._renderStateRow(e))}`,
    );
  }

  private _renderLiveSection(
    node: QwikComponentNode,
  ): TemplateResult | typeof nothing {
    if (node.tagName === VIRTUAL_NODE_TAG) return nothing;
    // Always render the editor so it can poll; the section wrapper hides
    // when entry count is 0.
    return this._liveEntryCount > 0
      ? this._renderSection(
          'live',
          html`State (live) <span class="live-dot"></span>`,
          this._liveEntryCount,
          html`
            <qwik-live-editor
              .node=${node}
              @live-entries-changed=${this._handleLiveEntriesChanged}
            ></qwik-live-editor>
          `,
        )
      : html`<qwik-live-editor
          .node=${node}
          style="display:none"
          @live-entries-changed=${this._handleLiveEntriesChanged}
        ></qwik-live-editor>`;
  }

  private _renderProps(
    node: QwikComponentNode,
  ): TemplateResult | typeof nothing {
    if (!node.context?.props || Object.keys(node.context.props).length === 0)
      return nothing;
    return this._renderSection(
      'props',
      'Props',
      Object.keys(node.context.props).length,
      html`<qwik-json-tree .data=${node.context.props}></qwik-json-tree>`,
    );
  }

  private _renderChildren(
    node: QwikComponentNode,
  ): TemplateResult | typeof nothing {
    if (node.children.length === 0) return nothing;
    return this._renderSection(
      'children',
      `Children`,
      node.children.length,
      html`
        ${node.children.map(
          (child) => html`
            <div
              class="child-row"
              data-child-id=${child.id}
              @click=${this._handleChildClick}
            >
              <span
                class="child-icon"
                data-type=${
                  child.tagName === VIRTUAL_NODE_TAG
                    ? 'C'
                    : child.hasContext
                      ? 'S'
                      : 'E'
                }
              >
                ${
                  child.tagName === VIRTUAL_NODE_TAG
                    ? 'C'
                    : child.hasContext
                      ? 'S'
                      : 'E'
                }
              </span>
              <span class="child-name">${child.componentName}</span>
              ${
                child.tagName !== VIRTUAL_NODE_TAG
                  ? html`<span class="child-tag">&lt;${child.tagName}&gt;</span>`
                  : nothing
              }
              <span class="child-id">#${child.id}</span>
            </div>
          `,
        )}
      `,
    );
  }

  private _renderSection(
    id: string,
    label: unknown,
    count: number,
    content: unknown,
  ) {
    const open = this._openSections.has(id);
    return html`
      <div class="section">
        <div class="section-header" data-section=${id} @click=${this._handleSectionClick}>
          <span class="section-arrow" ?data-open=${open}>&#x25B6;</span>
          ${label}
          <span class="section-count">${count}</span>
        </div>
        ${open ? html`<div class="section-body">${content}</div>` : nothing}
      </div>
    `;
  }

  private _renderStateRow(entry: ComponentStateEntry) {
    const { text, cssClass } = formatDecodedValue(entry.decodedValue);
    const typeColor = getTypeColor(entry.type);
    const label = getStateLabel(entry);

    return html`
      <div class="state-row">
        <span
          class="state-type-tag"
          style="background: color-mix(in srgb, ${typeColor} 15%, transparent); color: ${typeColor}"
          >${entry.type}</span
        >
        <span class="state-key">${label}</span>
        <span class="state-colon">:</span>
        <span class="state-value ${cssClass}">${text}</span>
      </div>
    `;
  }

  private _handleLiveEntriesChanged(e: CustomEvent<number>) {
    this._liveEntryCount = e.detail;
  }

  private _handleChildClick(e: Event) {
    const id = (e.currentTarget as HTMLElement).dataset.childId;
    if (!id || !this.node) return;
    const child = this.node.children.find((c) => c.id === id);
    if (child) {
      this.dispatchEvent(
        new CustomEvent('child-select', {
          detail: child,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _handleSectionClick(e: Event) {
    const section = (e.currentTarget as HTMLElement).dataset.section;
    if (section) this._toggleSection(section);
  }

  private _toggleSection(name: string) {
    const next = new Set(this._openSections);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    this._openSections = next;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-detail-panel': DetailPanel;
  }
}
