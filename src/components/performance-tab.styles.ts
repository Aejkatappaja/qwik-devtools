import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    height: 100%;
    font-family: var(--font-sans);
    overflow-y: auto;
  }

  .content { padding: var(--space-xl, 16px); }
  .loading, .empty {
    text-align: center;
    padding: 64px 16px;
    color: var(--text-tertiary);
  }

  .empty button {
    margin-top: var(--space-md, 8px);
    padding: 4px 10px;
    border: 1px solid var(--border-color, #292e42);
    border-radius: var(--radius-sm, 4px);
    background: var(--bg-primary, #1a1b26);
    color: var(--text-secondary);
    font-size: var(--font-size-sm, 11px);
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 0.15s;
  }

  .empty button:hover {
    background: var(--accent-bg);
    color: var(--accent);
    border-color: var(--accent-border);
  }

  /* Score hero */
  .score-hero {
    display: flex;
    align-items: center;
    gap: var(--space-xl, 16px);
    padding: var(--space-xl, 16px);
    background: var(--bg-card, #1f2335);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg, 8px);
    margin-bottom: var(--space-xl, 16px);
  }

  .score-ring {
    position: relative;
    width: 80px;
    height: 80px;
    flex-shrink: 0;
  }

  .score-ring svg {
    width: 80px;
    height: 80px;
    transform: rotate(-90deg);
  }

  .score-ring-bg {
    fill: none;
    stroke: var(--border-color);
    stroke-width: 6;
  }

  .score-ring-fill {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.5s;
  }

  .score-number {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 20px;
    font-weight: 800;
  }

  .score-info h3 {
    margin: 0 0 4px;
    font-size: var(--font-size-lg, 14px);
    color: var(--text-primary);
  }

  .score-info p {
    margin: 0;
    font-size: var(--font-size-sm, 11px);
    color: var(--text-tertiary);
    line-height: 1.5;
  }

  /* Stats grid */
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-md, 8px);
    margin-bottom: var(--space-xl, 16px);
  }

  .stat-card {
    background: var(--bg-card, #1f2335);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md, 6px);
    padding: var(--space-lg, 12px);
  }

  .stat-value {
    font-size: var(--font-size-xl, 16px);
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--accent);
  }

  .stat-value.green { color: var(--success); }
  .stat-value.orange { color: var(--warning); }
  .stat-value.red { color: var(--error); }
  .stat-value.purple { color: var(--signal-color); }

  .stat-label {
    font-size: var(--font-size-xs, 10px);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }

  /* Section */
  .section-title {
    font-size: var(--font-size-sm, 11px);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: var(--space-xl, 16px) 0 var(--space-md, 8px);
  }

  /* Bar chart */
  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bar-row {
    display: flex;
    align-items: center;
    gap: var(--space-md, 8px);
    font-size: var(--font-size-sm, 11px);
  }

  .bar-label {
    width: 70px;
    flex-shrink: 0;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    text-align: right;
  }

  .bar-track {
    flex: 1;
    height: 16px;
    background: var(--bg-primary);
    border-radius: 3px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 3px;
    display: flex;
    align-items: center;
    padding-left: 6px;
    font-size: 9px;
    font-weight: 600;
    color: white;
    min-width: fit-content;
    transition: width 0.3s;
  }

  .bar-count {
    width: 40px;
    flex-shrink: 0;
    text-align: right;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs, 10px);
  }

  /* Top objects */
  .top-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .top-row {
    display: flex;
    align-items: center;
    gap: var(--space-md, 8px);
    padding: 4px var(--space-md, 8px);
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 11px);
    border-radius: var(--radius-sm, 4px);
  }

  .top-row:hover { background: var(--bg-hover); }

  .top-index { color: var(--text-muted); width: 30px; flex-shrink: 0; }
  .top-type { color: var(--signal-color); flex-shrink: 0; width: 50px; }
  .top-preview {
    color: var(--text-secondary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-xs, 10px);
  }
  .top-preview:hover {
    white-space: normal;
    word-break: break-all;
  }
  .top-size { color: var(--text-tertiary); flex-shrink: 0; }

  /* Prefetch bar */
  .prefetch-bar {
    height: 24px;
    background: var(--bg-primary);
    border-radius: var(--radius-sm, 4px);
    overflow: hidden;
    display: flex;
    margin-bottom: var(--space-md, 8px);
  }

  .prefetch-loaded {
    background: var(--success);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: var(--bg-primary);
    transition: width 0.3s;
  }

  .prefetch-pending {
    background: var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: var(--text-tertiary);
    flex: 1;
  }

  .refresh-inline {
    border: none;
    background: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-sm, 4px);
    vertical-align: middle;
    margin-left: 4px;
    transition: all 0.12s;
    display: inline-flex;
    align-items: center;
  }

  .refresh-inline:hover {
    background: var(--bg-hover);
    color: var(--accent);
  }
`;
