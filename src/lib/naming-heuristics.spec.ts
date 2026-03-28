import { describe, expect, it } from 'vitest';
import { extractReadableFromKey } from './naming-heuristics.js';

describe('extractReadableFromKey — prefix-hash keys', () => {
  it('extracts "Builder" from builder-444ffd33189042356b64affba7ee1190f', () => {
    expect(
      extractReadableFromKey('builder-444ffd33189042356b64affba7ee1190f'),
    ).toBe('Builder');
  });

  it('extracts "Header" from header-abc123def456', () => {
    expect(extractReadableFromKey('header-abc123def456')).toBe('Header');
  });

  it('returns null for prefix shorter than 3 characters (ab-123456)', () => {
    expect(extractReadableFromKey('ab-123456')).toBeNull();
  });

  it('returns "Default" for "default" (long alpha string is capitalized)', () => {
    // "default" is 7 chars, all alphabetic, so the fallback branch capitalizes it
    expect(extractReadableFromKey('default')).toBe('Default');
  });
});
