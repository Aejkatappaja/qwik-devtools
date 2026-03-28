import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    font-family: var(--font-mono, monospace);
    font-size: var(--font-size-sm, 11px);
    line-height: 1.6;
  }
  .node { padding-left: 14px; }
  .node-root { padding-left: 0; }
  .key { color: var(--signal-color, #bb9af7); }
  .colon { color: var(--text-muted, #3b4261); margin: 0 4px; }
  .string { color: var(--string-color, #9ece6a); }
  .number { color: var(--number-color, #ff9e64); }
  .boolean { color: var(--boolean-color, #e0af68); }
  .null { color: var(--null-color, #565f89); font-style: italic; }
  .toggle {
    cursor: pointer;
    user-select: none;
    display: inline-block;
    width: 12px;
    text-align: center;
    color: var(--text-tertiary, #565f89);
    font-size: 9px;
    transition: transform 0.15s;
  }
  .toggle:hover { color: var(--accent, #7aa2f7); }
  .toggle[data-open] { transform: rotate(90deg); }
  .bracket { color: var(--text-muted, #3b4261); }
  .preview { color: var(--text-muted, #3b4261); font-style: italic; }
  .line { display: flex; align-items: baseline; padding: 1px 0; border-radius: 2px; }
  .line:hover { background: var(--bg-hover, #292e42); }
`;
