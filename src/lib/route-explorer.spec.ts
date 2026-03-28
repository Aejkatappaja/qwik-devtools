import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { detectRoutesFromDocument } from './route-explorer.js';

const SITE_HTML = `
<html q:container="paused" q:route="docs/getting-started/">
  <body>
    <nav>
      <a href="/">Home</a>
      <a href="/docs/">Docs</a>
      <a href="/docs/getting-started/">Getting Started</a>
      <a href="/docs/advanced/routing/">Routing</a>
      <a href="/blog/">Blog</a>
      <a href="/community/projects/">Projects</a>
      <a href="https://github.com/QwikDev/qwik">GitHub</a>
      <a href="https://discord.gg/qwik" target="_blank">Discord</a>
      <a href="/chat" rel="external">Chat</a>
      <a href="/assets/logo.svg">Logo</a>
      <a href="/api/status">API</a>
      <a href="/build/chunk.js">Chunk</a>
    </nav>
  </body>
</html>
`;

describe('route-explorer', () => {
  describe('detectRoutesFromDocument', () => {
    it('detects internal routes from links', () => {
      const dom = new JSDOM(SITE_HTML);
      const routes = detectRoutesFromDocument(
        dom.window.document,
        'https://qwik.dev/',
      );

      expect(routes).toContain('/');
      expect(routes).toContain('/docs/');
      expect(routes).toContain('/docs/getting-started/');
      expect(routes).toContain('/docs/advanced/routing/');
      expect(routes).toContain('/blog/');
      expect(routes).toContain('/community/projects/');
    });

    it('excludes external links', () => {
      const dom = new JSDOM(SITE_HTML);
      const routes = detectRoutesFromDocument(
        dom.window.document,
        'https://qwik.dev/',
      );

      const hasGithub = routes.some((r) => r.includes('github'));
      expect(hasGithub).toBe(false);
    });

    it('excludes target="_blank" links', () => {
      const dom = new JSDOM(SITE_HTML);
      const routes = detectRoutesFromDocument(
        dom.window.document,
        'https://qwik.dev/',
      );

      const hasDiscord = routes.some((r) => r.includes('discord'));
      expect(hasDiscord).toBe(false);
    });

    it('excludes rel="external" links', () => {
      const dom = new JSDOM(SITE_HTML);
      const routes = detectRoutesFromDocument(
        dom.window.document,
        'https://qwik.dev/',
      );

      expect(routes).not.toContain('/chat');
    });

    it('excludes asset files', () => {
      const dom = new JSDOM(SITE_HTML);
      const routes = detectRoutesFromDocument(
        dom.window.document,
        'https://qwik.dev/',
      );

      const hasAssets = routes.some(
        (r) => r.includes('logo.svg') || r.includes('/assets/'),
      );
      expect(hasAssets).toBe(false);
    });

    it('excludes /api/ and /build/ paths', () => {
      const dom = new JSDOM(SITE_HTML);
      const routes = detectRoutesFromDocument(
        dom.window.document,
        'https://qwik.dev/',
      );

      expect(routes).not.toContain('/api/status');
      expect(routes).not.toContain('/build/chunk.js');
    });

    it('excludes single-segment paths without trailing slash (redirect candidates)', () => {
      const dom = new JSDOM(SITE_HTML);
      const routes = detectRoutesFromDocument(
        dom.window.document,
        'https://qwik.dev/',
      );

      // /chat is single segment without slash, filtered as potential redirect
      expect(routes).not.toContain('/chat');
    });

    it('returns sorted routes', () => {
      const dom = new JSDOM(SITE_HTML);
      const routes = detectRoutesFromDocument(
        dom.window.document,
        'https://qwik.dev/',
      );

      const sorted = [...routes].sort();
      expect(routes).toEqual(sorted);
    });

    it('deduplicates routes', () => {
      const html = `<html><body>
        <a href="/docs/">Docs</a>
        <a href="/docs/">Docs again</a>
        <a href="/docs/">Docs three</a>
      </body></html>`;
      const dom = new JSDOM(html);
      const routes = detectRoutesFromDocument(
        dom.window.document,
        'https://qwik.dev/',
      );

      const docsCount = routes.filter((r) => r === '/docs/').length;
      expect(docsCount).toBe(1);
    });

    it('handles empty page', () => {
      const dom = new JSDOM('<html><body></body></html>');
      const routes = detectRoutesFromDocument(
        dom.window.document,
        'https://qwik.dev/',
      );

      expect(routes).toEqual(['/']);
    });
  });
});
