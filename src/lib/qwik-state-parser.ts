import {
  isRecord,
  QWIK_JSON_SCRIPT_TYPE,
  SERIALIZATION_PREFIX,
} from './constants.js';
import type {
  QwikContext,
  QwikObjectType,
  QwikSerializedObject,
  QwikSerializedState,
} from './types.js';

export function getSerializedState(): QwikSerializedState | null {
  const scriptEl = document.querySelector(
    `script[type="${QWIK_JSON_SCRIPT_TYPE}"]`,
  );
  if (!scriptEl?.textContent) return null;

  const raw = scriptEl.textContent;

  try {
    const parsed = JSON.parse(raw);
    return {
      raw,
      refs: parsed.refs ?? {},
      ctx: parseContexts(parsed.ctx ?? {}),
      objs: parseObjects(parsed.objs ?? []),
      subs: parsed.subs ?? [],
    };
  } catch {
    return null;
  }
}

function parseContexts(
  ctx: Record<string, unknown>,
): Record<string, QwikContext> {
  const result: Record<string, QwikContext> = {};

  for (const [key, value] of Object.entries(ctx)) {
    if (isRecord(value)) {
      result[key] = {
        componentQrl: typeof value.w === 'string' ? value.w : undefined,
        props: isRecord(value.s) ? value.s : undefined,
        tasks: Array.isArray(value.i) ? value.i : undefined,
      };
    }
  }

  return result;
}

function parseObjects(objs: unknown[]): QwikSerializedObject[] {
  return objs.map((rawValue, index) => {
    const type = detectObjectType(rawValue);
    const decodedValue = decodeObject(rawValue, type);
    return { index, rawValue, type, decodedValue };
  });
}

export function detectObjectType(value: unknown): QwikObjectType {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';

  if (typeof value === 'string') {
    if (value.length === 0) return 'string';

    const code = value.charCodeAt(0);

    if (code === SERIALIZATION_PREFIX.SIGNAL) return 'signal';
    if (code === SERIALIZATION_PREFIX.COMPUTED) return 'computed';
    if (code === SERIALIZATION_PREFIX.QRL) return 'qrl';

    if (value.startsWith('#')) return 'element-ref';
    if (value.startsWith('*')) return 'text-ref';

    return 'string';
  }

  if (typeof value === 'object') return 'object';

  return 'unknown';
}

function decodeObject(value: unknown, type: QwikObjectType): unknown {
  if (typeof value !== 'string') return value;

  switch (type) {
    case 'signal':
      return { type: 'Signal', valueIndex: value.substring(1) };

    case 'computed': {
      const rest = value.substring(1);
      const atIdx = rest.indexOf('@');
      if (atIdx >= 0) {
        return {
          type: 'Computed',
          valueIndex: rest.substring(0, atIdx),
          funcIndex: rest.substring(atIdx + 1),
        };
      }
      return { type: 'Computed', valueIndex: rest };
    }

    case 'qrl': {
      const rest = value.substring(1);
      return parseQrlValue(rest);
    }

    case 'element-ref':
      return { type: 'ElementRef', qId: value.substring(1) };

    case 'text-ref':
      return { type: 'TextRef', id: value.substring(1) };

    default:
      return value;
  }
}

function parseQrlValue(qrl: string): object {
  const hashIdx = qrl.indexOf('#');
  const bracketIdx = qrl.indexOf('[');

  const chunkUrl = hashIdx >= 0 ? qrl.substring(0, hashIdx) : qrl;
  const symbolEnd = bracketIdx >= 0 ? bracketIdx : qrl.length;
  const symbolName = hashIdx >= 0 ? qrl.substring(hashIdx + 1, symbolEnd) : '';

  let capturedIndices: number[] = [];
  if (bracketIdx >= 0) {
    const captureStr = qrl.substring(bracketIdx + 1, qrl.length - 1);
    capturedIndices = captureStr.split(' ').filter(Boolean).map(Number);
  }

  return { type: 'QRL', chunkUrl, symbolName, capturedIndices };
}
