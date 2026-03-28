import type { CSSResult } from 'lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styles } from './tab-bar.styles.js';

export interface TabDef {
  id: string;
  label: string;
}

/**
 * Horizontal tab bar that renders a row of buttons from a tab definition list.
 *
 * @property tabs - Array of tab definitions to render
 * @property active - The id of the currently active tab
 * @fires tab-change - Dispatched with the tab id when the user clicks a tab
 */
@customElement('qwik-tab-bar')
export class TabBar extends LitElement {
  static override styles: CSSResult = styles;

  @property({ type: Array }) tabs: TabDef[] = [];

  @property({ type: String }) active = '';

  override render() {
    return html`
      <nav class="tabs" role="tablist">
        ${this.tabs.map(
          (tab) => html`
            <button
              class="tab"
              role="tab"
              aria-selected=${this.active === tab.id ? 'true' : 'false'}
              tabindex=${this.active === tab.id ? '0' : '-1'}
              ?data-active=${this.active === tab.id}
              data-tab-id=${tab.id}
              @click=${this._handleTabClick}
              @keydown=${this._handleTabKeydown}
            >
              ${tab.label}
            </button>
          `,
        )}
      </nav>
    `;
  }

  private _handleTabClick(e: Event) {
    const id = (e.currentTarget as HTMLElement).dataset.tabId;
    if (id) this._dispatchTabChange(id);
  }

  private _handleTabKeydown(e: KeyboardEvent) {
    const id = (e.currentTarget as HTMLElement).dataset.tabId;
    if (id) this._handleKeydown(e, id);
  }

  private _handleKeydown(e: KeyboardEvent, currentId: string) {
    const idx = this.tabs.findIndex((t) => t.id === currentId);
    let nextIdx = -1;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIdx = (idx + 1) % this.tabs.length;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIdx = (idx - 1 + this.tabs.length) % this.tabs.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIdx = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIdx = this.tabs.length - 1;
        break;
      default:
        return;
    }

    this._dispatchTabChange(this.tabs[nextIdx].id);
    this.updateComplete.then(() => {
      const buttons = this.shadowRoot?.querySelectorAll<HTMLElement>('.tab');
      buttons?.[nextIdx]?.focus();
    });
  }

  private _dispatchTabChange(tabId: TabDef['id']) {
    this.dispatchEvent(
      new CustomEvent('tab-change', {
        detail: tabId,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-tab-bar': TabBar;
  }
}
