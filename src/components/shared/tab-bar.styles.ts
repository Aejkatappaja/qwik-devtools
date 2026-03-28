import { css } from 'lit';

export const styles = css`
  :host {
    display: flex;
    align-items: stretch;
    height: 100%;
    flex: 1;
  }

  .tabs {
    display: flex;
    height: 100%;
    width: 100%;
  }

  .tab {
    flex: 1;
    height: 100%;
    padding: 0 14px;
    border: none;
    border-right: 1px solid var(--border-color, #292e42);
    background: none;
    color: var(--text-tertiary, #565f89);
    font-family: var(--font-sans, sans-serif);
    font-size: var(--font-size-sm, 11px);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s;
    white-space: nowrap;
  }

  .tab:last-child {
    border-right: none;
  }

  .tab:hover {
    color: var(--text-secondary, #a9b1d6);
    background: var(--bg-hover, #292e42);
  }

  .tab[data-active] {
    color: var(--accent, #7aa2f7);
    background: var(--accent-bg, rgba(122, 162, 247, 0.1));
  }
`;
