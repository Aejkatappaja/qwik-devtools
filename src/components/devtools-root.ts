import type { CSSResult, TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { DevToolsStore } from '../lib/devtools-store.js';
import { styles } from './devtools-root.styles.js';
import {
  inspectIcon,
  moonIcon,
  qwikLogo,
  refreshIcon,
  sunIcon,
} from './shared/icons.js';
import type { TabDef } from './shared/tab-bar.js';

import './shared/tab-bar.js';
import './shared/status-badge.js';
import './components-tab.js';
import './shared/error-boundary.js';
import './shared/toast.js';

declare global {
  interface Window {
    __devtools_port?: chrome.runtime.Port;
    __devtools_tabId?: number;
  }
}

type TabId = 'components' | 'performance' | 'routes' | 'assets';

const TABS: TabDef[] = [
  { id: 'components', label: 'Components' },
  { id: 'performance', label: 'Performance' },
  { id: 'routes', label: 'Routes' },
  { id: 'assets', label: 'Assets' },
];

/**
 * Root shell of the Qwik DevTools panel.
 * Delegates all state management to {@link DevToolsStore} and focuses
 * purely on rendering the toolbar and active tab content.
 *
 * @fires tab-change - (internal, via child tab-bar) when user switches tabs
 */
@customElement('qwik-devtools-root')
export class DevtoolsRoot extends LitElement {
  static override styles: CSSResult = styles;

  @state() private _activeTab: TabId = 'components';
  @state() private _lightMode = false;
  @state() private _tabLoading = false;

  @state() private _loadedTabs = new Set<TabId>(['components']);

  private _store = new DevToolsStore();
  private _unsubscribe: (() => void) | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = this._store.onChange(() => this.requestUpdate());
    this._store.onElementPicked = () => {
      this._activeTab = 'components';
    };
    const port = window.__devtools_port ?? null;
    if (port) {
      this._store.connect(port);
    } else {
      this._store.isLoading = false;
      this._store.needsReload = false;
      this.requestUpdate();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._store.dispose();
  }

  override render() {
    return html`
      <div class="container">
        ${this._renderToolbar()}
        <main class="content">
          ${this._renderContent()}
        </main>
        <qwik-toast></qwik-toast>
      </div>
    `;
  }

  private _renderThemeIcon(): TemplateResult {
    if (this._lightMode) {
      return html`${moonIcon}`;
    }
    return html`${sunIcon}`;
  }

  private _renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <div class="tb-section">
          <button
            class="tb-btn"
            ?data-active=${this._store.inspectMode}
            @click=${this._toggleInspectMode}
            title="Select element"
            aria-label="Select element"
          >
            ${inspectIcon}
          </button>
        </div>

        <div class="tb-section">
          <button class="tb-btn" @click=${this._handleRefresh} title="Refresh" aria-label="Refresh data">
            ${refreshIcon}
          </button>
        </div>

        <div class="tb-section tb-logo">
          ${qwikLogo}
        </div>

        <qwik-tab-bar
          .tabs=${TABS}
          .active=${this._activeTab}
          @tab-change=${this._handleTabChange}
        ></qwik-tab-bar>

        <div
          class="tb-section"
          style="border-left: 1px solid var(--border-color); margin-left: auto"
        >
          <button
            class="tb-btn"
            @click=${this._toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            ${this._renderThemeIcon()}
          </button>
        </div>

        ${
          this._store.containerInfo?.detected
            ? html`<div class="tb-section tb-version">
              ${this._store.containerInfo.version}
            </div>`
            : nothing
        }

      </div>
    `;
  }

  private _renderContent(): TemplateResult {
    if (this._store.needsReload) {
      return html`<div class="loading">
        <div class="reload-msg">
          <p>Page reload required</p>
          <p style="color: var(--text-tertiary)">
            Reload the page so the content script can be injected.
          </p>
        </div>
      </div>`;
    }

    // Show loading overlay WITHOUT destroying tabs so their
    // willUpdate can detect data resets and re-fetch.
    return html`
      ${this._store.isLoading
        ? html`<div class="loading-overlay">
            <div class="spinner"></div>
          </div>`
        : nothing}
      ${this._renderTabs()}
    `;
  }

  private async _handleTabChange(e: CustomEvent) {
    const tab = e.detail as TabId;
    this._activeTab = tab;
    if (!this._loadedTabs.has(tab)) {
      this._tabLoading = true;
      await this._loadTab(tab);
      this._loadedTabs = new Set([...this._loadedTabs, tab]);
      this._tabLoading = false;
    }
  }

  private _loadTab(tab: TabId): Promise<unknown> {
    switch (tab) {
      case 'routes':
        return import('./routes-tab.js');
      case 'assets':
        return import('./assets-tab.js');
      case 'performance':
        return import('./performance-tab.js');
      default:
        return Promise.resolve();
    }
  }

  private _renderTabs() {
    const isDevMode =
      this._store.containerInfo?.renderMode?.includes('dev') ?? false;

    return html`
      ${this._tabLoading ? html`<div class="loading"><div class="spinner"></div></div>` : nothing}

      <div class="tab-pane" ?hidden=${this._activeTab !== 'components'}>
        <qwik-error-boundary label="Components">
          <qwik-components-tab
            .tree=${this._store.componentTree}
            .selectedId=${this._store.inspectedNodeId ?? ''}
            .isDevMode=${isDevMode}
            @node-inspected=${this._handleNodeInspected}
          ></qwik-components-tab>
        </qwik-error-boundary>
      </div>

      ${
        this._loadedTabs.has('routes')
          ? html`
        <div class="tab-pane" ?hidden=${this._activeTab !== 'routes'}>
          <qwik-error-boundary label="Routes">
            <qwik-routes-tab
              .routeInfo=${this._store.routeInfo}
            ></qwik-routes-tab>
          </qwik-error-boundary>
        </div>
      `
          : nothing
      }

      ${
        this._loadedTabs.has('performance')
          ? html`
        <div class="tab-pane" ?hidden=${this._activeTab !== 'performance'}>
          <qwik-error-boundary label="Performance">
            <qwik-performance-tab
              .data=${this._store.resumabilityData}
              @data-fetched=${this._handlePerfDataFetched}
            ></qwik-performance-tab>
          </qwik-error-boundary>
        </div>
      `
          : nothing
      }

      ${
        this._loadedTabs.has('assets')
          ? html`
        <div class="tab-pane" ?hidden=${this._activeTab !== 'assets'}>
          <qwik-error-boundary label="Assets">
            <qwik-assets-tab
              .refetchSignal=${this._store.fetchGeneration}
            ></qwik-assets-tab>
          </qwik-error-boundary>
        </div>
      `
          : nothing
      }
    `;
  }

  /**
   * Called from panel.html when the background port disconnects and
   * a fresh one is created.  Must stay public so the inline script
   * can reach it via `document.querySelector('qwik-devtools-root')._reconnect(port)`.
   */
  _reconnect(port: chrome.runtime.Port) {
    this._store.reconnect(port);
  }

  private _handleNodeInspected(e: CustomEvent) {
    this._store.setInspectedNode(e.detail);
  }

  private _handlePerfDataFetched(e: CustomEvent) {
    this._store.resumabilityData = e.detail;
    this.requestUpdate();
  }


  private _handleRefresh() {
    this._store.fetchAll();
  }

  private _toggleInspectMode() {
    this._store.toggleInspect();
  }

  private _toggleTheme() {
    this._lightMode = !this._lightMode;
    const root = this.ownerDocument.documentElement;
    if (this._lightMode) {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-devtools-root': DevtoolsRoot;
  }
}
