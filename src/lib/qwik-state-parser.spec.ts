import { describe, expect, it } from 'vitest';
import { detectObjectType } from './qwik-state-parser.js';
import {
  BASIC_STATE_JSON,
  EMPTY_STATE_JSON,
} from './fixtures/sample-qwik-json.js';

describe('detectObjectType', () => {
  it('detects string type', () => {
    expect(detectObjectType('hello')).toBe('string');
  });

  it('detects number type', () => {
    expect(detectObjectType(42)).toBe('number');
  });

  it('detects boolean type', () => {
    expect(detectObjectType(true)).toBe('boolean');
  });

  it('detects null type', () => {
    expect(detectObjectType(null)).toBe('null');
  });

  it('detects array type', () => {
    expect(detectObjectType(['a', 'b'])).toBe('array');
  });

  it('detects object type', () => {
    expect(detectObjectType({ key: 'value' })).toBe('object');
  });

  it('detects signal prefix \\u0012', () => {
    expect(detectObjectType('\u00120')).toBe('signal');
  });

  it('detects computed prefix \\u0011', () => {
    expect(detectObjectType('\u00113@4')).toBe('computed');
  });

  it('detects QRL prefix \\u0002', () => {
    expect(detectObjectType('\u0002./chunk.js#sym[0 1]')).toBe('qrl');
  });

  it('detects element ref with # prefix', () => {
    expect(detectObjectType('#5')).toBe('element-ref');
  });

  it('detects text ref with * prefix', () => {
    expect(detectObjectType('*7')).toBe('text-ref');
  });

  it('handles empty string as string', () => {
    expect(detectObjectType('')).toBe('string');
  });

  it('handles undefined', () => {
    expect(detectObjectType(undefined)).toBe('undefined');
  });
});

describe('parseObjects from fixture', () => {
  it('parses the basic state JSON correctly', () => {
    const parsed = JSON.parse(BASIC_STATE_JSON);
    expect(parsed.objs).toHaveLength(12);
    expect(parsed.refs).toHaveProperty('0');
    expect(parsed.ctx).toHaveProperty('0');
  });

  it('parses empty state JSON', () => {
    const parsed = JSON.parse(EMPTY_STATE_JSON);
    expect(parsed.objs).toHaveLength(0);
    expect(Object.keys(parsed.refs)).toHaveLength(0);
  });
});
