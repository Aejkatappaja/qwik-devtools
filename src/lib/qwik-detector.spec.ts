import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import {
  MULTIPLE_CONTAINERS_HTML,
  NO_QWIK_HTML,
  QWIK_CONTAINER_HTML,
} from './fixtures/sample-qwik-html.js';
import { detectQwikFromContainers } from './qwik-detector.js';

/**
 * JSDOM doesn't support CSS selectors with escaped colons like [q\:container].
 * This helper iterates all elements to find Qwik containers instead.
 */
function findQwikContainers(doc: Document): Element[] {
  const results: Element[] = [];
  for (const el of doc.querySelectorAll('*')) {
    if (el.getAttribute('q:container') !== null) results.push(el);
  }
  return results;
}

describe('qwik-detector', () => {
  it('detects a Qwik container with all attributes', () => {
    const dom = new JSDOM(QWIK_CONTAINER_HTML);
    const result = detectQwikFromContainers(
      findQwikContainers(dom.window.document),
    );

    expect(result.detected).toBe(true);
    expect(result.version).toBe('1.9.0');
    expect(result.renderMode).toBe('ssr');
    expect(result.containerState).toBe('paused');
    expect(result.base).toBe('/build/');
    expect(result.manifestHash).toBe('abc123');
    expect(result.containerCount).toBe(1);
  });

  it('returns not detected for a non-Qwik page', () => {
    const dom = new JSDOM(NO_QWIK_HTML);
    const result = detectQwikFromContainers(
      findQwikContainers(dom.window.document),
    );

    expect(result.detected).toBe(false);
    expect(result.version).toBeNull();
    expect(result.containerCount).toBe(0);
  });

  it('handles multiple containers', () => {
    const dom = new JSDOM(MULTIPLE_CONTAINERS_HTML);
    const result = detectQwikFromContainers(
      findQwikContainers(dom.window.document),
    );

    expect(result.detected).toBe(true);
    expect(result.containerCount).toBe(2);
    expect(result.version).toBe('2.0.0');
    expect(result.containerState).toBe('resumed');
  });
});
