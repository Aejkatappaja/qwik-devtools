import type { CSSResult } from 'lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styles } from './status-badge.styles.js';

const QWIK_STATUS_BADGE_VARIANT = [
  'success',
  'warning',
  'error',
  'info',
] as const;
type QwikStatusBadgeVariant = (typeof QWIK_STATUS_BADGE_VARIANT)[number];

/**
 * Small colored badge with a dot indicator, used to show status
 * (success, warning, error, info) alongside a text label.
 */
@customElement('qwik-status-badge')
export class StatusBadge extends LitElement {
  static override styles: CSSResult = styles;

  @property({ type: String })
  variant: QwikStatusBadgeVariant = 'info';

  @property({ type: String })
  label: string = '';

  override render() {
    return html`<span class="badge" data-variant=${this.variant}
      ><span class="dot"></span>${this.label}</span
    >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qwik-status-badge': StatusBadge;
  }
}
