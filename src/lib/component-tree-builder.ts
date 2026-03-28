import {
  EVENT_ATTR_PREFIX,
  isRecord,
  QWIK_ATTR,
  QWIK_CONTAINER_SELECTOR,
  VIRTUAL_NODE_TAG,
} from './constants.js';
import {
  capitalize,
  deriveComponentName,
  extractNameFromNearbyElements,
  extractNameFromQrl,
  extractReadableFromKey,
} from './naming-heuristics.js';
import { cleanTree } from './tree-cleaner.js';
import type {
  ComponentContext,
  ComponentStateEntry,
  QwikComponentNode,
  QwikSerializedState,
} from './types.js';

export {
  capitalize,
  deriveComponentName,
  extractNameFromClasses,
  extractNameFromNearbyElements,
  extractNameFromQrl,
  extractReadableFromKey,
} from './naming-heuristics.js';
// Re-export for backward compatibility
export { cleanNode, cleanTree, isCssHash } from './tree-cleaner.js';

export function getComponentTree(): QwikComponentNode[] {
  const container = document.querySelector(QWIK_CONTAINER_SELECTOR);
  if (!container) return [];

  return buildTree(container, 0);
}

/**
 * Enrich the component tree with state from the serialized qwik/json.
 * Maps refs (q:id -> obj indices) and ctx (q:id -> component context) to nodes.
 */
export function enrichTreeWithState(
  tree: QwikComponentNode[],
  state: QwikSerializedState,
): QwikComponentNode[] {
  const enrichNode = (node: QwikComponentNode): QwikComponentNode => {
    const refsStr = state.refs[node.id];
    const stateEntries: ComponentStateEntry[] = [];

    if (refsStr) {
      const indices = refsStr
        .split(/\s+/)
        .map(Number)
        .filter((n) => !Number.isNaN(n));
      for (const idx of indices) {
        if (idx >= 0 && idx < state.objs.length) {
          const obj = state.objs[idx];
          stateEntries.push({
            index: obj.index,
            type: obj.type,
            rawValue: obj.rawValue,
            decodedValue: obj.decodedValue,
          });
        }
      }
    }

    let context: ComponentContext | null = null;
    const ctxData = state.ctx[node.id];
    if (ctxData) {
      const qrlName = extractNameFromQrl(ctxData.componentQrl);
      context = {
        componentQrl: ctxData.componentQrl,
        componentName: qrlName ?? undefined,
        props: ctxData.props,
      };

      if (qrlName && node.componentName === 'Component') {
        node.componentName = qrlName;
      }
    }

    const resolvedState = stateEntries.map((entry) => {
      if (entry.type === 'signal' && isRecord(entry.decodedValue)) {
        const decoded = entry.decodedValue;
        const valueIdx = Number(decoded.valueIndex);
        if (
          !Number.isNaN(valueIdx) &&
          valueIdx >= 0 &&
          valueIdx < state.objs.length
        ) {
          return {
            ...entry,
            decodedValue: {
              type: 'Signal',
              value: state.objs[valueIdx].rawValue,
              valueIndex: valueIdx,
            },
          };
        }
      }
      return entry;
    });

    return {
      ...node,
      hasContext: stateEntries.length > 0 || context !== null,
      state: resolvedState,
      context,
      children: node.children.map(enrichNode),
    };
  };

  return cleanTree(tree.map(enrichNode));
}

export function buildTree(
  root: Element,
  startDepth: number,
): QwikComponentNode[] {
  const nodes: QwikComponentNode[] = [];
  const stack: {
    node: QwikComponentNode;
    element: Element | Comment;
    isVirtual?: boolean;
  }[] = [];

  function addNodeToStack(
    componentNode: QwikComponentNode,
    domNode: Element | Comment,
    isVirtual = false,
  ) {
    while (
      stack.length > 0 &&
      !containsNode(stack[stack.length - 1].element, domNode)
    ) {
      stack.pop();
    }

    if (stack.length > 0) {
      componentNode.depth = stack[stack.length - 1].node.depth + 1;
      stack[stack.length - 1].node.children.push(componentNode);
    } else {
      nodes.push(componentNode);
    }

    stack.push({ node: componentNode, element: domNode, isVirtual });
  }

  const doc = root.ownerDocument;
  // 1 = SHOW_ELEMENT, 128 = SHOW_COMMENT (numeric for JSDOM compat)
  const walker = doc.createTreeWalker(root, 1 | 128);

  let autoId = 0;

  let current = walker.nextNode();

  while (current) {
    if (current.nodeType === 1 /* ELEMENT_NODE */) {
      const el = current as Element;
      if (isQwikElement(el)) {
        addNodeToStack(createComponentNode(el, startDepth, autoId++), el);
      }
    }

    if (current.nodeType === 8 /* COMMENT_NODE */) {
      const comment = current as Comment;
      if (comment.data.startsWith('qv')) {
        const virtualNode = parseVirtualNode(comment, startDepth);
        if (virtualNode) {
          addNodeToStack(virtualNode, comment, true);
        }
      } else if (comment.data.startsWith('/qv')) {
        // Closing virtual node: pop all entries up to and including
        // the matching opening <!--qv-->. Without this, sibling
        // elements after <!--/qv--> are incorrectly nested inside
        // the virtual node because containsNode for comments uses
        // parentNode.contains() which is too broad.
        while (stack.length > 0) {
          if (stack.pop()?.isVirtual) break;
        }
      }
    }

    current = walker.nextNode();
  }

  return nodes;
}

