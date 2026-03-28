import { css } from 'lit';

export const actionStyles = css`
  :host {
    display: block;
  }

  .action-btn {
    margin: 0 var(--space-xl, 16px) var(--space-md, 8px);
    padding: 4px 10px;
    border: 1px solid var(--border-color, #292e42);
    border-radius: var(--radius-sm, 4px);
    background: var(--bg-primary, #1a1b26);
    color: var(--text-tertiary, #565f89);
    font-size: var(--font-size-xs, 10px);
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-btn:hover {
    background: var(--accent-bg);
    color: var(--accent);
    border-color: var(--accent-border);
  }
`;
