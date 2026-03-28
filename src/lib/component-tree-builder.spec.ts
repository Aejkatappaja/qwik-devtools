import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { buildTree } from './component-tree-builder.js';
import {
  NO_QID_QWIK_ELEMENTS_HTML,
  NO_QWIK_HTML,
  PROD_QRL_ELEMENT_HTML,
  QWIK_CONTAINER_HTML,
  SIBLING_VIRTUAL_NODES_HTML,
} from './fixtures/sample-qwik-html.js';

/**
 * JSDOM doesn't support CSS selectors with escaped colons like [q\:container].
 * This helper iterates all elements to find the first Qwik container.
 */
function findQwikContainer(doc: Document): Element | null {
  for (const el of doc.querySelectorAll('*')) {
    if (el.getAttribute('q:container') !== null) return el;
  }
  return null;
}

describe('component-tree-builder', () => {
  it('builds a tree from Qwik DOM', () => {
    const dom = new JSDOM(QWIK_CONTAINER_HTML);
    const container = findQwikContainer(dom.window.document);
    const tree = container ? buildTree(container, 0) : [];

    expect(tree.length).toBeGreaterThan(0);
    expect(tree[0].id).toBe('0');
    expect(tree[0].tagName).toBe('div');
  });

  it('nests children correctly', () => {
    const dom = new JSDOM(QWIK_CONTAINER_HTML);
    const container = findQwikContainer(dom.window.document);
    const tree = container ? buildTree(container, 0) : [];

    const root = tree[0];
    // div#0 has children: h1#1, div#2
    expect(root.children.length).toBe(2);
    expect(root.children[0].id).toBe('1');
    expect(root.children[0].tagName).toBe('h1');
    expect(root.children[1].id).toBe('2');
  });

  it('deeply nests button inside counter div', () => {
    const dom = new JSDOM(QWIK_CONTAINER_HTML);
    const container = findQwikContainer(dom.window.document);
    const tree = container ? buildTree(container, 0) : [];

    const counterDiv = tree[0].children[1]; // div#2
    expect(counterDiv.children.length).toBe(1);
    expect(counterDiv.children[0].id).toBe('3');
    expect(counterDiv.children[0].tagName).toBe('button');
  });

  it('returns empty array for non-Qwik page', () => {
    const dom = new JSDOM(NO_QWIK_HTML);
    const container = findQwikContainer(dom.window.document);
    const tree = container ? buildTree(container, 0) : [];
    expect(tree).toEqual([]);
  });

  it('assigns correct depth levels', () => {
    const dom = new JSDOM(QWIK_CONTAINER_HTML);
    const container = findQwikContainer(dom.window.document);
    const tree = container ? buildTree(container, 0) : [];

    expect(tree[0].depth).toBe(0);
    expect(tree[0].children[0].depth).toBe(1);
    expect(tree[0].children[1].children[0].depth).toBe(2);
  });
});

