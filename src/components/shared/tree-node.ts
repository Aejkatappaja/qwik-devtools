import type { CSSResult, TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  HIGHLIGHT_OVERLAY_ID,
  MAX_TREE_DEPTH,
  safeQIdSelector,
  TREE_INDENT_PX,
  VIRTUAL_NODE_TAG,
} from '../../lib/constants.js';
import type { QwikComponentNode } from '../../lib/types.js';
import { expandArrow } from './icons.js';
import { styles } from './tree-node.styles.js';

/**
 * Recursive tree node for the component tree panel. Renders a single
 * node row with expand/collapse, type icon, badges, and highlights
 * the element in the inspected page on hover.
 *
 * @property node - The component node data to render
 * @property selectedId - Id of the currently selected node (for highlighting)
 * @property filter - Active search filter string
 * @property parentColors - Accumulated colors from ancestor nodes (for nesting visuals)
 * @fires node-select - Dispatched with the full node object when clicked
 */
@customElement('qwik-tree-node')
export class TreeNode extends LitElement {
  static override styles: CSSResult = styles;

  @property({ attribute: false }) node!: QwikComponentNode;

  @property({ type: String }) selectedId = '';

  @property({ type: String }) filter = '';

  @property({ attribute: false }) parentColors: string[] = [];

  @property({ attribute: false }) collapsedIds = new Set<string>();

  private get _expanded(): boolean {
    return !this.collapsedIds.has(this.node?.id);
  }

  override render() {
    const n = this.node;
    if (n.depth > MAX_TREE_DEPTH) return nothing;
    const f = this.filter.toLowerCase();

    if (f && !this._matchesFilter(n, f)) return nothing;

    const hasChildren = n.children.length > 0;
    const isSelected = this.selectedId === n.id;
    const isVirtual = n.tagName === VIRTUAL_NODE_TAG;
    const hasContext = n.hasContext;
    const isPlain = !isVirtual && !hasContext;
    const stateCount = n.state.length;
    const isHighlighted =
      f &&
      (n.componentName.toLowerCase().includes(f) ||
        n.tagName.toLowerCase().includes(f));

    const typeIcon = isVirtual
      ? 'component'
      : hasContext
        ? 'element-state'
        : 'element';

    const badge = this._getBadge(n);

    return html`
      <div
        class="node-row"
        tabindex="0"
        role="treeitem"
        aria-expanded=${hasChildren ? String(this._expanded) : nothing}
        aria-selected=${isSelected ? 'true' : 'false'}
        aria-label="${n.componentName} ${n.tagName !== VIRTUAL_NODE_TAG ? n.tagName : ''}"
        ?data-selected=${isSelected}
        ?data-has-context=${hasContext}
        ?data-plain=${isPlain}
        ?data-highlighted=${isHighlighted}
        @click=${this._handleClick}
        @keydown=${this._handleKeydown}
        @mouseenter=${this._handleMouseEnter}
        @mouseleave=${this._clearHighlight}
      >
        <span class="indent" style="width: ${n.depth * TREE_INDENT_PX}px"></span>

        <span
          class="toggle"
          ?data-open=${this._expanded}
          @click=${this._toggleExpand}
          >${hasChildren ? expandArrow : ''}</span
        >

        <span class="type-icon" data-type=${typeIcon} aria-label=${isVirtual ? 'Component' : hasContext ? 'Stateful element' : 'Element'}>
          ${isVirtual ? 'C' : hasContext ? 'S' : 'E'}
        </span>

        ${this._renderNodeContent(n, isVirtual, hasContext)}
        ${
          badge
            ? html`<span class="badge ${badge.cls}">${badge.text}</span>`
            : nothing
        }
        ${
          stateCount > 0
            ? html`<span class="state-count">${stateCount}</span>`
            : nothing
        }
        <span class="id-badge">#${n.id}</span>
        ${
          n.key && n.key.length > 4 && !n.key.includes(':')
            ? html`<span class="key-badge">key='${n.key}'</span>`
            : nothing
        }
      </div>
      ${
        hasChildren && (this._expanded || !!f)
          ? html`<div class="children" role="group">
            ${n.children.map(
              (child) => html`
                <qwik-tree-node
                  .node=${child}
                  .selectedId=${this.selectedId}
                  .filter=${this.filter}
                  .collapsedIds=${this.collapsedIds}
                  .parentColors=${[...this.parentColors, this._getNodeColor(n)]}
                  @node-select=${this._relaySelect}
                ></qwik-tree-node>
              `,
            )}
          </div>`
          : nothing
      }
    `;
  }

