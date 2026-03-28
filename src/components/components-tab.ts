import type { CSSResult } from 'lit';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  DETAIL_WIDTH_DEFAULT,
  DETAIL_WIDTH_MAX,
  DETAIL_WIDTH_MIN,
  TREE_ROW_HEIGHT,
  VIRTUAL_SCROLL_OVERSCAN,
  VIRTUAL_SCROLL_THRESHOLD,
} from '../lib/constants.js';
import type { QwikComponentNode } from '../lib/types.js';
import { collapseAllIcon, expandAllIcon } from './shared/icons.js';
import { styles } from './components-tab.styles.js';
import './shared/tree-node.js';
import './detail-panel.js';

/**
 * Component tree inspector tab. Displays a filterable tree of Qwik
 * components on the left and a detail panel on the right.
 *
 * @property tree - The full component tree array from the inspected page
 * @property selectedId - Currently selected node id (set externally via element picker)
 * @property isDevMode - Whether the inspected app is running in dev mode
 * @fires node-inspected - Dispatched with the node id when the user selects a component
 */
@customElement('qwik-components-tab')
export class ComponentsTab extends LitElement {
  static override styles: CSSResult = styles;

  @property({ attribute: false }) tree: QwikComponentNode[] = [];
  @property({ type: String }) selectedId = '';
  @property({ type: Boolean }) isDevMode = false;

  @state() private _selectedNode: QwikComponentNode | null = null;
  @state() private _searchFilter = '';
  @state() private _detailWidth = DETAIL_WIDTH_DEFAULT;
  @state() private _collapsedIds = new Set<string>();
  @state() private _scrollTop = 0;
  @state() private _viewportHeight = 600;

  private _dragging = false;
  private _dragCleanup: (() => void) | null = null;

  override updated(changed: Map<string, unknown>) {
    if (changed.has('selectedId') && this.selectedId) {
      const found = this._findNodeById(this.tree, this.selectedId);
      if (found) {
        this._selectedNode = found;
        this._scrollToSelected();
      }
    }
  }

  override render() {
    if (this.tree.length === 0) {
      return html`<div class="empty">
        No component tree found.<br />Navigate to a Qwik application.
      </div>`;
    }

    return html`
      <div class="layout" style="--detail-width: ${this._detailWidth}px">
        <div class="tree-panel">
          <div class="tree-header">
            <div class="tree-actions">
              <button class="tree-btn" @click=${this._expandAll} title="Expand all" aria-label="Expand all">${expandAllIcon}</button>
              <button class="tree-btn" @click=${this._collapseAll} title="Collapse all" aria-label="Collapse all">${collapseAllIcon}</button>
            </div>
            <input
              class="search"
              type="text"
              aria-label="Search components"
              placeholder="Search components..."
              .value=${this._searchFilter}
              @keydown=${this._handleSearchKeydown}
              @input=${this._handleSearchInput}
            />
            <span class="count">${this._countNodes(this.tree)}</span>
          </div>
          <div class="tree-body" role="tree" @scroll=${this._handleTreeScroll} @node-toggle=${this._handleNodeToggle}>
            ${this._renderTree()}
          </div>
        </div>
        <div
          class="divider"
          ?data-dragging=${this._dragging}
          @mousedown=${this._startDrag}
        ></div>
        <div class="detail-panel">
          <qwik-detail-panel
            .node=${this._selectedNode}
            .breadcrumb=${this._selectedNode ? this._buildBreadcrumb(this.tree, this._selectedNode.id) : []}
            .isDevMode=${this.isDevMode}
            @child-select=${this._handleNodeSelectEvent}
          ></qwik-detail-panel>
        </div>
      </div>
    `;
  }

  private _renderTree() {
    const totalCount = this._countNodes(this.tree);
    const useVirtual =
      totalCount > VIRTUAL_SCROLL_THRESHOLD && !this._searchFilter;

    if (!useVirtual) {
      return this.tree.map(
        (node) => html`
          <qwik-tree-node
            .node=${node}
            .selectedId=${this._selectedNode?.id ?? ''}
            .filter=${this._searchFilter}
            .collapsedIds=${this._collapsedIds}
            @node-select=${this._handleNodeSelectEvent}
          ></qwik-tree-node>
        `,
      );
    }

    // Flatten visible nodes (expanded only) for virtual scroll
    const flat = this._flattenVisible(this.tree);
    const totalHeight = flat.length * TREE_ROW_HEIGHT;
    const startIdx = Math.max(
      0,
      Math.floor(this._scrollTop / TREE_ROW_HEIGHT) - VIRTUAL_SCROLL_OVERSCAN,
    );
    const endIdx = Math.min(
      flat.length,
      Math.ceil((this._scrollTop + this._viewportHeight) / TREE_ROW_HEIGHT) +
        VIRTUAL_SCROLL_OVERSCAN,
    );
    const topPad = startIdx * TREE_ROW_HEIGHT;

    return html`
      <div style="height:${totalHeight}px;position:relative">
        <div style="transform:translateY(${topPad}px)">
          ${flat.slice(startIdx, endIdx).map(
            (node) => html`
              <qwik-tree-node
                .node=${node}
                .selectedId=${this._selectedNode?.id ?? ''}
                .filter=${''}
                .collapsedIds=${this._collapsedIds}
                @node-select=${this._handleNodeSelectEvent}
              ></qwik-tree-node>
            `,
          )}
        </div>
      </div>
    `;
  }

