import type { ExtensionMessage, MessageType } from './types.js';

type Handler<T> = (payload: T) => void;

/**
 * Type-safe message bus for extension messaging.
 *
 * Register handlers with `on('MESSAGE_TYPE', (payload) => ...)` and
 * dispatch messages with `dispatch(msg)`. Each handler receives the
 * payload already narrowed to the registered type.
 *
 * @example
 * ```ts
 * const bus = new MessageBus();
 * bus.on('QWIK_DETECTION_RESULT', (payload: QwikContainerInfo) => { ... });
 * bus.dispatch(msg); // auto-routes to the right handler
 * ```
 */
export class MessageBus {
  private handlers = new Map<MessageType, Handler<unknown>>();

  on<K extends MessageType, T = unknown>(type: K, handler: Handler<T>): this {
    this.handlers.set(type, handler as Handler<unknown>);
    return this;
  }

  off(type: MessageType): this {
    this.handlers.delete(type);
    return this;
  }

  dispatch(msg: ExtensionMessage): boolean {
    const handler = this.handlers.get(msg.type);
    if (handler) {
      handler(msg.payload);
      return true;
    }
    return false;
  }

  clear(): void {
    this.handlers.clear();
  }
}
