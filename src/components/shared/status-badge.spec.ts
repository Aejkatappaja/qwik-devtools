// @vitest-environment jsdom
import { html } from 'lit';
import { describe, expect, it } from 'vitest';
import { fixture, shadow } from '../test-helpers.js';
import './status-badge.js';
import type { StatusBadge } from './status-badge.js';

describe('qwik-status-badge', () => {
  it('renders label text', async () => {
    const el = await fixture<StatusBadge>(
      html`<qwik-status-badge label="Online"></qwik-status-badge>`,
    );
    const badge = shadow(el).querySelector('.badge');
    expect(badge?.textContent).toContain('Online');
  });

  it('sets variant as data attribute', async () => {
    const el = await fixture<StatusBadge>(
      html`<qwik-status-badge variant="success" label="OK"></qwik-status-badge>`,
    );
    const badge = shadow(el).querySelector('.badge');
    expect(badge?.getAttribute('data-variant')).toBe('success');
  });

  it('defaults to info variant', async () => {
    const el = await fixture<StatusBadge>(
      html`<qwik-status-badge label="Test"></qwik-status-badge>`,
    );
    const badge = shadow(el).querySelector('.badge');
    expect(badge?.getAttribute('data-variant')).toBe('info');
  });

  it('renders a dot indicator', async () => {
    const el = await fixture<StatusBadge>(
      html`<qwik-status-badge label="Test"></qwik-status-badge>`,
    );
    const dot = shadow(el).querySelector('.dot');
    expect(dot).not.toBeNull();
  });

  it('supports all variant types', async () => {
    for (const variant of ['success', 'warning', 'error', 'info']) {
      const el = await fixture<StatusBadge>(
        html`<qwik-status-badge variant=${variant} label=${variant}></qwik-status-badge>`,
      );
      const badge = shadow(el).querySelector('.badge');
      expect(badge?.getAttribute('data-variant')).toBe(variant);
    }
  });
});