  private _flattenVisible(nodes: QwikComponentNode[]): QwikComponentNode[] {
    const result: QwikComponentNode[] = [];
    const walk = (list: QwikComponentNode[]) => {
      for (const node of list) {
        result.push(node);
        if (node.children.length > 0 && !this._collapsedIds.has(node.id)) {
          walk(node.children);
        }
      }
    };
    walk(nodes);
    return result;
  }

  private _handleNodeToggle(e: CustomEvent<{ id: string; expanded: boolean }>) {
    const { id, expanded } = e.detail;
    const next = new Set(this._collapsedIds);
    if (expanded) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this._collapsedIds = next;
  }

  private _handleTreeScroll(e: Event) {
    const target = e.target as HTMLElement;
    this._scrollTop = target.scrollTop;
    if (this._viewportHeight !== target.clientHeight) {
      this._viewportHeight = target.clientHeight;
    }
  }

  private _handleSearchKeydown(e: Event) {
    e.stopPropagation();
  }

  private _handleSearchInput(e: InputEvent) {
    this._searchFilter = (e.target as HTMLInputElement).value;
  }

  private _expandAll() {
    this._collapsedIds = new Set();
  }

  private _collapseAll() {
    const allIds = this._collectAllIds(this.tree);
    this._collapsedIds = new Set(allIds);
  }

  private _collectAllIds(nodes: QwikComponentNode[]): string[] {
    const ids: string[] = [];
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children.length > 0) {
        ids.push(...this._collectAllIds(node.children));
      }
    }
    return ids;
  }

  private _handleNodeSelectEvent(e: CustomEvent) {
    this._handleNodeSelect(e.detail);
  }

  private _handleNodeSelect(node: QwikComponentNode) {
    this._selectedNode = node;
    this.dispatchEvent(
      new CustomEvent('node-inspected', {
        detail: node.id,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _findNodeById(
    nodes: QwikComponentNode[],
    id: string,
  ): QwikComponentNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = this._findNodeById(node.children, id);
      if (found) return found;
    }
    return null;
  }

  private _buildBreadcrumb(nodes: QwikComponentNode[], targetId: string): string[] {
    for (const node of nodes) {
      if (node.id === targetId) return [node.componentName];
      const childPath = this._buildBreadcrumb(node.children, targetId);
      if (childPath.length > 0) return [node.componentName, ...childPath];
    }
    return [];
  }

  private _countNodes(nodes: QwikComponentNode[]): number {
    return nodes.reduce((acc, n) => acc + 1 + this._countNodes(n.children), 0);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._dragCleanup?.();
  }

  private _startDrag = (e: MouseEvent) => {
    e.preventDefault();
    this._dragging = true;
    const startX = e.clientX;
    const startWidth = this._detailWidth;

    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      this._detailWidth = Math.max(
        DETAIL_WIDTH_MIN,
        Math.min(DETAIL_WIDTH_MAX, startWidth + delta),
      );
    };

    const cleanup = () => {
      this._dragging = false;
      this._dragCleanup = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', cleanup);
    };

    this._dragCleanup = cleanup;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', cleanup);
  };

  private async _scrollToSelected() {
    await this.updateComplete;
    await new Promise((r) => requestAnimationFrame(r));
    this._doScrollToSelected();
  }

  private _doScrollToSelected() {
    const treePanel = this.shadowRoot?.querySelector('.tree-panel');
    if (!treePanel) return;

    const findSelected = (root: Element | ShadowRoot): Element | null => {
      const el = root.querySelector('[data-selected]');
      if (el) return el;
      for (const node of root.querySelectorAll('qwik-tree-node')) {
        if (node.shadowRoot) {
          const found = findSelected(node.shadowRoot);
          if (found) return found;
        }
      }
      return null;
    };

    if (!this.shadowRoot) return;
    const selected = findSelected(this.shadowRoot);
    if (selected) {
      selected.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-components-tab': ComponentsTab;
  }
}
