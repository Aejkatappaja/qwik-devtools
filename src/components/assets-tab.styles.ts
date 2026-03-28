import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    height: 100%;
    font-family: var(--font-sans);
    overflow-y: auto;
  }

  .content { padding: var(--space-xl, 16px); }

  .loading, .empty {
    text-align: center;
    padding: 64px 16px;
    color: var(--text-tertiary);
  }

  .empty button {
    margin-top: var(--space-md, 8px);
    padding: 4px 10px;
    border: 1px solid var(--border-color, #292e42);
    border-radius: var(--radius-sm, 4px);
    background: var(--bg-primary, #1a1b26);
    color: var(--text-secondary);
    font-size: var(--font-size-sm, 11px);
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 0.15s;
  }

  .empty button:hover {
    background: var(--accent-bg);
    color: var(--accent);
    border-color: var(--accent-border);
  }

  .assets-header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 4px 8px;
  }

  .last-fetched {
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: none;
    color: var(--text-tertiary);
    font-size: 11px;
    font-family: var(--font-sans);
    cursor: pointer;
  }

  .refresh-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .section-title {
    font-size: var(--font-size-sm, 11px);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: var(--space-xl, 16px) 0 var(--space-md, 8px);
  }

  .asset-row {
    display: flex;
    align-items: center;
    gap: var(--space-md, 8px);
    padding: 4px var(--space-md, 8px);
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 11px);
    border-radius: var(--radius-sm, 4px);
  }

  .asset-row:hover { background: var(--bg-hover); }

  .asset-url {
    color: var(--accent);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .asset-size {
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .asset-type {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 1px 5px;
    border-radius: 3px;
    flex-shrink: 0;
    background: var(--bg-badge);
    color: var(--text-secondary);
  }

  .asset-dims {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs, 10px);
    color: var(--text-tertiary);
    flex-shrink: 0;
  }
`;
