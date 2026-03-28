import type { CSSResult, TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { VIRTUAL_NODE_TAG } from '../../lib/constants.js';
import { PageBridge } from '../../lib/page-bridge.js';
import type { QwikComponentNode } from '../../lib/types.js';
import { actionStyles } from './component-actions.styles.js';

/**
 * Action buttons for a component detail panel: "Inspect in Elements"
 * and "Open in Editor" (dev-mode only).
 *
 * @property node - The component node to act on
 * @property isDevMode - Whether the inspected app runs in dev mode
 */
@customElement('qwik-component-actions')
export class ComponentActions extends LitElement {
  static override styles: CSSResult = actionStyles;

  @property({ attribute: false }) node: QwikComponentNode | null = null;
  @property({ type: Boolean }) isDevMode = false;

  private _bridge = new PageBridge();

  override render(): TemplateResult | typeof nothing {
    if (!this.node) return nothing;

    const node = this.node;
    const showInspect = node.tagName !== VIRTUAL_NODE_TAG;
    const showEditor = this.isDevMode && !!node.context?.componentQrl;

    if (!showInspect && !showEditor) return nothing;

    return html`
      ${
        showInspect
          ? html`<button
              class="action-btn"
              @click=${this._handleInspect}
            >
              &#x2316; Inspect in Elements
            </button>`
          : nothing
      }
      ${
        showEditor
          ? html`<button
              class="action-btn"
              @click=${this._handleOpenEditor}
            >
              &#x2197; Open in Editor
            </button>`
          : nothing
      }
    `;
  }

  private _handleInspect() {
    if (this.node) this._bridge.inspectElement(this.node.id);
  }

  private _handleOpenEditor() {
    if (!this.node?.context?.componentQrl) return;
    const qrl = this.node.context.componentQrl;
    const hashIdx = qrl.indexOf('#');
    const chunkUrl = hashIdx >= 0 ? qrl.substring(0, hashIdx) : qrl;
    const filePath = chunkUrl.replace(/^\.\//, '').split('?')[0];
    this._bridge.openInEditor(filePath);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-component-actions': ComponentActions;
  }
}
