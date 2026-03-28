import type { CSSResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styles } from './json-tree.styles.js';

const MAX_DEPTH = 20;

/**
 * Recursive JSON tree viewer. Renders primitives inline, and objects/arrays
 * as collapsible nodes. Root nodes auto-expand on first render.
 *
 * @property data - The JSON-compatible value to display
 * @property label - Key label shown before the value (empty for root)
 * @property root - Whether this is the top-level instance (auto-expands)
 * @property depth - Current nesting depth (used to enforce MAX_DEPTH)
 */
@customElement('qwik-json-tree')
export class JsonTree extends LitElement {
  static override styles: CSSResult = styles;

  @property({ attribute: false }) data: unknown = undefined;
  @property() label = '';
  @property({ type: Boolean }) root = true;
  @property({ type: Number }) depth = 0;

  @state() private _expanded = false;

  override firstUpdated() {
    if (this.root) this._expanded = true;
  }

  override render() {
    if (this.depth > MAX_DEPTH) {
      return this._prim('(max depth reached)', 'null');
    }
    if (this.data === null) return this._prim('null', 'null');
    if (this.data === undefined) return this._prim('undefined', 'null');
    switch (typeof this.data) {
      case 'string':
        return this._prim(`"${this.data}"`, 'string');
      case 'number':
        return this._prim(String(this.data), 'number');
      case 'boolean':
        return this._prim(String(this.data), 'boolean');
      case 'object':
        return Array.isArray(this.data)
          ? this._renderArr(this.data)
          : this._renderObj(this.data as Record<string, unknown>);
      default:
        return this._prim(String(this.data), 'string');
    }
  }

  private _prim(display: string, cls: string) {
    return html`<span class="line">
      ${
        this.label
          ? html`<span class="key">${this.label}</span
            ><span class="colon">:</span>`
          : nothing
      }
      <span class=${cls}>${display}</span>
    </span>`;
  }

  private _renderObj(obj: Record<string, unknown>) {
    const entries = Object.entries(obj);
    if (!entries.length)
      return html`<span class="line"
        >${this._lbl()}<span class="bracket">{}</span></span
      >`;
    return html`<div class="node ${this.root ? 'node-root' : ''}">
      <span class="line" @click=${this._toggle}>
        <span class="toggle" ?data-open=${this._expanded}>▶</span>
        ${this._lbl()}
        ${
          !this._expanded
            ? html`<span class="preview">{${entries.length}}</span>`
            : html`<span class="bracket">{</span>`
        }
      </span>
      ${
        this._expanded
          ? html`${entries.map(
              ([k, v]) =>
                html`<qwik-json-tree
                  .data=${v}
                  .label=${k}
                  .root=${false}
                  .depth=${this.depth + 1}
                ></qwik-json-tree>`,
            )}<span class="bracket">}</span>`
          : nothing
      }
    </div>`;
  }

  private _renderArr(arr: unknown[]) {
    if (!arr.length)
      return html`<span class="line"
        >${this._lbl()}<span class="bracket">[]</span></span
      >`;
    return html`<div class="node ${this.root ? 'node-root' : ''}">
      <span class="line" @click=${this._toggle}>
        <span class="toggle" ?data-open=${this._expanded}>▶</span>
        ${this._lbl()}
        ${
          !this._expanded
            ? html`<span class="preview">[${arr.length}]</span>`
            : html`<span class="bracket">[</span>`
        }
      </span>
      ${
        this._expanded
          ? html`${arr.map(
              (v, i) =>
                html`<qwik-json-tree
                  .data=${v}
                  .label=${String(i)}
                  .root=${false}
                  .depth=${this.depth + 1}
                ></qwik-json-tree>`,
            )}<span class="bracket">]</span>`
          : nothing
      }
    </div>`;
  }

  private _lbl() {
    return this.label
      ? html`<span class="key">${this.label}</span><span class="colon">:</span>`
      : nothing;
  }

  private _toggle() {
    this._expanded = !this._expanded;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-json-tree': JsonTree;
  }
}
