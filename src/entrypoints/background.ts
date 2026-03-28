import { browser } from 'wxt/browser';
import { isExtensionMessage } from '../lib/types.js';

export default defineBackground(() => {
  const devtoolsPorts = new Map<number, chrome.runtime.Port>();

  browser.runtime.onConnect.addListener((port) => {
    if (!port.name.startsWith('devtools-')) return;

    const segments = port.name.split('-');
    if (segments.length < 2) return;
    const tabId = parseInt(segments[1], 10);
    if (Number.isNaN(tabId)) return;

    devtoolsPorts.set(tabId, port);

    port.onDisconnect.addListener(() => {
      devtoolsPorts.delete(tabId);
    });

    port.onMessage.addListener((msg: unknown) => {
      if (!isExtensionMessage(msg)) return;
      browser.tabs
        .sendMessage(tabId, msg)
        .then((response: unknown) => {
          try {
            port.postMessage(response);
          } catch (err) {
            console.debug('[Qwik DevTools]', err);
          }
        })
        .catch((err: unknown) => {
          try {
            port.postMessage({
              type: `${msg.type}_ERROR`,
              payload: { error: String(err) },
            });
          } catch (err) {
            console.debug('[Qwik DevTools]', err);
          }
        });
    });
  });

  browser.runtime.onMessage.addListener((msg: unknown, sender) => {
    if (!isExtensionMessage(msg)) return;
    if (sender.tab?.id && devtoolsPorts.has(sender.tab.id)) {
      try {
        devtoolsPorts.get(sender.tab.id)?.postMessage(msg);
      } catch (err) {
        console.debug('[Qwik DevTools]', err);
      }
    }
  });

  browser.tabs.onUpdated.addListener(
    (tabId: number, changeInfo: { status?: string }) => {
      if (changeInfo.status === 'complete' && devtoolsPorts.has(tabId)) {
        try {
          devtoolsPorts.get(tabId)?.postMessage({ type: 'PAGE_CHANGED' });
        } catch {
          // port disconnected
        }
      }
    },
  );
});
