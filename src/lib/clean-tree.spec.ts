import { describe, expect, it } from 'vitest';
import { cleanTree, isCssHash } from './tree-cleaner.js';
import type { QwikComponentNode } from './types.js';

function makeNode(
  overrides: Partial<QwikComponentNode> = {},
): QwikComponentNode {
  return {
    id: '0',
    key: null,
    tagName: 'div',
    componentName: 'div',
    children: [],
    depth: 0,
    hasContext: false,
    attributes: {},
    state: [],
    context: null,
    ...overrides,
  };
}

describe('isCssHash', () => {
  it('detects CSS hash names', () => {
    expect(isCssHash('Cxmqbja')).toBe(true);
    expect(isCssHash('Cvlpw')).toBe(true);
    expect(isCssHash('Cbqfr')).toBe(true);
  });

  it('does not flag real component names', () => {
    expect(isCssHash('DocSearch')).toBe(false);
    expect(isCssHash('Header')).toBe(false);
    expect(isCssHash('Navigation')).toBe(false);
    expect(isCssHash('Button')).toBe(false);
    expect(isCssHash('Footer')).toBe(false);
    expect(isCssHash('Link')).toBe(false);
    expect(isCssHash('Main')).toBe(false);
  });

  it('does not flag short names', () => {
    expect(isCssHash('ab')).toBe(false);
    expect(isCssHash('a')).toBe(false);
  });

  it('does not flag names with vowels', () => {
    expect(isCssHash('Abcde')).toBe(false); // has 2 vowels
    expect(isCssHash('Image')).toBe(false);
  });
});