describe('sibling virtual nodes with <!--/qv--> handling', () => {
  function getTree() {
    const dom = new JSDOM(SIBLING_VIRTUAL_NODES_HTML);
    const container = findQwikContainer(dom.window.document);
    return container ? buildTree(container, 0) : [];
  }

  it('sibling virtual nodes are top-level siblings, not nested', () => {
    const tree = getTree();
    // There should be 3 top-level nodes:
    //   virtual#1 (HeaderComp), virtual#4 (MainComp), footer#7
    expect(tree.length).toBe(3);
    expect(tree[0].id).toBe('1');
    expect(tree[1].id).toBe('4');
    expect(tree[2].id).toBe('7');
  });

  it('each virtual node has the correct children', () => {
    const tree = getTree();

    // HeaderComp virtual node contains header#2
    const headerVirtual = tree[0];
    expect(headerVirtual.componentName).toBe('HeaderComp');
    expect(headerVirtual.children.length).toBe(1);
    expect(headerVirtual.children[0].id).toBe('2');
    expect(headerVirtual.children[0].tagName).toBe('header');
    // header#2 contains nav#3
    expect(headerVirtual.children[0].children.length).toBe(1);
    expect(headerVirtual.children[0].children[0].id).toBe('3');

    // MainComp virtual node contains main#5
    const mainVirtual = tree[1];
    expect(mainVirtual.componentName).toBe('MainComp');
    expect(mainVirtual.children.length).toBe(1);
    expect(mainVirtual.children[0].id).toBe('5');
    expect(mainVirtual.children[0].tagName).toBe('main');
    // main#5 contains p#6
    expect(mainVirtual.children[0].children.length).toBe(1);
    expect(mainVirtual.children[0].children[0].id).toBe('6');
  });

  it('footer is a top-level node, not nested inside a virtual node', () => {
    const tree = getTree();
    const footer = tree[2];
    expect(footer.id).toBe('7');
    expect(footer.tagName).toBe('footer');
    expect(footer.componentName).toBe('Footer');
    // Footer should be at the top level, not a child of any virtual node
    expect(tree[0].children.every((c) => c.id !== '7')).toBe(true);
    expect(tree[1].children.every((c) => c.id !== '7')).toBe(true);
  });

  it('assigns correct depth for all nodes', () => {
    const tree = getTree();

    // Top-level nodes at depth 0
    expect(tree[0].depth).toBe(0); // virtual HeaderComp
    expect(tree[1].depth).toBe(0); // virtual MainComp
    expect(tree[2].depth).toBe(0); // footer

    // Children at depth 1
    expect(tree[0].children[0].depth).toBe(1); // header#2
    expect(tree[1].children[0].depth).toBe(1); // main#5

    // Grandchildren at depth 2
    expect(tree[0].children[0].children[0].depth).toBe(2); // nav#3
    expect(tree[1].children[0].children[0].depth).toBe(2); // p#6
  });
});

describe('isQwikElement detection', () => {
  function getTree() {
    const dom = new JSDOM(NO_QID_QWIK_ELEMENTS_HTML);
    const container = findQwikContainer(dom.window.document);
    return container ? buildTree(container, 0) : [];
  }

  it('includes elements with on:click but no q:id', () => {
    const tree = getTree();
    const root = tree[0]; // div#0
    const button = root.children.find((c) => c.tagName === 'button');
    expect(button).toBeDefined();
    expect(button?.attributes['on:click']).toBeDefined();
  });

  it('includes elements with q:key but no q:id', () => {
    const tree = getTree();
    const root = tree[0]; // div#0
    const span = root.children.find((c) => c.tagName === 'span');
    expect(span).toBeDefined();
    expect(span?.key).toBe('myKey_0');
  });

  it('assigns synthetic IDs starting with _ for elements without q:id', () => {
    const tree = getTree();
    const root = tree[0]; // div#0 (has real q:id)
    expect(root.id).toBe('0');

    // Both button and span lack q:id and should get synthetic IDs
    const button = root.children.find((c) => c.tagName === 'button');
    const span = root.children.find((c) => c.tagName === 'span');
    expect(button?.id).toMatch(/^_\d+$/);
    expect(span?.id).toMatch(/^_\d+$/);
  });

  it('excludes elements with no Qwik attributes', () => {
    const tree = getTree();
    const root = tree[0]; // div#0

    // The <p>plain paragraph</p> has no Qwik attributes
    const paragraph = root.children.find((c) => c.tagName === 'p');
    expect(paragraph).toBeUndefined();
  });
});

describe('QRL name extraction in createComponentNode', () => {
  it('extracts component name from dev-mode QRL in on:click', () => {
    const dom = new JSDOM(NO_QID_QWIK_ELEMENTS_HTML);
    const container = findQwikContainer(dom.window.document);
    const tree = container ? buildTree(container, 0) : [];

    const root = tree[0];
    const button = root.children.find((c) => c.tagName === 'button');
    // on:click="./chunk.js#DocSearch_onClick[0]" -> "DocSearch"
    expect(button).toBeDefined();
    expect(button?.componentName).toBe('DocSearch');
  });

  it('does not extract a name from prod-mode QRL (stays tag-based)', () => {
    const dom = new JSDOM(PROD_QRL_ELEMENT_HTML);
    const container = findQwikContainer(dom.window.document);
    const tree = container ? buildTree(container, 0) : [];

    const root = tree[0];
    const button = root.children.find((c) => c.tagName === 'button');
    // on:click="./chunk.js#s_abc123[0]" -> prod symbol, no name extracted
    expect(button).toBeDefined();
    expect(button?.componentName).toBe('Button'); // semantic tag fallback
  });
});
