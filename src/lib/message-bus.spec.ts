import { describe, expect, it, vi } from 'vitest';
import { MessageBus } from './message-bus.js';

describe('MessageBus', () => {
  it('dispatches to registered handler', () => {
    const bus = new MessageBus();
    const handler = vi.fn();
    bus.on('QWIK_DETECTION_RESULT', handler);

    bus.dispatch({
      type: 'QWIK_DETECTION_RESULT',
      payload: { detected: true },
    });

    expect(handler).toHaveBeenCalledWith({ detected: true });
  });

  it('returns true when handler found', () => {
    const bus = new MessageBus();
    bus.on('QWIK_DETECTION_RESULT', () => {});

    expect(bus.dispatch({ type: 'QWIK_DETECTION_RESULT' })).toBe(true);
  });

  it('returns false when no handler found', () => {
    const bus = new MessageBus();

    expect(bus.dispatch({ type: 'QWIK_DETECTION_RESULT' })).toBe(false);
  });

  it('removes handler with off()', () => {
    const bus = new MessageBus();
    const handler = vi.fn();
    bus.on('QWIK_DETECTION_RESULT', handler);
    bus.off('QWIK_DETECTION_RESULT');

    bus.dispatch({ type: 'QWIK_DETECTION_RESULT', payload: {} });

    expect(handler).not.toHaveBeenCalled();
  });

  it('clears all handlers', () => {
    const bus = new MessageBus();
    bus.on('QWIK_DETECTION_RESULT', () => {});
    bus.on('COMPONENT_TREE_RESULT', () => {});
    bus.clear();

    expect(bus.dispatch({ type: 'QWIK_DETECTION_RESULT' })).toBe(false);
    expect(bus.dispatch({ type: 'COMPONENT_TREE_RESULT' })).toBe(false);
  });

  it('replaces handler for same type', () => {
    const bus = new MessageBus();
    const first = vi.fn();
    const second = vi.fn();
    bus.on('QWIK_DETECTION_RESULT', first);
    bus.on('QWIK_DETECTION_RESULT', second);

    bus.dispatch({ type: 'QWIK_DETECTION_RESULT' });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
  });

  it('supports chaining', () => {
    const bus = new MessageBus();
    const result = bus
      .on('QWIK_DETECTION_RESULT', () => {})
      .on('COMPONENT_TREE_RESULT', () => {});
    expect(result).toBe(bus);
  });
});
