import { QWIK_ATTR, QWIK_CONTAINER_SELECTOR } from './constants.js';
import type { PreloadedModule, QwikRouteInfo } from './types.js';

export function getRouteInfo(): QwikRouteInfo {
  const container = document.querySelector(QWIK_CONTAINER_SELECTOR);

  const activeRoute = container?.getAttribute(QWIK_ATTR.ROUTE) ?? null;
  const preloadedModules = getPreloadedModules();
  const detectedRoutes = detectRoutesFromLinks();

  return { activeRoute, preloadedModules, detectedRoutes };
}

function getPreloadedModules(): PreloadedModule[] {
  const links = document.querySelectorAll(
    'link[rel="modulepreload"], link[rel="preload"]',
  );
  const modules: PreloadedModule[] = [];

  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href) continue;

    let size: number | null = null;
    try {
      const entries = performance.getEntriesByName(
        new URL(href, location.href).href,
        'resource',
      );
      if (entries.length > 0) {
        size = (entries[0] as PerformanceResourceTiming).transferSize || null;
      }
    } catch (err) {
      console.debug('[Qwik DevTools] Failed to read preload entry size', err);
    }

    modules.push({
      href,
      as: link.getAttribute('as'),
      size,
    });
  }

  return modules;
}

/**
 * Detect routes by scanning internal <a> links on the page.
 * This gives us a list of navigable routes from the current page.
 */
function detectRoutesFromLinks(): string[] {
  return detectRoutesFromDocument(document, location.origin);
}

/**
 * Testable version of route detection that accepts document and origin parameters.
 * Used by tests since JSDOM doesn't have location.origin / location.pathname.
 */
export function detectRoutesFromDocument(
  doc: Document,
  origin: string,
): string[] {
  const routes = new Set<string>();

  const pathname = new URL(origin).pathname || '/';
  routes.add(pathname);

  const links = doc.querySelectorAll('a[href]');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href) continue;

    try {
      const url = new URL(href, origin);

      if (url.origin !== new URL(origin).origin) continue;

      const path = url.pathname;

      if (path.includes('.') && !path.endsWith('/')) continue;
      if (path.startsWith('/api/')) continue;
      if (path.startsWith('/build/')) continue;
      if (path.startsWith('/assets/')) continue;

      const el = link as HTMLAnchorElement;
      if (el.target === '_blank') continue;
      if (
        el.rel &&
        (el.rel.includes('external') || el.rel.includes('nofollow'))
      )
        continue;

      /**
       * Skip single-segment paths that are likely redirects to external services
       * (e.g. /chat -> Discord, /github -> GitHub). Only keep paths that look
       * like real app routes (have a trailing slash or nested path).
       */
      if (!path.endsWith('/') && !path.includes('/', 1)) continue;

      routes.add(path);
    } catch (err) {
      console.debug('[Qwik DevTools] Failed to parse link href', err);
    }
  }

  return Array.from(routes).sort();
}