  private _renderNodeContent(
    n: QwikComponentNode,
    isVirtual: boolean,
    hasContext: boolean,
  ): TemplateResult {
    if (isVirtual) {
      return html`<span class="component-name" data-virtual
        >${n.componentName}</span
      >`;
    }
    if (hasContext) {
      return html`
        <span class="component-name">${n.componentName}</span>
        <span class="tag">&lt;${n.tagName}&gt;</span>
      `;
    }
    return html`
      <span class="tag"
        >&lt;<span class="tag-name">${n.tagName}</span>&gt;</span
      >
      ${
        n.componentName !== n.tagName
          ? html`<span class="component-name">${n.componentName}</span>`
          : nothing
      }
    `;
  }

  private _matchesFilter(node: QwikComponentNode, f: string): boolean {
    if (!f) return true;
    if (node.componentName.toLowerCase().includes(f)) return true;
    if (node.tagName.toLowerCase().includes(f)) return true;
    if (node.id.toLowerCase().includes(f)) return true;
    return node.children.some((c) => this._matchesFilter(c, f));
  }

  private _getNodeColor(n: QwikComponentNode): string {
    if (n.tagName === VIRTUAL_NODE_TAG) return 'var(--signal-color, #bb9af7)';
    if (n.hasContext) return 'var(--accent, #7aa2f7)';
    return 'var(--element-ref-color, #f7768e)';
  }

  private _getBadge(
    n: QwikComponentNode,
  ): { text: string; cls: string } | null {
    const name = n.componentName.toLowerCase();
    if (name.includes('layout')) return { text: 'layout', cls: 'badge-layout' };
    if (name.includes('route') || name.includes('page'))
      return { text: 'route', cls: 'badge-route' };
    return null;
  }

  private _handleMouseEnter() {
    if (this.node) this._highlightElement(this.node.id);
  }

  /** Adds a highlight overlay on the inspected page element matching this node */
  private _highlightElement(qId: string) {
    try {
      chrome.devtools.inspectedWindow.eval(`
        (function() {
          const el = document.querySelector('${safeQIdSelector(qId)}');
          if (!el) return;
          const existing = document.getElementById('${HIGHLIGHT_OVERLAY_ID}');
          if (existing) existing.remove();
          const rect = el.getBoundingClientRect();
          const overlay = document.createElement('div');
          overlay.id = '${HIGHLIGHT_OVERLAY_ID}';
          overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #7aa2f7;background:rgba(122,162,247,0.08);border-radius:3px;transition:all 0.15s;'
            + 'top:' + rect.top + 'px;left:' + rect.left + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px;';
          document.body.appendChild(overlay);
        })()
      `);
    } catch (err) {
      console.debug('[Qwik DevTools]', err);
    }
  }

  private _clearHighlight = () => {
    try {
      chrome.devtools.inspectedWindow.eval(
        `const el = document.getElementById('${HIGHLIGHT_OVERLAY_ID}'); if (el) el.remove();`,
      );
    } catch (err) {
      console.debug('[Qwik DevTools]', err);
    }
  };

