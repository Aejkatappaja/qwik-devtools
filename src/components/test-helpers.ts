import type { LitElement, TemplateResult } from 'lit';
import { html, render } from 'lit';
import { afterEach, expect } from 'vitest';

let container: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!container) {
    container = document.createElement('div');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Mount a Lit component from a template, wait for first render,
 * and return the element. Automatically cleaned up after each test.
 */
export async function fixture<T extends LitElement>(
  template: TemplateResult,
): Promise<T> {
  const c = getContainer();
  render(template, c);
  const el = c.firstElementChild as T;
  await el.updateComplete;
  return el;
}

/** Get the shadow root of a Lit element, failing the test if absent. */
export function shadow(el: LitElement): ShadowRoot {
  const root = el.shadowRoot;
  expect(root).not.toBeNull();
  return root as ShadowRoot;
}

afterEach(() => {
  if (container) {
    render(html``, container);
  }
});
