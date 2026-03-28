import { css } from 'lit';

export const liveEditorStyles = css`
  :host {
    display: block;
  }

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
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  .state-type-tag {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 1px 4px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .state-colon {
    color: var(--text-muted);
  }

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
`;