  private _handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        this._handleClick();
        break;
      case ' ':
        e.preventDefault();
        this.dispatchEvent(
          new CustomEvent('node-toggle', {
            detail: { id: this.node.id, expanded: !this._expanded },
            bubbles: true,
            composed: true,
          }),
        );
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (this.node.children.length > 0 && !this._expanded) {
          this.dispatchEvent(
            new CustomEvent('node-toggle', {
              detail: { id: this.node.id, expanded: true },
              bubbles: true,
              composed: true,
            }),
          );
        } else {
          this._focusFirstChild();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (this._expanded && this.node.children.length > 0) {
          this.dispatchEvent(
            new CustomEvent('node-toggle', {
              detail: { id: this.node.id, expanded: false },
              bubbles: true,
              composed: true,
            }),
          );
        } else {
          this._focusParentNode();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        this._focusNextVisible();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._focusPrevVisible();
        break;
      case 'Home':
        e.preventDefault();
        this._focusFirst();
        break;
      case 'End':
        e.preventDefault();
        this._focusLast();
        break;
    }
  }

  /** Focus the first child tree-node's row */
  private _focusFirstChild() {
    const children = this.shadowRoot?.querySelector('.children');
    if (!children) return;
    const firstChild = children.querySelector('qwik-tree-node');
    const row = firstChild?.shadowRoot?.querySelector<HTMLElement>('.node-row');
    row?.focus();
  }

  /** Focus the parent tree-node's row */
  private _focusParentNode() {
    const host = this.getRootNode() as ShadowRoot;
    const parentNode = host?.host;
    if (
      parentNode instanceof HTMLElement &&
      parentNode.tagName === 'QWIK-TREE-NODE'
    ) {
      const row =
        parentNode.shadowRoot?.querySelector<HTMLElement>('.node-row');
      row?.focus();
    }
  }

  /** Focus the next visible node-row in DOM order */
  private _focusNextVisible() {
    const allRows = this._getAllVisibleRows();
    const currentIdx = allRows.indexOf(
      this.shadowRoot?.querySelector('.node-row') as HTMLElement,
    );
    if (currentIdx >= 0 && currentIdx < allRows.length - 1) {
      allRows[currentIdx + 1].focus();
    }
  }

  /** Focus the previous visible node-row in DOM order */
  private _focusPrevVisible() {
    const allRows = this._getAllVisibleRows();
    const currentIdx = allRows.indexOf(
      this.shadowRoot?.querySelector('.node-row') as HTMLElement,
    );
    if (currentIdx > 0) {
      allRows[currentIdx - 1].focus();
    }
  }

  private _focusFirst() {
    const allRows = this._getAllVisibleRows();
    if (allRows.length > 0) allRows[0].focus();
  }

  private _focusLast() {
    const allRows = this._getAllVisibleRows();
    if (allRows.length > 0) allRows[allRows.length - 1].focus();
  }

  /** Collect all visible .node-row elements across shadow DOMs in the tree */
  private _getAllVisibleRows(): HTMLElement[] {
    const treeBody = this._findTreeBody();
    if (!treeBody) return [];
    const rows: HTMLElement[] = [];
    const collect = (root: Element | ShadowRoot) => {
      for (const node of root.querySelectorAll('qwik-tree-node')) {
        if (node.shadowRoot) {
          const row = node.shadowRoot.querySelector<HTMLElement>('.node-row');
          if (row) rows.push(row);
          collect(node.shadowRoot);
        }
      }
    };
    collect(treeBody);
    return rows;
  }

  /** Walk up to find the .tree-body container */
  private _findTreeBody(): Element | null {
    let current: Node | null = this;
    while (current) {
      if (current instanceof ShadowRoot) {
        const body = current.querySelector('.tree-body');
        if (body) return body;
        current = current.host;
      } else if (current instanceof HTMLElement) {
        current = current.getRootNode();
      } else {
        break;
      }
    }
    return null;
  }

  private _toggleExpand(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('node-toggle', {
        detail: { id: this.node.id, expanded: !this._expanded },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleClick() {
    this.dispatchEvent(
      new CustomEvent('node-select', {
        detail: this.node,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _relaySelect(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('node-select', {
        detail: (e as CustomEvent).detail,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-tree-node': TreeNode;
  }
}