describe('cleanTree', () => {
  it('filters out boring tags without state', () => {
    const tree = [
      makeNode({ tagName: 'link', componentName: 'link', id: '1' }),
      makeNode({ tagName: 'script', componentName: 'script', id: '2' }),
      makeNode({ tagName: 'div', componentName: 'Header', id: '3' }),
    ];

    const result = cleanTree(tree);
    expect(result.length).toBe(1);
    expect(result[0].componentName).toBe('Header');
  });

  it('keeps boring tags that have state', () => {
    const tree = [
      makeNode({
        tagName: 'script',
        componentName: 'script',
        id: '1',
        hasContext: true,
        state: [{ index: 0, type: 'object', rawValue: {}, decodedValue: {} }],
      }),
    ];

    const result = cleanTree(tree);
    expect(result.length).toBe(1);
  });

  it('keeps boring tags that have children', () => {
    const tree = [
      makeNode({
        tagName: 'style',
        componentName: 'style',
        id: '1',
        children: [makeNode({ id: '2', componentName: 'Theme' })],
      }),
    ];

    const result = cleanTree(tree);
    expect(result.length).toBe(1);
  });

  it('filters out CSS hash nodes without state', () => {
    const tree = [
      makeNode({ componentName: 'Cxmqbja', id: '1' }),
      makeNode({ componentName: 'Header', id: '2' }),
    ];

    const result = cleanTree(tree);
    expect(result.length).toBe(1);
    expect(result[0].componentName).toBe('Header');
  });

  it('flattens CSS hash div with single child', () => {
    const tree = [
      makeNode({
        componentName: 'Cxmqbja',
        tagName: 'div',
        id: '1',
        children: [makeNode({ id: '2', componentName: 'Button' })],
      }),
    ];

    const result = cleanTree(tree);
    expect(result.length).toBe(1);
    // div with CSS hash name + 1 child = flattened to the child
    expect(result[0].componentName).toBe('Button');
    expect(result[0].id).toBe('2');
  });

  it('flattens single-child generic nodes without state', () => {
    const inner = makeNode({
      id: '2',
      componentName: 'Header',
      tagName: 'header',
      depth: 2,
    });
    const middle = makeNode({
      id: '1',
      componentName: 'div',
      tagName: 'div',
      depth: 1,
      children: [inner],
    });
    const outer = makeNode({
      id: '0',
      componentName: 'div',
      tagName: 'div',
      depth: 0,
      children: [middle],
    });

    const result = cleanTree([outer]);
    expect(result.length).toBe(1);
    // Should flatten div > div > Header into just Header
    expect(result[0].componentName).toBe('Header');
    expect(result[0].depth).toBe(0);
  });

  it('does not flatten nodes with state', () => {
    const inner = makeNode({ id: '2', componentName: 'Button', depth: 1 });
    const outer = makeNode({
      id: '1',
      componentName: 'div',
      tagName: 'div',
      depth: 0,
      hasContext: true,
      state: [{ index: 0, type: 'signal', rawValue: 'x', decodedValue: 'x' }],
      children: [inner],
    });

    const result = cleanTree([outer]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1'); // outer preserved
    expect(result[0].children.length).toBe(1);
  });

  it('does not flatten virtual nodes', () => {
    const inner = makeNode({ id: '2', componentName: 'Button', depth: 1 });
    const outer = makeNode({
      id: '1',
      componentName: 'Component',
      tagName: '<!--qv-->',
      depth: 0,
      children: [inner],
    });

    const result = cleanTree([outer]);
    expect(result.length).toBe(1);
    expect(result[0].tagName).toBe('<!--qv-->');
    expect(result[0].children.length).toBe(1);
  });

  it('does not flatten nodes with event handlers', () => {
    const inner = makeNode({ id: '2', componentName: 'Icon', depth: 1 });
    const outer = makeNode({
      id: '1',
      componentName: 'div',
      tagName: 'div',
      depth: 0,
      attributes: { 'on:click': './chunk.js#handler' },
      children: [inner],
    });

    const result = cleanTree([outer]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
    expect(result[0].children.length).toBe(1);
  });
});

describe('cleanTree with skipFlattening', () => {
  it('does NOT flatten single-child generic nodes when skipFlattening=true', () => {
    const inner = makeNode({
      id: '2',
      componentName: 'Header',
      tagName: 'header',
      depth: 1,
    });
    const outer = makeNode({
      id: '1',
      componentName: 'div',
      tagName: 'div',
      depth: 0,
      children: [inner],
    });

    const result = cleanTree([outer], true);
    expect(result.length).toBe(1);
    // Outer div is preserved (not flattened)
    expect(result[0].id).toBe('1');
    expect(result[0].componentName).toBe('div');
    expect(result[0].children.length).toBe(1);
    expect(result[0].children[0].id).toBe('2');
  });

  it('DOES flatten single-child generic nodes when skipFlattening=false (default)', () => {
    const inner = makeNode({
      id: '2',
      componentName: 'Header',
      tagName: 'header',
      depth: 1,
    });
    const outer = makeNode({
      id: '1',
      componentName: 'div',
      tagName: 'div',
      depth: 0,
      children: [inner],
    });

    const result = cleanTree([outer], false);
    expect(result.length).toBe(1);
    // Outer div is flattened away; Header is promoted
    expect(result[0].id).toBe('2');
    expect(result[0].componentName).toBe('Header');
  });

  it('passes skipFlattening recursively to children', () => {
    const grandchild = makeNode({
      id: '3',
      componentName: 'Button',
      tagName: 'button',
      depth: 2,
    });
    const child = makeNode({
      id: '2',
      componentName: 'span',
      tagName: 'span',
      depth: 1,
      children: [grandchild],
    });
    const root = makeNode({
      id: '1',
      componentName: 'div',
      tagName: 'div',
      depth: 0,
      children: [child],
    });

    // With skipFlattening=true, no level should be flattened
    const result = cleanTree([root], true);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
    expect(result[0].children.length).toBe(1);
    expect(result[0].children[0].id).toBe('2');
    expect(result[0].children[0].children.length).toBe(1);
    expect(result[0].children[0].children[0].id).toBe('3');

    // With skipFlattening=false, both levels flatten -> just Button
    const flatResult = cleanTree([root], false);
    expect(flatResult.length).toBe(1);
    expect(flatResult[0].id).toBe('3');
    expect(flatResult[0].componentName).toBe('Button');
  });

  it('still removes boring tags when skipFlattening=true', () => {
    const tree = [
      makeNode({ tagName: 'link', componentName: 'link', id: '1' }),
      makeNode({ tagName: 'script', componentName: 'script', id: '2' }),
      makeNode({ tagName: 'div', componentName: 'Header', id: '3' }),
    ];

    const result = cleanTree(tree, true);
    expect(result.length).toBe(1);
    expect(result[0].componentName).toBe('Header');
  });

  it('still removes CSS hash nodes when skipFlattening=true', () => {
    const tree = [
      makeNode({ componentName: 'Cxmqbja', id: '1' }),
      makeNode({ componentName: 'Header', id: '2' }),
    ];

    const result = cleanTree(tree, true);
    expect(result.length).toBe(1);
    expect(result[0].componentName).toBe('Header');
  });
});