function containsNode(parent: Element | Comment, child: Node): boolean {
  if (parent.nodeType === 1) return (parent as Element).contains(child);
  return parent.parentNode?.contains(child) ?? false;
}

/**
 * An element is Qwik-managed if it has a q:id, a q:key, or any
 * Qwik event listener attribute (on:click, on-input, etc.).
 * This covers both v1 (q:id everywhere) and client-rendered
 * elements after SPA navigation where q:id may be absent.
 */
function isQwikElement(el: Element): boolean {
  if (el.hasAttribute(QWIK_ATTR.ID)) return true;
  if (el.hasAttribute(QWIK_ATTR.KEY)) return true;
  for (const attr of el.attributes) {
    if (
      attr.name.startsWith(EVENT_ATTR_PREFIX.COLON) ||
      attr.name.startsWith(EVENT_ATTR_PREFIX.DASH)
    ) {
      return true;
    }
  }
  return false;
}

function createComponentNode(
  element: Element,
  depth: number,
  autoId: number,
): QwikComponentNode {
  const qAttrs: Record<string, string> = {};

  for (const attr of element.attributes) {
    if (
      attr.name.startsWith('q:') ||
      attr.name.startsWith(EVENT_ATTR_PREFIX.COLON) ||
      attr.name.startsWith(EVENT_ATTR_PREFIX.DASH)
    ) {
      qAttrs[attr.name] = attr.value;
    }
  }

  const id = element.getAttribute(QWIK_ATTR.ID) ?? `_${autoId}`;
  const key = element.getAttribute(QWIK_ATTR.KEY);
  const tag = element.tagName.toLowerCase();

  let componentName = deriveComponentName(element);

  const isGeneric = componentName === tag || componentName === capitalize(tag);

  // If still generic, try event-handler QRL attributes
  if (isGeneric) {
    for (const value of Object.values(qAttrs)) {
      const qrlName = extractNameFromQrl(value);
      if (qrlName) {
        componentName = qrlName;
        break;
      }
    }
  }

  // If still generic, try the q:key attribute
  if (key && (componentName === tag || componentName === capitalize(tag))) {
    const keyName = extractReadableFromKey(key);
    if (keyName) componentName = keyName;
  }

  return {
    id,
    key,
    tagName: tag,
    componentName,
    children: [],
    depth,
    hasContext: false,
    attributes: qAttrs,
    state: [],
    context: null,
  };
}

function parseVirtualNode(
  comment: Comment,
  depth: number,
): QwikComponentNode | null {
  const data = comment.data.trim();

  const idMatch = data.match(/q:id=(\S+)/);
  const keyMatch = data.match(/q:key=(\S+)/);

  if (!idMatch) return null;

  const attrs: Record<string, string> = {};
  const attrRegex = /([\w:.-]+)=([\S]+)/g;
  for (
    let match = attrRegex.exec(data);
    match !== null;
    match = attrRegex.exec(data)
  ) {
    attrs[match[1]] = match[2];
  }

  const key = keyMatch ? keyMatch[1] : null;

  let componentName = 'Component';

  if (key) {
    const readable = extractReadableFromKey(key);
    if (readable) componentName = readable;
  }

  if (componentName === 'Component') {
    const childName = extractNameFromNearbyElements(comment);
    if (childName) componentName = childName;
  }

  return {
    id: idMatch[1],
    key,
    tagName: VIRTUAL_NODE_TAG,
    componentName,
    children: [],
    depth,
    hasContext: false,
    attributes: attrs,
    state: [],
    context: null,
  };
}
