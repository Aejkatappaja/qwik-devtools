import { browser } from 'wxt/browser';
import {
  enrichTreeWithState,
  getComponentTree,
} from '../lib/component-tree-builder.js';
import { detectQwik } from '../lib/qwik-detector.js';
import { getSerializedState } from '../lib/qwik-state-parser.js';
import { getRouteInfo } from '../lib/route-explorer.js';
import { cleanTree } from '../lib/tree-cleaner.js';
import type { ExtensionMessage, QwikComponentNode } from '../lib/types.js';
import { isExtensionMessage } from '../lib/types.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    let inspectOverlay: HTMLDivElement | null = null;
    let inspectActive = false;

    function createOverlay(): HTMLDivElement {
      const overlay = document.createElement('div');
      overlay.id = '__qwik_devtools_overlay';
      overlay.style.cssText = `
        position: fixed;
        pointer-events: none;
        border: 2px solid #8b5cf6;
        background: rgba(139, 92, 246, 0.1);
        z-index: 2147483647;
        transition: all 0.1s ease;
        display: none;
        border-radius: 3px;
      `;

      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        top: -22px;
        left: -2px;
        background: #8b5cf6;
        color: white;
        font-size: 11px;
        font-family: -apple-system, sans-serif;
        padding: 2px 6px;
        border-radius: 3px 3px 0 0;
        white-space: nowrap;
        pointer-events: none;
      `;
      label.id = '__qwik_devtools_label';
      overlay.appendChild(label);

      document.body.appendChild(overlay);
      return overlay;
    }

    function findQwikAncestor(el: Element): Element | null {
      let current: Element | null = el;
      while (current) {
        if (current.hasAttribute('q:id')) return current;
        current = current.parentElement;
      }
      return null;
    }

    function handleInspectMove(e: MouseEvent) {
      if (!inspectActive || !inspectOverlay) return;
      const target = e.target as Element;
      const qwikEl = findQwikAncestor(target);

      if (qwikEl) {
        const rect = qwikEl.getBoundingClientRect();
        inspectOverlay.style.display = 'block';
        inspectOverlay.style.top = rect.top + 'px';
        inspectOverlay.style.left = rect.left + 'px';
        inspectOverlay.style.width = rect.width + 'px';
        inspectOverlay.style.height = rect.height + 'px';

        const label = inspectOverlay.querySelector(
          '#__qwik_devtools_label',
        ) as HTMLDivElement;
        if (label) {
          const tag = qwikEl.tagName.toLowerCase();
          const id = qwikEl.getAttribute('q:id');
          const cls = qwikEl.getAttribute('class') ?? '';
          const name = cls ? cls.split(' ')[0] : tag;
          label.textContent = `<${tag}> ${name} #${id}`;
        }
      } else {
        inspectOverlay.style.display = 'none';
      }
    }

    function handleInspectClick(e: MouseEvent) {
      if (!inspectActive) return;
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as Element;
      const qwikEl = findQwikAncestor(target);

      if (qwikEl) {
        const qId = qwikEl.getAttribute('q:id');
        browser.runtime.sendMessage({
          type: 'ELEMENT_PICKED',
          payload: { qId },
        });
      }

      stopInspect();
    }

    function startInspect() {
      inspectActive = true;
      if (!inspectOverlay) inspectOverlay = createOverlay();
      // Remove first to prevent duplicate listeners
      document.removeEventListener('mousemove', handleInspectMove, true);
      document.removeEventListener('click', handleInspectClick, true);
      document.addEventListener('mousemove', handleInspectMove, true);
      document.addEventListener('click', handleInspectClick, true);
      document.body.style.cursor = 'crosshair';
    }

    function stopInspect() {
      inspectActive = false;
      if (inspectOverlay) {
        inspectOverlay.style.display = 'none';
      }
      document.removeEventListener('mousemove', handleInspectMove, true);
      document.removeEventListener('click', handleInspectClick, true);
      document.body.style.cursor = '';
    }

    // ---- SPA navigation detection ----
    // Qwik uses client-side routing: the URL changes but no full page
    // reload occurs, so background.ts tabs.onUpdated never fires.
    // We detect SPA navigations by monitoring URL changes and notifying
    // the DevTools panel to re-fetch the component tree.
    let lastUrl = location.href;
    let spaNavTimeout: ReturnType<typeof setTimeout> | null = null;
    let spaObserver: MutationObserver | null = null;

    const notifyPageChanged = () => {
      try {
        browser.runtime.sendMessage({ type: 'PAGE_CHANGED' });
      } catch {
        // extension context invalidated
      }
    };

    const cleanupSpaDetection = () => {
      if (spaNavTimeout) {
        clearTimeout(spaNavTimeout);
        spaNavTimeout = null;
      }
      if (spaObserver) {
        spaObserver.disconnect();
        spaObserver = null;
      }
    };

    const checkUrlChange = () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        cleanupSpaDetection();

        // Qwik's SPA navigation triggers pushState BEFORE the DOM is updated.
        // We use a MutationObserver to wait for DOM changes to SETTLE:
        // each mutation resets a 200ms timer. When no mutations occur for
        // 200ms, we know Qwik has finished rendering and notify the panel.
        const container =
          document.querySelector('[q\\:container]') ?? document.body;

        spaObserver = new MutationObserver(() => {
          // Reset the debounce timer on each mutation
          if (spaNavTimeout) clearTimeout(spaNavTimeout);
          spaNavTimeout = setTimeout(() => {
            cleanupSpaDetection();
            notifyPageChanged();
          }, 200);
        });

        spaObserver.observe(container, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['q:id', 'q:key', 'q:container'],
        });

        // Fallback: if no mutations at all after 1s, notify anyway
        spaNavTimeout = setTimeout(() => {
          cleanupSpaDetection();
          notifyPageChanged();
        }, 1000);
      }
    };

    // Intercept pushState/replaceState in the MAIN world.
    // Content scripts run in an ISOLATED world — patching history here
    // would not capture navigations triggered by Qwik's router.
    // We inject an external script file (not inline) to avoid CSP violations
    // on pages with strict Content-Security-Policy headers.
    const navScript = document.createElement('script');
    navScript.src = chrome.runtime.getURL('/nav-hook.js');
    (document.documentElement || document.head).appendChild(navScript);
    navScript.addEventListener('load', () => navScript.remove());

    const handleNavMessage = (e: MessageEvent) => {
      if (e.data?.type === '__QWIK_DT_NAV') checkUrlChange();
    };

    // Abort previous listeners if the content script reinitializes
    ((window as unknown as Record<string, unknown>).__qwik_dt_abort as AbortController | undefined)?.abort();
    const navAbort = new AbortController();
    (window as unknown as Record<string, unknown>).__qwik_dt_abort = navAbort;

    window.addEventListener('message', handleNavMessage, { signal: navAbort.signal });
    window.addEventListener('popstate', checkUrlChange, { signal: navAbort.signal });

    /** Dual pattern: sendResponse for Chrome, Promise for Firefox */
    browser.runtime.onMessage.addListener(
      (msg: unknown, _sender, sendResponse) => {
        if (!isExtensionMessage(msg)) return;
        let response: ExtensionMessage;

        switch (msg.type) {
          case 'DETECT_QWIK':
            response = { type: 'QWIK_DETECTION_RESULT', payload: detectQwik() };
            break;
          case 'GET_COMPONENT_TREE': {
            const tree = getComponentTree();
            const container = document.querySelector('[q\\:container]');
            const isPaused =
              container?.getAttribute('q:container') === 'paused';

            let result: QwikComponentNode[];

            if (isPaused) {
              const state = getSerializedState();
              if (state) {
                result = enrichTreeWithState(tree, state);
              } else {
                result = cleanTree(tree, true);
              }
            } else {
              // Resumed: the WeakMap cache in buildTree automatically
              // restores names for layout elements that persist in DOM.
              result = cleanTree(tree, true);
            }

            response = { type: 'COMPONENT_TREE_RESULT', payload: result };
            break;
          }
          case 'GET_ROUTES':
            response = { type: 'ROUTES_RESULT', payload: getRouteInfo() };
            break;
          case 'START_INSPECT':
            startInspect();
            response = { type: 'OK' };
            break;
          case 'STOP_INSPECT':
            stopInspect();
            response = { type: 'OK' };
            break;
          default:
            response = { type: 'UNKNOWN', payload: null };
        }

        try {
          sendResponse(response);
        } catch (err) {
          console.debug('[Qwik DevTools]', err);
        }
        /** Keep channel open (needed for Chrome's sendResponse callback) */
        return true;
      },
    );
  },
});
