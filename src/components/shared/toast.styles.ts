import { css } from 'lit';

export const styles = css`
  :host {
    position: fixed;
    bottom: 12px;
    right: 12px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 6px;
    pointer-events: none;
  }

  .toast {
    padding: 8px 14px;
    border-radius: 6px;
    font-family: var(--font-sans, system-ui);
    font-size: 12px;
    color: var(--text-primary, #c0caf5);
    pointer-events: auto;
    animation: slide-in 0.2s ease-out;
    cursor: pointer;
    max-width: 320px;
    word-break: break-word;
  }

  .toast[data-variant="error"] {
    background: color-mix(in srgb, #f7768e 20%, var(--bg-primary, #1a1b26));
    border: 1px solid #f7768e;
  }

  .toast[data-variant="warning"] {
    background: color-mix(in srgb, #e0af68 20%, var(--bg-primary, #1a1b26));
    border: 1px solid #e0af68;
  }

  .toast[data-variant="info"] {
    background: color-mix(in srgb, #7aa2f7 20%, var(--bg-primary, #1a1b26));
    border: 1px solid #7aa2f7;
  }

  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
