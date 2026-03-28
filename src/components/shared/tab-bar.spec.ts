// @vitest-environment jsdom
import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { fixture, shadow } from '../test-helpers.js';
import type { TabDef } from './tab-bar.js';
import './tab-bar.js';
import type { TabBar } from './tab-bar.js';

const TABS: TabDef[] = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three' },
];

describe('qwik-tab-bar', () => {
  it('renders a button for each tab', async () => {
    const el = await fixture<TabBar>(
      html`<qwik-tab-bar .tabs=${TABS} active="one"></qwik-tab-bar>`,
    );
    const buttons = shadow(el).querySelectorAll('button');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent?.trim()).toBe('One');
    expect(buttons[1].textContent?.trim()).toBe('Two');
    expect(buttons[2].textContent?.trim()).toBe('Three');
  });

  it('marks the active tab with aria-selected and data-active', async () => {
    const el = await fixture<TabBar>(
      html`<qwik-tab-bar .tabs=${TABS} active="two"></qwik-tab-bar>`,
    );
    const buttons = shadow(el).querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-selected')).toBe('false');
    expect(buttons[1].getAttribute('aria-selected')).toBe('true');
    expect(buttons[2].getAttribute('aria-selected')).toBe('false');
    expect(buttons[1].hasAttribute('data-active')).toBe(true);
  });

  it('sets tabindex 0 on active tab, -1 on others', async () => {
    const el = await fixture<TabBar>(
      html`<qwik-tab-bar .tabs=${TABS} active="one"></qwik-tab-bar>`,
    );
    const buttons = shadow(el).querySelectorAll('button');
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('tabindex')).toBe('-1');
  });

  it('dispatches tab-change event on click', async () => {
    const el = await fixture<TabBar>(
      html`<qwik-tab-bar .tabs=${TABS} active="one"></qwik-tab-bar>`,
    );
    const handler = vi.fn();
    el.addEventListener('tab-change', handler);

    const buttons = shadow(el).querySelectorAll('button');
    buttons[1].click();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].detail).toBe('two');
  });

  it('renders empty when no tabs provided', async () => {
    const el = await fixture<TabBar>(
      html`<qwik-tab-bar .tabs=${[]} active=""></qwik-tab-bar>`,
    );
    const buttons = shadow(el).querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });

  it('uses role=tablist on nav', async () => {
    const el = await fixture<TabBar>(
      html`<qwik-tab-bar .tabs=${TABS} active="one"></qwik-tab-bar>`,
    );
    const nav = shadow(el).querySelector('nav');
    expect(nav?.getAttribute('role')).toBe('tablist');
  });
});
