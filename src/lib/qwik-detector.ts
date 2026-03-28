import { QWIK_ATTR, QWIK_CONTAINER_SELECTOR } from './constants.js';
import type { QwikContainerInfo } from './types.js';

export function detectQwik(): QwikContainerInfo {
  const containers = document.querySelectorAll(QWIK_CONTAINER_SELECTOR);
  return detectQwikFromContainers(Array.from(containers));
}

export function detectQwikFromContainers(
  containers: Element[],
): QwikContainerInfo {
  if (containers.length === 0) {
    return {
      detected: false,
      version: null,
      renderMode: null,
      containerState: null,
      base: null,
      manifestHash: null,
      containerCount: 0,
    };
  }

  const el = containers[0];

  return {
    detected: true,
    version: el.getAttribute(QWIK_ATTR.VERSION),
    renderMode: el.getAttribute(QWIK_ATTR.RENDER),
    containerState: el.getAttribute(QWIK_ATTR.CONTAINER),
    base: el.getAttribute(QWIK_ATTR.BASE),
    manifestHash: el.getAttribute(QWIK_ATTR.MANIFEST_HASH),
    containerCount: containers.length,
  };
}
