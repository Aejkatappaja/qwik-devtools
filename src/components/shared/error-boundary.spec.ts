// @vitest-environment jsdom
import { html } from 'lit';
import { describe, expect, it } from 'vitest';
import { fixture, shadow } from '../test-helpers.js';
import './error-boundary.js';
import type { ErrorBoundary } from './error-boundary.js';

describe('qwik-error-boundary', () => {
  it('renders slotted content when no error', async () => {
    const el = await fixture<ErrorBoundary>(
      html`<qwik-error-boundary label="Test">
        <div id="child">Hello</div>
      </qwik-error-boundary>`,
    );
    const slot = shadow(el).querySelector('slot');
    expect(slot).not.toBeNull();
  });

  it('uses provided label', async () => {
    const el = await fixture<ErrorBoundary>(
      html`<qwik-error-boundary label="Routes"></qwik-error-boundary>`,
    );
    expect(el.label).toBe('Routes');
  });

  it('defaults label to Component', async () => {
    const el = await fixture<ErrorBoundary>(
      html`<qwik-error-boundary></qwik-error-boundary>`,
    );
    expect(el.label).toBe('Component');
  });

  it('shows error fallback with retry button when error occurs', async () => {
    const el = await fixture<ErrorBoundary>(
      html`<qwik-error-boundary label="Test"></qwik-error-boundary>`,
    );

    (el as unknown as { _hasError: boolean })._hasError = true;
    (el as unknown as { _errorMessage: string })._errorMessage =
      'Something broke';
    await el.updateComplete;

    const root = shadow(el);
    const title = root.querySelector('.error-title');
    expect(title?.textContent).toContain('Test crashed');

    const message = root.querySelector('.error-message');
    expect(message?.textContent).toContain('Something broke');

    const retryBtn = root.querySelector('.retry-btn');
    expect(retryBtn).not.toBeNull();
  });

  it('recovers on retry click', async () => {
    const el = await fixture<ErrorBoundary>(
      html`<qwik-error-boundary label="Test">
        <div>Content</div>
      </qwik-error-boundary>`,
    );

    (el as unknown as { _hasError: boolean })._hasError = true;
    (el as unknown as { _errorMessage: string })._errorMessage = 'Oops';
    await el.updateComplete;

    const root = shadow(el);
    expect(root.querySelector('.error-fallback')).not.toBeNull();

    const retryBtn = root.querySelector('.retry-btn') as HTMLElement;
    retryBtn.click();
    await el.updateComplete;

    expect(root.querySelector('.error-fallback')).toBeNull();
    expect(root.querySelector('slot')).not.toBeNull();
  });
});
