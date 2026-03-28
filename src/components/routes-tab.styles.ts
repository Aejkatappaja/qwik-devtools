import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    height: 100%;
    font-family: var(--font-sans);
    overflow-y: auto;
  }

  .empty {
    text-align: center;
    padding: 64px 16px;
    color: var(--text-tertiary);
  }

  .content { padding: var(--space-xl, 16px); }

  /* Active route banner */
  .active-route {
    display: flex;
    align-items: center;
    gap: var(--space-md, 8px);
    padding: var(--space-lg, 12px) var(--space-xl, 16px);
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-md, 6px);
    margin-bottom: var(--space-xl, 16px);
  }

  .active-route-label {
    font-size: var(--font-size-xs, 10px);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  .active-route-path {
    font-family: var(--font-mono);
    font-size: var(--font-size-lg, 14px);
    font-weight: 700;
    color: var(--accent);
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-md, 8px);
    margin-bottom: var(--space-md, 8px);
  }

  .search {
    flex: 1;
    padding: 5px 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm, 4px);
    background: var(--bg-input);
    color: var(--text-primary);
    font-size: var(--font-size-sm, 11px);
    font-family: var(--font-sans);
    outline: none;
  }

  .search::placeholder { color: var(--text-muted); }
  .search:focus { border-color: var(--accent); }

  .tool-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm, 4px);
    background: none;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tool-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .count {
    color: var(--text-muted);
    font-size: var(--font-size-xs, 10px);
    flex-shrink: 0;
  }

  /* Route tree */
  .route-tree {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md, 6px);
    overflow: hidden;
  }

  .route-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px 4px 8px;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 11px);
    transition: background 0.1s;
    min-height: 28px;
  }

  .route-row:last-child { border-bottom: none; }
  .route-row:hover { background: var(--bg-hover); cursor: pointer; }

  .route-row.active {
    background: var(--accent-bg);
  }

  .tree-indent {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    font-family: var(--font-mono);
    white-space: pre;
  }

  .tree-branch {
    color: var(--border-color);
    font-size: var(--font-size-sm, 11px);
    line-height: 1;
  }

  .route-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .route-icon svg {
    width: 15px;
    height: 15px;
  }

  .route-segment {
    color: var(--text-primary);
    flex: 1;
  }

  .route-active-badge {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0 5px;
    line-height: 14px;
    height: 14px;
    border-radius: var(--radius-full, 9999px);
    background: color-mix(in srgb, var(--success) 15%, transparent);
    color: var(--success);
    flex-shrink: 0;
  }

  .route-action {
    opacity: 0;
    color: var(--text-tertiary);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.1s;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm, 4px);
  }

  .route-action:hover {
    background: var(--bg-hover);
    color: var(--accent);
  }

  .route-action svg {
    width: 14px;
    height: 14px;
  }

  .route-row:hover .route-action { opacity: 0.7; }
  .route-action:hover { opacity: 1 !important; }

  /* Section headers */
  .section-title {
    font-size: var(--font-size-sm, 11px);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: var(--space-xl, 16px) 0 var(--space-md, 8px);
  }

`;
