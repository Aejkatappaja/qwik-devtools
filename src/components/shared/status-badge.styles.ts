import { css } from 'lit';

export const styles = css`
  :host { display: inline-flex; }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--radius-full, 9999px);
    font-family: var(--font-sans);
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .dot { width: 5px; height: 5px; border-radius: 50%; }
  .badge[data-variant="success"] { background: rgba(158, 206, 106, 0.1); color: var(--success, #9ece6a); }
  .badge[data-variant="success"] .dot { background: var(--success, #9ece6a); }
  .badge[data-variant="error"] { background: rgba(247, 118, 142, 0.1); color: var(--error, #f7768e); }
  .badge[data-variant="error"] .dot { background: var(--error, #f7768e); }
  .badge[data-variant="warning"] { background: rgba(224, 175, 104, 0.1); color: var(--warning, #e0af68); }
  .badge[data-variant="warning"] .dot { background: var(--warning, #e0af68); }
  .badge[data-variant="info"] { background: rgba(122, 162, 247, 0.1); color: var(--info, #7aa2f7); }
  .badge[data-variant="info"] .dot { background: var(--info, #7aa2f7); }
`;
