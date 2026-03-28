export interface QwikContainerInfo {
  detected: boolean;
  version: string | null;
  renderMode: string | null; // 'ssr' | 'ssr-dev' | 'dom' | 'dom-dev'
  containerState: string | null; // 'paused' | 'resumed'
  base: string | null;
  manifestHash: string | null;
  containerCount: number;
}

export interface QwikSerializedState {
  raw: string;
  refs: Record<string, string>;
  ctx: Record<string, QwikContext>;
  objs: QwikSerializedObject[];
  subs: string[][];
}

export interface QwikContext {
  componentQrl?: string;
  props?: Record<string, unknown>;
  tasks?: unknown[];
}

export interface QwikSerializedObject {
  index: number;
  rawValue: unknown;
  type: QwikObjectType;
  decodedValue: unknown;
}

export type QwikObjectType =
  | 'signal'
  | 'computed'
  | 'qrl'
  | 'element-ref'
  | 'text-ref'
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'undefined'
  | 'unknown';

export interface ComponentStateEntry {
  index: number;
  type: QwikObjectType;
  rawValue: unknown;
  decodedValue: unknown;
}

export interface ComponentContext {
  componentQrl?: string;
  componentName?: string;
  props?: Record<string, unknown>;
}

export interface QwikComponentNode {
  id: string;
  key: string | null;
  tagName: string;
  componentName: string;
  children: QwikComponentNode[];
  depth: number;
  hasContext: boolean;
  attributes: Record<string, string>;
  state: ComponentStateEntry[];
  context: ComponentContext | null;
}

export interface QwikRouteInfo {
  activeRoute: string | null;
  preloadedModules: PreloadedModule[];
  detectedRoutes: string[];
}

export interface PreloadedModule {
  href: string;
  as: string | null;
  size: number | null;
}

export interface AssetData {
  scripts: AssetEntry[];
  styles: AssetEntry[];
  images: ImageEntry[];
  preloads: AssetEntry[];
}

export interface AssetEntry {
  url: string;
  size: number;
  type: string;
}

export interface ImageEntry {
  src: string;
  width: number | null;
  height: number | null;
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  hasWidthAttr: boolean;
  hasHeightAttr: boolean;
  hasAlt: boolean;
  alt: string;
  loading: string | null;
  format: string;
  transferSize: number;
}

export interface ResumabilityData {
  containerState: string; // 'paused' | 'resumed'
  totalListeners: number;
  pendingListeners: number; // QRLs not yet loaded
  resumedListeners: number; // QRLs that have been triggered/loaded
  resumabilityScore: number; // 0-100, higher = more still paused = better
  listenerBreakdown: ListenerInfo[];
  serializationSize: number; // bytes of qwik/json
  serializationBreakdown: SerializationBreakdown;
  prefetchStatus: PrefetchInfo;
}

export interface ListenerInfo {
  event: string;
  elementId: string;
  qrl: string;
  loaded: boolean;
}

export interface SerializationBreakdown {
  totalObjects: number;
  signal: number;
  computed: number;
  qrl: number;
  string: number;
  number: number;
  object: number;
  array: number;
  other: number;
  rawSize: number;
  topObjects: { index: number; size: number; type: string; preview: string }[];
}

export interface PrefetchInfo {
  totalModules: number;
  loadedModules: number;
  pendingModules: number;
  totalSize: number;
  loadedSize: number;
}

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

export type MessageType =
  | 'DETECT_QWIK'
  | 'QWIK_DETECTION_RESULT'
  | 'DETECT_QWIK_ERROR'
  | 'GET_COMPONENT_TREE'
  | 'COMPONENT_TREE_RESULT'
  | 'GET_ROUTES'
  | 'ROUTES_RESULT'
  | 'PAGE_CHANGED'
  | 'START_INSPECT'
  | 'STOP_INSPECT'
  | 'ELEMENT_PICKED'
  | 'OK'
  | 'UNKNOWN'
  | `${string}_ERROR`;

/**
 * Runtime type guard for messages received from the extension messaging
 * channel. Validates shape before casting to avoid acting on malformed data.
 */
export function isExtensionMessage(msg: unknown): msg is ExtensionMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as Record<string, unknown>).type === 'string'
  );
}
