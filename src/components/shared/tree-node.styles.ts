import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    font-family: var(--font-mono, monospace);
    font-size: var(--font-size-sm, 11px);
  }

  .node-row {
    display: flex;
    align-items: stretch;
    gap: 5px;
    padding: 0 8px 0 0;
    cursor: pointer;
    margin: 0 4px 0 0;
    transition: background 0.1s;
    border-radius: 0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0;
    position: relative;
    min-height: 24px;
  }

  .node-row:hover {
    background: var(--bg-hover, #292e42);
  }

  .node-row[data-selected] {
    background: var(--accent-bg, rgba(122, 162, 247, 0.1));
  }

  .node-row[data-selected]::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--accent, #7aa2f7);
  }

  .node-row[data-has-context] {
    padding-top: 3px;
    padding-bottom: 3px;
  }

  .node-row[data-plain] {
    opacity: 0.5;
  }

  .node-row[data-plain]:hover {
    opacity: 1;
  }

  .node-row[data-highlighted] {
    background: color-mix(in srgb, var(--computed-color) 12%, transparent);
  }

  /* Indentation via padding */
  .indent {
    flex-shrink: 0;
  }

  .toggle {
    width: 14px;
    text-align: center;
    color: var(--text-tertiary, #565f89);
    flex-shrink: 0;
    font-size: 9px;
    transition: transform 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle[data-open] {
    transform: rotate(90deg);
  }

  .toggle svg {
    width: 10px;
    height: 10px;
  }

  /* Component type icon */
  .type-icon {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 800;
    line-height: 1;
  }

  .type-icon[data-type="component"] {
    background: color-mix(in srgb, var(--signal-color) 20%, transparent);
    color: var(--signal-color, #bb9af7);
  }

  .type-icon[data-type="element"] {
    background: color-mix(in srgb, var(--element-ref-color) 15%, transparent);
    color: var(--element-ref-color, #f7768e);
  }

  .type-icon[data-type="element-state"] {
    background: color-mix(in srgb, var(--accent) 20%, transparent);
    color: var(--accent, #7aa2f7);
  }

  .component-name {
    color: var(--accent, #7aa2f7);
    font-weight: 600;
  }

  .component-name[data-virtual] {
    color: var(--signal-color, #bb9af7);
  }

  .tag {
    color: var(--text-tertiary, #565f89);
    font-size: 10px;
  }

  .tag-name {
    color: var(--element-ref-color, #f7768e);
  }

  .id-badge {
    color: var(--text-muted, #3b4261);
    font-size: 9px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .key-badge {
    color: var(--text-tertiary, #565f89);
    font-size: 9px;
    flex-shrink: 0;
  }

  .state-count {
    font-size: 9px;
    color: var(--signal-color, #bb9af7);
    background: color-mix(in srgb, var(--signal-color) 12%, transparent);
    padding: 0 4px;
    border-radius: 6px;
    flex-shrink: 0;
    line-height: 14px;
    height: 14px;
    display: inline-flex;
    align-items: center;
  }

  /* Badges */
  .badge {
    font-size: 7px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 0 4px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .badge-route {
    background: color-mix(in srgb, var(--qrl-color) 15%, transparent);
    color: var(--qrl-color);
  }

  .badge-layout {
    background: color-mix(in srgb, var(--computed-color) 15%, transparent);
    color: var(--computed-color);
  }

  /* Edit icon on hover */
  .edit-hint {
    opacity: 0;
    color: var(--text-muted);
    font-size: 10px;
    flex-shrink: 0;
    transition: opacity 0.15s;
    cursor: pointer;
  }

  .node-row:hover .edit-hint {
    opacity: 0.7;
  }

  .edit-hint:hover {
    opacity: 1 !important;
    color: var(--accent);
  }
`;
