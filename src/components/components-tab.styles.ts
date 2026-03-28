import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    height: 100%;
    font-family: var(--font-sans);
  }

  .partial-banner {
    padding: 6px 12px;
    background: color-mix(in srgb, #e0af68 15%, var(--bg-primary, #1a1b26));
    border-bottom: 1px solid #e0af68;
    color: #e0af68;
    font-size: 11px;
    text-align: center;
  }

  .empty {
    text-align: center;
    padding: 64px 16px;
    color: var(--text-tertiary);
    font-size: var(--font-size-md, 13px);
  }

  .layout {
    display: grid;
    grid-template-columns: 1fr 4px var(--detail-width, 340px);
    height: 100%;
  }

  /* ===== Tree Panel (left) ===== */
  .tree-panel {
    overflow-y: auto;
  }

  /* ===== Resizable divider ===== */
  .divider {
    background: var(--border-color, #292e42);
    cursor: col-resize;
    transition: background 0.15s;
    position: relative;
  }

  .divider:hover,
  .divider[data-dragging] {
    background: var(--accent, #7aa2f7);
  }

  .divider::before {
    content: '';
    position: absolute;
    left: -3px;
    right: -3px;
    top: 0;
    bottom: 0;
  }

  .tree-header {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--bg-header, #16161e);
    border-bottom: 1px solid var(--border-color, #292e42);
    display: flex;
    align-items: center;
  }

  .search {
    flex: 1;
    height: 40px;
    padding: 0 14px;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-md, 13px);
    font-family: var(--font-sans);
    outline: none;
  }

  .search::placeholder {
    color: var(--text-muted, #3b4261);
  }

  .count {
    font-size: var(--font-size-xs, 10px);
    padding-right: 14px;
    color: var(--text-muted, #3b4261);
    white-space: nowrap;
  }

  .tree-actions {
    display: flex;
    align-items: center;
    padding-left: 8px;
    gap: 2px;
  }

  .tree-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 0;
  }

  .tree-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .tree-btn svg {
    width: 14px;
    height: 14px;
  }

  .tree-body {
    padding: var(--space-md, 8px) 0;
  }

  /* ===== Detail Panel (right) ===== */
  .detail-panel {
    overflow-y: auto;
    background: var(--bg-secondary, #1f2335);
  }
`;
