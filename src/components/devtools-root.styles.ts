import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    height: 100vh;
    overflow: hidden;
    color: var(--text-primary);
    background: var(--bg-primary);
  }

  .container {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
  }

  /* ===== Toolbar ===== */
  .toolbar {
    display: flex;
    align-items: stretch;
    height: 48px;
    background: var(--bg-header, #16161e);
    border-bottom: 1px solid var(--border-color, #292e42);
  }

  /* Each toolbar section is separated by a 1px border */
  .tb-section {
    display: flex;
    align-items: center;
    border-right: 1px solid var(--border-color);
  }

  .tb-section:last-child {
    border-right: none;
  }

  /* Full-height clickable button */
  .tb-btn {
    height: 100%;
    padding: 0 14px;
    border: none;
    background: none;
    color: var(--text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.12s;
    font-family: var(--font-sans);
    font-size: var(--font-size-sm, 11px);
    white-space: nowrap;
  }

  .tb-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .tb-btn[data-active] {
    color: var(--accent);
    background: var(--accent-bg);
  }

  .tb-btn svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .tb-btn .label {
    font-weight: 500;
  }

  /* Logo section */
  .tb-logo {
    padding: 0 12px;
  }

  .tb-logo svg {
    width: 20px;
    height: 20px;
  }

  /* Version in right section */
  .tb-version {
    padding: 0 12px;
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
  }

  /* ===== Content ===== */
  .content {
    overflow: auto;
    position: relative;
  }

  .tab-pane {
    height: 100%;
    overflow: hidden;
  }

  .tab-pane[hidden] {
    display: none;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: var(--space-md, 8px);
    color: var(--text-tertiary);
    font-family: var(--font-sans);
    font-size: var(--font-size-md, 13px);
  }

  .loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--bg-primary, #1a1b26) 80%, transparent);
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .reload-msg {
    text-align: center;
  }

  .reload-msg p {
    margin: 4px 0;
  }

  .reload-msg p:first-child {
    font-weight: 600;
    color: var(--text-secondary);
  }
`;
