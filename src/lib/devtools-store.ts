import { DETECTION_RETRY_DELAYS, DETECTION_TIMEOUT_MS } from './constants.js';
import { MessageBus } from './message-bus.js';
import type {
  MessageType,
  QwikComponentNode,
  QwikContainerInfo,
  QwikRouteInfo,
  ResumabilityData,
} from './types.js';
import { isExtensionMessage } from './types.js';

type StoreListener = () => void;

/**
 * Centralized state store for the DevTools panel.
 * Manages port connection, message routing, retry logic, and all
 * data fetching. UI components subscribe to changes via onChange().
 *
 * Separating state from rendering makes it testable and keeps
 * the devtools-root component focused on layout.
 */
export class DevToolsStore {
  // ---- Public state (read-only from outside) ----
  containerInfo: QwikContainerInfo | null = null;
  componentTree: QwikComponentNode[] = [];
  routeInfo: QwikRouteInfo | null = null;
  resumabilityData: ResumabilityData | null = null;
  isLoading = true;
  needsReload = false;
  inspectMode = false;
  inspectedNodeId: string | null = null;
  /** True when the container has resumed (SPA navigation) — tree may be partial */
  partialTree = false;
  /** Incremented on each fetchAll() — tabs can watch this to trigger refetch */
  fetchGeneration = 0;

  /** Optional callback invoked when the user picks an element via inspect mode. */
  onElementPicked: ((qId: string) => void) | null = null;

  // ---- Private ----
  private _port: chrome.runtime.Port | null = null;
  private _retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private _retryTimeouts: ReturnType<typeof setTimeout>[] = [];
  private _listeners = new Set<StoreListener>();
  private _bus: MessageBus;

  constructor() {
    this._bus = new MessageBus()
      .on<'QWIK_DETECTION_RESULT', QwikContainerInfo>(
        'QWIK_DETECTION_RESULT',
        (info) => {
          this.containerInfo = info ?? null;
          if (info?.detected) {
            this._send({ type: 'GET_COMPONENT_TREE' });
            this._send({ type: 'GET_ROUTES' });
          } else {
            this.isLoading = false;
          }
          this._notify();
        },
      )
      .on<'COMPONENT_TREE_RESULT', QwikComponentNode[]>(
        'COMPONENT_TREE_RESULT',
        (tree) => {
          this.componentTree = tree ?? [];
          this.isLoading = false;
          this._notify();
        },
      )
      .on<'ROUTES_RESULT', QwikRouteInfo>('ROUTES_RESULT', (info) => {
        this.routeInfo = info ?? null;
        this._notify();
      })
      .on('DETECT_QWIK_ERROR', () => {
        this.containerInfo = {
          detected: false,
          version: null,
          renderMode: null,
          containerState: null,
          base: null,
          manifestHash: null,
          containerCount: 0,
        };
        this.isLoading = false;
        this.needsReload = true;
        this._notify();
      })
      .on<'ELEMENT_PICKED', { qId?: string }>('ELEMENT_PICKED', (picked) => {
        if (picked?.qId) {
          this.inspectedNodeId = picked.qId;
          this.inspectMode = false;
          this.onElementPicked?.(picked.qId);
          this._notify();
        }
      })
      .on('PAGE_CHANGED', () => {
        this.needsReload = false;
        this.partialTree = true;
        this.fetchAll();
      });
  }

  onChange(listener: StoreListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  connect(port: chrome.runtime.Port): void {
    this._port = port;
    this._port.onMessage.addListener(this._handleMessage);
    this.partialTree = false;
    this.fetchAll();
  }

  reconnect(port: chrome.runtime.Port): void {
    try {
      this._port?.onMessage.removeListener(this._handleMessage);
    } catch {
      // old port may already be invalid
    }
    this._port = port;
    this._port.onMessage.addListener(this._handleMessage);
    this.partialTree = false;
    this.fetchAll();
  }

  dispose(): void {
    try {
      this._port?.onMessage.removeListener(this._handleMessage);
    } catch (err) {
      console.debug('[Qwik DevTools]', err);
    }
    this._clearTimeouts();
    this._listeners.clear();
    this._bus.clear();
  }

  fetchAll(): void {
    this.isLoading = true;
    this.needsReload = false;
    // Don't clear componentTree/routeInfo — keep showing old data until
    // new data arrives. Assets data is NOT cleared because the DOM
    // accumulates resources across SPA routes (inflated numbers).
    this.containerInfo = null;
    this.resumabilityData = null;
    this.fetchGeneration++;
    this._clearTimeouts();
    this._notify();

    this._send({ type: 'DETECT_QWIK' });

    let cumulative = 0;
    for (const delay of DETECTION_RETRY_DELAYS) {
      cumulative += delay;
      const t = setTimeout(() => {
        if (this.isLoading) this._send({ type: 'DETECT_QWIK' });
      }, cumulative);
      this._retryTimeouts.push(t);
    }

    this._retryTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.needsReload = true;
        this._notify();
      }
    }, DETECTION_TIMEOUT_MS);
  }

  toggleInspect(): void {
    this.inspectMode = !this.inspectMode;
    this._send({ type: this.inspectMode ? 'START_INSPECT' : 'STOP_INSPECT' });
    this._notify();
  }

  setInspectedNode(id: string | null): void {
    this.inspectedNodeId = id;
    this._notify();
  }

  private _send(msg: { type: MessageType; payload?: unknown }): void {
    this._port?.postMessage(msg);
  }

  private _handleMessage = (msg: unknown): void => {
    if (!isExtensionMessage(msg)) return;
    this._bus.dispatch(msg);
  };

  private _notify(): void {
    for (const listener of this._listeners) listener();
  }

  private _clearTimeouts(): void {
    if (this._retryTimeout) clearTimeout(this._retryTimeout);
    for (const t of this._retryTimeouts) clearTimeout(t);
    this._retryTimeouts = [];
  }
}
