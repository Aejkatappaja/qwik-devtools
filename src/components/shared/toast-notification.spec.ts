// @vitest-environment jsdom
import { html } from 'lit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOAST_DISMISS_MS } from '../../lib/constants.js';
import { fixture, shadow } from '../test-helpers.js';
import './toast.js';
import { Toast } from './toast.js';

describe('qwik-toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when no toasts', async () => {
    const el = await fixture<Toast>(html`<qwik-toast></qwik-toast>`);
    const toasts = shadow(el).querySelectorAll('.toast');
    expect(toasts.length).toBe(0);
  });

  it('shows a toast when add() is called', async () => {
    const el = await fixture<Toast>(html`<qwik-toast></qwik-toast>`);
    el.add('Test message', 'info');
    await el.updateComplete;

    const toast = shadow(el).querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast?.textContent?.trim()).toBe('Test message');
    expect(toast?.getAttribute('data-variant')).toBe('info');
  });

  it('shows multiple toasts', async () => {
    const el = await fixture<Toast>(html`<qwik-toast></qwik-toast>`);
    el.add('First', 'info');
    el.add('Second', 'error');
    await el.updateComplete;

    const toasts = shadow(el).querySelectorAll('.toast');
    expect(toasts.length).toBe(2);
  });

  it('auto-dismisses after timeout', async () => {
    const el = await fixture<Toast>(html`<qwik-toast></qwik-toast>`);
    el.add('Temporary', 'warning');
    await el.updateComplete;

    const root = shadow(el);
    expect(root.querySelectorAll('.toast').length).toBe(1);

    vi.advanceTimersByTime(TOAST_DISMISS_MS + 100);
    await el.updateComplete;

    expect(root.querySelectorAll('.toast').length).toBe(0);
  });

  it('dismisses on click', async () => {
    const el = await fixture<Toast>(html`<qwik-toast></qwik-toast>`);
    el.add('Click me', 'info');
    await el.updateComplete;

    const root = shadow(el);
    const toast = root.querySelector('.toast') as HTMLElement;
    toast.click();
    await el.updateComplete;

    expect(root.querySelectorAll('.toast').length).toBe(0);
  });

  it('deduplicates via static show()', async () => {
    const el = await fixture<Toast>(html`<qwik-toast></qwik-toast>`);

    Toast.show('Dupe message', 'error');
    Toast.show('Dupe message', 'error');
    await el.updateComplete;

    const toasts = shadow(el).querySelectorAll('.toast');
    expect(toasts.length).toBe(1);
  });

  it('sets correct variant on toast', async () => {
    const el = await fixture<Toast>(html`<qwik-toast></qwik-toast>`);
    el.add('Error!', 'error');
    await el.updateComplete;

    const toast = shadow(el).querySelector('.toast');
    expect(toast?.getAttribute('data-variant')).toBe('error');
  });
});
