import { css } from 'lit';

export const detailStyles = css`
  :host {
    display: block;
    font-family: var(--font-sans);
  }

  .detail-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted, #3b4261);
    font-size: var(--font-size-md, 13px);
  }

  .detail-header {
    padding: var(--space-lg, 12px) var(--space-xl, 16px);
    border-bottom: 1px solid var(--border-color, #292e42);
    background: var(--bg-primary, #1a1b26);
  }

  .detail-title {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 4px;
  }

  .detail-tag {
    color: var(--element-ref-color, #f7768e);
    font-family: var(--font-mono);
    font-size: var(--font-size-md, 13px);
  }

  .detail-name {
    color: var(--accent, #7aa2f7);
    font-weight: 700;
    font-size: var(--font-size-lg, 14px);
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    margin-left: 8px;
    flex-shrink: 0;
  }

  .copy-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .copy-btn svg {
    width: 14px;
    height: 14px;
  }

  .detail-breadcrumb {
    color: var(--text-muted, #3b4261);
  }

  .breadcrumb-path {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    margin-bottom: 4px;
  }

  .crumb {
    color: var(--text-muted);
    font-size: 11px;
  }

  .crumb-sep {
    color: var(--text-muted);
    opacity: 0.4;
    font-size: 11px;
    margin: 0 1px;
  }

  .breadcrumb-meta {
    color: var(--text-muted);
    font-size: 10px;
    font-family: var(--font-mono);
  }

  .detail-body {
    padding: var(--space-lg, 12px) 0;
  }

  /* Collapsible sections */
  .section {
    border-bottom: 1px solid var(--border-color, #292e42);
  }

  .section:last-child {
    border-bottom: none;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px var(--space-xl, 16px);
    cursor: pointer;
    font-size: var(--font-size-sm, 11px);
    font-weight: 600;
    color: var(--text-secondary, #a9b1d6);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    user-select: none;
  }

  .section-header:hover {
    background: var(--bg-hover, #292e42);
  }

  .section-arrow {
    font-size: 9px;
    color: var(--text-tertiary);
    transition: transform 0.15s;
  }

  .section-arrow[data-open] {
    transform: rotate(90deg);
  }

  .section-count {
    font-weight: 400;
    color: var(--text-muted, #3b4261);
    font-size: var(--font-size-xs, 10px);
  }

  .section-body {
    padding: 2px var(--space-xl, 16px) var(--space-md, 8px);
  }

  /* State entries */
  .state-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-md, 8px);
    padding: 3px 0;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 11px);
  }

  .state-key {
    color: var(--signal-color, #bb9af7);
    flex-shrink: 0;
  }

  .state-colon {
    color: var(--text-muted);
  }

  .state-value {
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }

  .state-value:hover {
    white-space: normal;
    word-break: break-all;
    max-width: none;
  }

  .state-value.string { color: var(--string-color, #9ece6a); }
  .state-value.number { color: var(--number-color, #ff9e64); }
  .state-value.boolean { color: var(--boolean-color, #e0af68); }
  .state-value.null { color: var(--null-color, #565f89); font-style: italic; }

  .state-type-tag {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 1px 4px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  /* Live entries */
  .live-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-md, 8px);
    padding: 3px 0;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 11px);
  }

  .live-key {
    color: var(--live-color, #7dcfff);
    flex-shrink: 0;
  }

  .live-value {
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }

  .live-value:hover {
    white-space: normal;
    word-break: break-all;
    max-width: none;
  }

  .live-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--success, #9ece6a);
    animation: pulse 1.5s infinite;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* Meta and actions */
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: var(--space-md, 8px) var(--space-xl, 16px);
  }

  .meta-tag {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs, 10px);
    color: var(--text-muted, #3b4261);
    background: var(--bg-primary, #1a1b26);
    padding: 2px 6px;
    border-radius: var(--radius-sm, 4px);
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

  .attr-row {
    display: flex;
    gap: var(--space-md, 8px);
    padding: 2px 0;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 11px);
  }

  .attr-key { color: var(--signal-color, #bb9af7); flex-shrink: 0; }
  .attr-val {
    color: var(--string-color, #9ece6a);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }

  .attr-val:hover {
    white-space: normal;
    word-break: break-all;
    max-width: none;
  }

  /* Children list */
  .child-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 4px;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 11px);
    transition: background 0.1s;
  }

  .child-row:hover {
    background: var(--bg-hover);
  }

  .child-icon {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .child-icon[data-type="C"] {
    background: color-mix(in srgb, var(--signal-color) 20%, transparent);
    color: var(--signal-color);
  }

  .child-icon[data-type="S"] {
    background: color-mix(in srgb, var(--accent) 20%, transparent);
    color: var(--accent);
  }

  .child-icon[data-type="E"] {
    background: color-mix(in srgb, var(--element-ref-color) 15%, transparent);
    color: var(--element-ref-color);
  }

  .child-name {
    color: var(--accent);
    font-weight: 600;
  }

  .child-tag {
    color: var(--text-tertiary);
    font-size: 10px;
  }

  .child-id {
    color: var(--text-muted);
    font-size: 9px;
    margin-left: auto;
  }

  .no-data {
    color: var(--text-muted, #3b4261);
    font-style: italic;
    font-size: var(--font-size-sm, 11px);
  }

  /* Editable values */
  .editable {
    cursor: pointer;
    border-radius: 2px;
    padding: 0 2px;
    transition: background 0.1s;
  }

  .editable:hover {
    background: var(--bg-hover, #292e42);
    outline: 1px dashed var(--text-muted, #3b4261);
  }

  .edit-input {
    background: var(--bg-input, #1f2335);
    color: var(--text-primary);
    border: 1px solid var(--accent, #7aa2f7);
    border-radius: 3px;
    padding: 1px 4px;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 11px);
    outline: none;
    width: 100%;
    min-width: 60px;
  }

  .edit-hint {
    font-size: 9px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .edit-success {
    animation: flash-success 0.5s;
  }

  @keyframes flash-success {
    0% { background: rgba(158, 206, 106, 0.3); }
    100% { background: transparent; }
  }
`;
