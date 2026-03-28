import type { CSSResult, TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  MAX_ROUTE_DEPTH,
  normalizePath,
  ROUTE_INDENT_PX,
} from '../lib/constants.js';
import { PageBridge } from '../lib/page-bridge.js';
import type { QwikRouteInfo } from '../lib/types.js';
import { styles } from './routes-tab.styles.js';
import {
  copyIcon,
  externalLinkIcon,
  fileIcon,
  folderClosedIcon,
  folderOpenIcon,
} from './shared/icons.js';

interface RouteTreeNode {
  segment: string;
  fullPath: string;
  isRoute: boolean;
  isActive: boolean;
  children: RouteTreeNode[];
}

/**
 * Displays the route tree of the inspected Qwik application.
 * Shows active route, supports filtering, expand/collapse, and
 * allows navigating or copying route paths.
 *
 * @property routeInfo - Route detection data from the inspected page
 */
@customElement('qwik-routes-tab')
export class RoutesTab extends LitElement {
  static override styles: CSSResult = styles;

  @property({ attribute: false }) routeInfo: QwikRouteInfo | null = null;

  @state() private _expandedPaths = new Set<string>(['/']);
  @state() private _searchFilter = '';
  @state() private _currentPath = '';

  private _bridge = new PageBridge();
  private _copyFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._copyFeedbackTimeout) {
      clearTimeout(this._copyFeedbackTimeout);
      this._copyFeedbackTimeout = null;
    }
  }

  /** Read current pathname and auto-expand its parent folders */
  override connectedCallback() {
    super.connectedCallback();
    this._bridge
      .getPathname()
      .then((path) => {
        if (path) {
          this._currentPath = path;
          this._expandPathToRoute(path);
        }
      })
      .catch(() => {});
  }

  override render() {
    if (!this.routeInfo) {
      return html`<div class="empty">No route data found.</div>`;
    }

    const { detectedRoutes } = this.routeInfo;
    const activePath = this._currentPath || this.routeInfo.activeRoute || '';
    const tree = this._buildTree(detectedRoutes, activePath);

    return html`
      <div class="content">
        ${
          activePath
            ? html`
              <div class="active-route">
                <span class="active-route-label">Active Route</span>
                <span class="active-route-path">${activePath}</span>
              </div>
            `
            : nothing
        }

        <div class="toolbar">
          <input
            class="search"
            type="text"
            placeholder="Filter routes..."
            aria-label="Filter routes"
            .value=${this._searchFilter}
            @keydown=${this._handleSearchKeydown}
            @input=${this._handleSearchInput}
          />
          <button class="tool-btn" @click=${this._handleExpandAll} title="Expand all">
            \u229E
          </button>
          <button class="tool-btn" @click=${this._collapseAll} title="Collapse all">
            \u229F
          </button>
          <span class="count">${detectedRoutes.length}</span>
        </div>

        <div class="route-tree" role="tree">
          ${tree.map((node) => this._renderTreeNode(node, 0))}
        </div>

      </div>
    `;
  }

  private _renderTreeNode(
    node: RouteTreeNode,
    depth: number,
    isLast = false,
  ): unknown {
    const hasChildren = node.children.length > 0;
    const isExpanded = this._expandedPaths.has(node.fullPath);
    const filter = this._searchFilter.toLowerCase();
    const matchesAny = !filter || this._nodeMatchesFilter(node, filter);

    if (!matchesAny) return nothing;

    const showChildren = hasChildren && (isExpanded || (filter && matchesAny));

    return html`
      <div class="route-row ${node.isActive ? 'active' : ''}"
           role="treeitem" tabindex="0"
           data-path=${node.fullPath}
           data-has-children=${hasChildren ? 'true' : nothing}
           aria-expanded=${hasChildren ? String(isExpanded) : nothing}
           @click=${hasChildren ? this._handleRowClick : undefined}
           @keydown=${this._handleRowKeydown}>
        <span class="tree-indent" style="width: ${depth * ROUTE_INDENT_PX}px">
          ${depth > 0 ? html`<span class="tree-branch">${isLast ? '\u2514' : '\u251C'}\u2500</span>` : nothing}
        </span>
        <span class="route-icon" style="color: ${hasChildren ? 'var(--computed-color)' : 'var(--qrl-color)'}"
              @click=${hasChildren ? this._handleIconClick : undefined}>
          ${this._renderFolderIcon(hasChildren, isExpanded)}
        </span>
        <span class="route-segment" title=${node.fullPath}>${node.segment}</span>
        ${node.isActive ? html`<span class="route-active-badge">active</span>` : nothing}
        ${this._renderRouteActions(node)}
      </div>
      ${
        showChildren
          ? node.children.map((child, i) =>
              this._renderTreeNode(
                child,
                depth + 1,
                i === node.children.length - 1,
              ),
            )
          : nothing
      }
    `;
  }

  private _renderFolderIcon(
    hasChildren: boolean,
    isExpanded: boolean,
  ): TemplateResult {
    if (!hasChildren) {
      return html`${fileIcon}`;
    }
    if (isExpanded) {
      return html`${folderOpenIcon}`;
    }
    return html`${folderClosedIcon}`;
  }

  private _renderRouteActions(
    node: RouteTreeNode,
  ): TemplateResult | typeof nothing {
    if (!node.isRoute) return nothing;
    return html`
      <span class="route-action" data-path=${node.fullPath} @click=${this._handleCopyRoute} title="Copy path">
        ${copyIcon}
      </span>
      <span class="route-action" data-path=${node.fullPath} @click=${this._handleOpenRoute} title="Open in page">
        ${externalLinkIcon}
      </span>
    `;
  }

  /** Converts a flat list of route paths into a nested tree structure */
  private _buildTree(
    routes: string[],
    activeRoute: string | null,
  ): RouteTreeNode[] {
    const root: RouteTreeNode = {
      segment: '/',
      fullPath: '/',
      isRoute: true,
      isActive: activeRoute ? normalizePath(activeRoute) === '/' : false,
      children: [],
    };

    for (const route of routes) {
      if (route === '/') continue;
      const segments = route.split('/').filter(Boolean);
      let current = root;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const fullPath = '/' + segments.slice(0, i + 1).join('/') + '/';
        let child = current.children.find((c) => c.segment === segment);

        if (!child) {
          child = {
            segment,
            fullPath,
            isRoute: i === segments.length - 1,
            isActive: activeRoute
              ? normalizePath(fullPath) === normalizePath(activeRoute)
              : false,
            children: [],
          };
          current.children.push(child);
        }

        if (i === segments.length - 1) {
          child.isRoute = true;
          child.isActive = activeRoute
            ? normalizePath(fullPath) === normalizePath(activeRoute)
            : false;
        }

        current = child;
      }
    }

    const sortTree = (node: RouteTreeNode) => {
      node.children.sort((a, b) => a.segment.localeCompare(b.segment));
      node.children.forEach(sortTree);
    };
    sortTree(root);

    return [root];
  }

  private _handleSearchKeydown(e: Event) {
    e.stopPropagation();
  }

  private _handleSearchInput(e: InputEvent) {
    this._searchFilter = (e.target as HTMLInputElement).value;
  }

  private _handleExpandAll() {
    if (!this.routeInfo) return;
    const activePath = this._currentPath || this.routeInfo.activeRoute || '';
    const tree = this._buildTree(this.routeInfo.detectedRoutes, activePath);
    this._expandAll(tree);
  }

  private _collapseAll() {
    this._expandedPaths = new Set(['/']);
  }

  private _handleRowClick(e: Event) {
    const path = (e.currentTarget as HTMLElement).dataset.path;
    if (path) this._toggleExpand(path);
  }

  private _handleRowKeydown(e: KeyboardEvent) {
    const el = e.currentTarget as HTMLElement;
    const path = el.dataset.path ?? '';
    const node = this._findRouteNode(path);
    if (node) this._handleRouteKeydown(e, node);
  }

  private _handleIconClick(e: Event) {
    e.stopPropagation();
    const row = (e.currentTarget as HTMLElement).closest(
      '.route-row',
    ) as HTMLElement;
    const path = row?.dataset.path;
    if (path) this._toggleExpand(path);
  }

  private _handleCopyRoute(e: Event) {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const path = target.dataset.path;
    if (!path) return;
    navigator.clipboard.writeText(path).catch(() => {});
    target.style.color = 'var(--success)';
    if (this._copyFeedbackTimeout) clearTimeout(this._copyFeedbackTimeout);
    this._copyFeedbackTimeout = setTimeout(() => {
      target.style.color = '';
    }, 600);
  }

  private _handleOpenRoute(e: Event) {
    e.stopPropagation();
    const path = (e.currentTarget as HTMLElement).dataset.path;
    if (path) this._openRoute(path);
  }

  private _openRoute(path: string) {
    chrome.devtools.inspectedWindow.eval(
      `window.location.href = ${JSON.stringify(path)}`,
    );
  }

  /** Expand all parent folders leading to the given route path */
  private _expandPathToRoute(pathname: string) {
    const segments = pathname.split('/').filter(Boolean);
    const next = new Set(this._expandedPaths);
    next.add('/');
    for (let i = 0; i < segments.length; i++) {
      next.add('/' + segments.slice(0, i + 1).join('/') + '/');
    }
    this._expandedPaths = next;
  }

  private _toggleExpand(path: string) {
    const next = new Set(this._expandedPaths);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    this._expandedPaths = next;
  }

  private _expandAll(nodes: RouteTreeNode[]) {
    const paths = new Set<string>();
    const walk = (n: RouteTreeNode, depth: number) => {
      if (depth > MAX_ROUTE_DEPTH) return;
      if (n.children.length > 0) paths.add(n.fullPath);
      for (const c of n.children) walk(c, depth + 1);
    };
    for (const n of nodes) walk(n, 0);
    this._expandedPaths = paths;
  }

  private _handleRouteKeydown(e: KeyboardEvent, node: RouteTreeNode) {
    const rows = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>('.route-row') ?? [],
    );
    const current = e.currentTarget as HTMLElement;
    const idx = rows.indexOf(current);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (idx < rows.length - 1) rows[idx + 1].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (idx > 0) rows[idx - 1].focus();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (
          node.children.length > 0 &&
          !this._expandedPaths.has(node.fullPath)
        ) {
          this._toggleExpand(node.fullPath);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (
          node.children.length > 0 &&
          this._expandedPaths.has(node.fullPath)
        ) {
          this._toggleExpand(node.fullPath);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (node.children.length > 0) this._toggleExpand(node.fullPath);
        break;
      case 'Home':
        e.preventDefault();
        if (rows.length > 0) rows[0].focus();
        break;
      case 'End':
        e.preventDefault();
        if (rows.length > 0) rows[rows.length - 1].focus();
        break;
    }
  }

  private _findRouteNode(path: string): RouteTreeNode | null {
    if (!this.routeInfo) return null;
    const activePath = this._currentPath || this.routeInfo.activeRoute || '';
    const tree = this._buildTree(this.routeInfo.detectedRoutes, activePath);
    const walk = (nodes: RouteTreeNode[]): RouteTreeNode | null => {
      for (const n of nodes) {
        if (n.fullPath === path) return n;
        const found = walk(n.children);
        if (found) return found;
      }
      return null;
    };
    return walk(tree);
  }

  private _nodeMatchesFilter(
    node: RouteTreeNode,
    filter: string,
    depth = 0,
  ): boolean {
    if (depth > MAX_ROUTE_DEPTH) return false;
    if (node.fullPath.toLowerCase().includes(filter)) return true;
    return node.children.some((c) =>
      this._nodeMatchesFilter(c, filter, depth + 1),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-routes-tab': RoutesTab;
  }
}
