import { isRecord } from './constants.js';
import type { ComponentStateEntry } from './types.js';

export interface DisplayValue {
  text: string;
  cssClass: string;
}

const TYPE_COLORS: Record<string, string> = {
  signal: 'var(--signal-color)',
  computed: 'var(--computed-color)',
  qrl: 'var(--qrl-color)',
  string: 'var(--string-color)',
  number: 'var(--number-color)',
  boolean: 'var(--boolean-color)',
};

/** Get the CSS color variable for a state entry type */
export function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || 'var(--text-tertiary)';
}

/** Get the label for a state entry (e.g. "signal[0]", "computed[1]", "handler") */
export function getStateLabel(entry: ComponentStateEntry): string {
  switch (entry.type) {
    case 'signal':
      return `signal[${entry.index}]`;
    case 'computed':
      return `computed[${entry.index}]`;
    case 'qrl':
      return 'handler';
    default:
      return `prop[${entry.index}]`;
  }
}

/** Format a decoded state value for display */
export function formatDecodedValue(decoded: unknown): DisplayValue {
  if (isRecord(decoded)) {
    if (decoded.type === 'Signal' && 'value' in decoded) {
      return formatPrimitive(decoded.value);
    }
    if (decoded.type === 'QRL') {
      return {
        text: `QRL(${String(decoded.symbolName ?? '...')})`,
        cssClass: '',
      };
    }
    return { text: JSON.stringify(decoded), cssClass: '' };
  }
  return formatPrimitive(decoded);
}

function formatPrimitive(v: unknown): DisplayValue {
  if (typeof v === 'string') return { text: `"${v}"`, cssClass: 'string' };
  if (typeof v === 'number') return { text: String(v), cssClass: 'number' };
  if (typeof v === 'boolean') return { text: String(v), cssClass: 'boolean' };
  if (v === null) return { text: 'null', cssClass: 'null' };
  if (v === undefined) return { text: 'undefined', cssClass: 'null' };
  return { text: String(v), cssClass: '' };
}

/** Format a live state key for display */
export function formatLiveKey(key: string): string {
  if (key.startsWith('input:')) return key.substring(6);
  if (key.startsWith('checked:')) return key.substring(8);
  return key;
}

/** Get the live state type category */
export function getLiveType(key: string): string {
  if (key.startsWith('input:') || key === 'value') return 'value';
  if (key.startsWith('checked:') || key === 'checked') return 'boolean';
  if (key === 'open') return 'boolean';
  return 'attr';
}

/** Check if a live state key can be edited */
export function isEditableKey(key: string): boolean {
  return (
    key === 'value' ||
    key.startsWith('input:') ||
    key.startsWith('data-') ||
    key === 'checked' ||
    key === 'open' ||
    key.startsWith('aria-')
  );
}
