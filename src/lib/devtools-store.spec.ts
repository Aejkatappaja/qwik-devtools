import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DevToolsStore } from './devtools-store.js';

// Mock chrome port
function createMockPort() {
  const listeners: Array<(msg: unknown) => void> = [];
  return {
    postMessage: vi.fn(),
    onMessage: {
      addListener: (fn: (msg: unknown) => void) => listeners.push(fn),
      removeListener: vi.fn(),
    },
    /** Simulate receiving a message from content script */
    _receive(msg: unknown) {
      for (const fn of listeners) fn(msg);
    },
  };
}

describe('DevToolsStore', () => {
  let store: DevToolsStore;
  let port: ReturnType<typeof createMockPort>;

  beforeEach(() => {
    store = new DevToolsStore();
    port = createMockPort();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in loading state', () => {
    expect(store.isLoading).toBe(true);
  });

  it('sends DETECT_QWIK on connect', () => {
    store.connect(port as unknown as chrome.runtime.Port);

    expect(port.postMessage).toHaveBeenCalledWith({ type: 'DETECT_QWIK' });
  });

  it('clears stale data on fetchAll', () => {
    store.connect(port as unknown as chrome.runtime.Port);

    // Simulate detection result
    port._receive({
      type: 'QWIK_DETECTION_RESULT',
      payload: {
        detected: true,
        version: '1.0',
        renderMode: 'ssr',
        containerState: 'paused',
        base: '/',
        manifestHash: 'abc',
        containerCount: 1,
      },
    });
    port._receive({ type: 'COMPONENT_TREE_RESULT', payload: [{ id: '0' }] });

    expect(store.componentTree.length).toBe(1);

    // Fetch again — tree is preserved until new data arrives (no flash of empty)
    store.fetchAll();
    expect(store.componentTree).toEqual([{ id: '0' }]);
    expect(store.containerInfo).toBeNull();
  });

  it('processes QWIK_DETECTION_RESULT', () => {
    store.connect(port as unknown as chrome.runtime.Port);

    const info = {
      detected: true,
      version: '2.0',
      renderMode: 'ssr',
      containerState: 'paused',
      base: '/build/',
      manifestHash: 'xyz',
      containerCount: 1,
    };
    port._receive({ type: 'QWIK_DETECTION_RESULT', payload: info });

    expect(store.containerInfo).toEqual(info);
    expect(store.isLoading).toBe(true); // Still loading until tree arrives
    // Should have sent GET_COMPONENT_TREE and GET_ROUTES
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'GET_COMPONENT_TREE',
    });
    expect(port.postMessage).toHaveBeenCalledWith({ type: 'GET_ROUTES' });
  });

  it('processes COMPONENT_TREE_RESULT and stops loading', () => {
    store.connect(port as unknown as chrome.runtime.Port);
    port._receive({
      type: 'QWIK_DETECTION_RESULT',
      payload: {
        detected: true,
        version: '1.0',
        renderMode: 'ssr',
        containerState: 'paused',
        base: '/',
        manifestHash: 'abc',
        containerCount: 1,
      },
    });

    const tree = [{ id: '0', children: [] }];
    port._receive({ type: 'COMPONENT_TREE_RESULT', payload: tree });

    expect(store.componentTree).toEqual(tree);
    expect(store.isLoading).toBe(false);
  });

  it('processes ROUTES_RESULT', () => {
    store.connect(port as unknown as chrome.runtime.Port);

    const routeInfo = {
      activeRoute: '/docs/',
      preloadedModules: [],
      detectedRoutes: ['/', '/docs/'],
    };
    port._receive({ type: 'ROUTES_RESULT', payload: routeInfo });

    expect(store.routeInfo).toEqual(routeInfo);
  });

  it('sets needsReload on DETECT_QWIK_ERROR', () => {
    store.connect(port as unknown as chrome.runtime.Port);

    port._receive({ type: 'DETECT_QWIK_ERROR' });

    expect(store.needsReload).toBe(true);
    expect(store.isLoading).toBe(false);
    expect(store.containerInfo?.detected).toBe(false);
  });

  it('handles non-detected page', () => {
    store.connect(port as unknown as chrome.runtime.Port);

    port._receive({
      type: 'QWIK_DETECTION_RESULT',
      payload: {
        detected: false,
        version: null,
        renderMode: null,
        containerState: null,
        base: null,
        manifestHash: null,
        containerCount: 0,
      },
    });

    expect(store.isLoading).toBe(false);
    expect(store.containerInfo?.detected).toBe(false);
  });

  it('notifies listeners on state change', () => {
    const listener = vi.fn();
    store.onChange(listener);
    store.connect(port as unknown as chrome.runtime.Port);

    port._receive({
      type: 'QWIK_DETECTION_RESULT',
      payload: {
        detected: false,
        version: null,
        renderMode: null,
        containerState: null,
        base: null,
        manifestHash: null,
        containerCount: 0,
      },
    });

    expect(listener).toHaveBeenCalled();
  });

  it('unsubscribe works', () => {
    const listener = vi.fn();
    const unsub = store.onChange(listener);
    unsub();
    store.connect(port as unknown as chrome.runtime.Port);

    port._receive({
      type: 'QWIK_DETECTION_RESULT',
      payload: {
        detected: false,
        version: null,
        renderMode: null,
        containerState: null,
        base: null,
        manifestHash: null,
        containerCount: 0,
      },
    });

    // Listener was removed before connect, so it should never have been called
    expect(listener).not.toHaveBeenCalled();
  });

  it('toggleInspect sends correct messages', () => {
    store.connect(port as unknown as chrome.runtime.Port);
    port.postMessage.mockClear();

    store.toggleInspect();
    expect(store.inspectMode).toBe(true);
    expect(port.postMessage).toHaveBeenCalledWith({ type: 'START_INSPECT' });

    port.postMessage.mockClear();
    store.toggleInspect();
    expect(store.inspectMode).toBe(false);
    expect(port.postMessage).toHaveBeenCalledWith({ type: 'STOP_INSPECT' });
  });

  it('sets needsReload on timeout', () => {
    store.connect(port as unknown as chrome.runtime.Port);

    // DETECTION_TIMEOUT_MS is 3000
    vi.advanceTimersByTime(3000);

    expect(store.isLoading).toBe(false);
    expect(store.needsReload).toBe(true);
  });

  it('retries detection with backoff', () => {
    store.connect(port as unknown as chrome.runtime.Port);
    const initialCalls = port.postMessage.mock.calls.length;

    // First retry at 500ms cumulative
    vi.advanceTimersByTime(600);
    expect(port.postMessage.mock.calls.length).toBeGreaterThan(initialCalls);
  });

  it('ignores non-extension messages', () => {
    store.connect(port as unknown as chrome.runtime.Port);

    // Send invalid messages - shouldn't crash
    port._receive({ notAType: 'garbage' });
    port._receive(null);
    port._receive(42);

    expect(store.isLoading).toBe(true); // Still loading, nothing processed
  });

  it('disposes cleanly', () => {
    const listener = vi.fn();
    store.onChange(listener);
    store.connect(port as unknown as chrome.runtime.Port);
    listener.mockClear();

    store.dispose();

    // Should not notify after dispose
    port._receive({
      type: 'QWIK_DETECTION_RESULT',
      payload: { detected: true },
    });
    expect(listener).not.toHaveBeenCalled();
  });

  it('ELEMENT_PICKED sets inspectedNodeId', () => {
    store.connect(port as unknown as chrome.runtime.Port);

    port._receive({ type: 'ELEMENT_PICKED', payload: { qId: '42' } });

    expect(store.inspectedNodeId).toBe('42');
    expect(store.inspectMode).toBe(false);
  });

  it('PAGE_CHANGED triggers refetch and sets partialTree', () => {
    store.connect(port as unknown as chrome.runtime.Port);
    port.postMessage.mockClear();

    port._receive({ type: 'PAGE_CHANGED' });

    expect(port.postMessage).toHaveBeenCalledWith({ type: 'DETECT_QWIK' });
    expect(store.partialTree).toBe(true);
  });
});
