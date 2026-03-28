import { css } from 'lit';

export const styles = css`
  :host {
    display: contents;
  }

  .error-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    padding: 24px;
    text-align: center;
    color: var(--text-tertiary, #565f89);
    font-family: var(--font-sans, system-ui);
  }

  .error-icon {
    font-size: 32px;
    opacity: 0.5;
  }

  .error-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary, #a9b1d6);
  }

  .error-message {
    font-size: 12px;
    max-width: 400px;
    word-break: break-word;
    color: var(--text-muted, #565f89);
  }

  .retry-btn {
    padding: 6px 16px;
    border: 1px solid var(--border-color, #292e42);
    border-radius: 4px;
    background: var(--bg-primary, #1a1b26);
    color: var(--accent, #7aa2f7);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .retry-btn:hover {
    background: var(--accent-bg);
    border-color: var(--accent);
  }
`;
