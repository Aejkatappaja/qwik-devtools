import {
  EVENT_ATTR_PREFIX,
  RE_CSS_HASH,
  RE_KNOWN_PREFIX,
  RE_VOWELS,
  VIRTUAL_NODE_TAG,
} from './constants.js';
import { capitalize } from './naming-heuristics.js';
import type { QwikComponentNode } from './types.js';

const BORING_TAGS = new Set([
  'link',
  'script',
  'style',
  'meta',
  'noscript',
  'br',
  'hr',
  'wbr',
]);

const GENERIC_NAMES = new Set([
  'div',
  'span',
  'section',
  'article',
  'main',
  'aside',
  'body',
]);

/**
 * Clean the tree to reduce noise:
 * 1. Filter out uninteresting DOM elements (link, script, style, meta, etc.)
 * 2. Filter out nodes with CSS hash names (Cxmqbja, Cv1pw7l, etc.)
 * 3. Flatten single-child nodes that have no state (HeaderContainer > HeaderContainer > Header -> Header)
 *
 * When {@link skipFlattening} is true, step 3 is skipped. This is used
 * when the container has resumed and qwik/json enrichment is unavailable:
 * without enrichment `hasContext` is always false and the flattening
 * would incorrectly collapse stateful wrapper nodes.
 */
export function cleanTree(
  nodes: QwikComponentNode[],
  skipFlattening = false,
): QwikComponentNode[] {
  return nodes
    .map((n) => cleanNode(n, skipFlattening))
    .filter((n): n is QwikComponentNode => n !== null);
}

export function cleanNode(
  node: QwikComponentNode,
  skipFlattening = false,
): QwikComponentNode | null {
  if (
    BORING_TAGS.has(node.tagName) &&
    !node.hasContext &&
    node.children.length === 0
  ) {
    return null;
  }

  if (
    isCssHash(node.componentName) &&
    !node.hasContext &&
    node.children.length === 0
  ) {
    return null;
  }

  const children = cleanTree(node.children, skipFlattening);

  let componentName = node.componentName;
  if (isCssHash(componentName)) {
    componentName =
      node.tagName === VIRTUAL_NODE_TAG
        ? 'Component'
        : capitalize(node.tagName);
  }

  if (
    !skipFlattening &&
    !node.hasContext &&
    children.length === 1 &&
    node.tagName !== VIRTUAL_NODE_TAG &&
    isGenericName(componentName) &&
    !hasEventHandlers(node)
  ) {
    const child = children[0];
    return {
      ...child,
      depth: node.depth,
      children: child.children.map((c) => adjustDepth(c, node.depth + 1)),
    };
  }

  return { ...node, componentName, children };
}

/**
 * Detects CSS hash names (e.g. Cxmqbja, Cv1pw7l) by checking for short (3-10 char),
 * uppercase-starting strings with few vowels that don't match common component prefixes.
 */
export function isCssHash(name: string): boolean {
  if (name.length < 3 || name.length > 10) return false;
  if (RE_CSS_HASH.test(name) && !RE_KNOWN_PREFIX.test(name)) {
    RE_VOWELS.lastIndex = 0;
    const vowels = (name.match(RE_VOWELS) || []).length;
    if (vowels <= 1 && name.length >= 5) return true;
  }
  return false;
}

function isGenericName(name: string): boolean {
  return GENERIC_NAMES.has(name.toLowerCase());
}

function hasEventHandlers(node: QwikComponentNode): boolean {
  return Object.keys(node.attributes).some(
    (k) =>
      k.startsWith(EVENT_ATTR_PREFIX.COLON) ||
      k.startsWith(EVENT_ATTR_PREFIX.DASH),
  );
}

export function adjustDepth(
  node: QwikComponentNode,
  startDepth: number,
): QwikComponentNode {
  const diff = startDepth - node.depth;
  return {
    ...node,
    depth: startDepth,
    children: node.children.map((c) => adjustDepth(c, c.depth + diff)),
  };
}
