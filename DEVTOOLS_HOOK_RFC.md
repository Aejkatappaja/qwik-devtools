# RFC: Add `__QWIK_DEVTOOLS_HOOK__` for Browser Extension Integration

## Summary

Propose adding a global devtools hook to Qwik's signal system, enabling browser extensions to inspect live signal values, track state changes, and display component names , similar to React's `__REACT_DEVTOOLS_GLOBAL_HOOK__` and Vue's `__VUE_DEVTOOLS_GLOBAL_HOOK__`.

## Motivation

I built [Qwik DevTools](https://github.com/Aejkatappaja/qwik-devtools), a browser extension (Chrome, Firefox, Arc, Brave) that provides:

- Component tree visualization
- State/signals inspector
- Live DOM watching
- Element picker
- Resumability score tracker
- Serialization size analysis
- Assets & image CLS audit
- Route explorer

The extension currently reads the `<script type="qwik/json">` for the SSR snapshot and uses `inspectedWindow.eval()` for live DOM values. **However, after the app resumes, signals live in JS memory and are invisible to the extension.** There is no way to:

1. Read live signal values from outside the framework
2. Get notified when a signal changes
3. Map a DOM element to its component name and signals
4. Track which signals triggered a re-render

React and Vue solved this by exposing a global hook object that their devtools extensions consume. Qwik currently has no equivalent.

### v1 → v2 breakage: why a stable API matters now

The extension works on Qwik v1 by reading DOM conventions (`q:id`, `q:key`, `on:click`, `<!--qv-->` comments, `<script type="qwik/json">`). **Qwik v2 changed all of these internal formats:**

| Feature | v1 | v2 |
|---|---|---|
| Element IDs | `q:id="0"` | `:="CL_1"` |
| Keys | `q:key="counter_1"` | removed |
| Event handlers | `on:click="./chunk.js#fn"` | `q-e:click="/@qwik-handlers#_run#2"` |
| Virtual nodes | `<!--qv q:id=4-->` comments in DOM | `<script type="qwik/vnode">` (separate from DOM) |
| Serialized state | `<script type="qwik/json">` with `{refs, ctx, objs, subs}` | `<script type="qwik/state">` (compact binary-ish format) |
| Runtime marker | n/a | `q:runtime="2"` |

This means the extension is **v1-only today** , not because of a bug, but because there is no stable contract for external tools to rely on. Every time Qwik changes its internal serialization, all external tooling breaks.

A `__QWIK_DEVTOOLS_HOOK__` would provide a **versioned, stable API** that survives internal format changes , the same pattern that has worked for React (since 2015) and Vue (since 2016) across multiple major versions.

## Proposed API

```typescript
// Exposed on window when devtools are detected
interface QwikDevtoolsHook {
  version: 1;

  // Signal inspection
  getSignalValue(signal: Signal<unknown>): unknown;
  getSignalsForElement(element: Element): Array<{
    name: string | null; // variable name if available (dev mode)
    value: unknown;
    subscribers: number;
  }>;

  // Change tracking
  onSignalUpdate(
    callback: (info: {
      signal: Signal<unknown>;
      oldValue: unknown;
      newValue: unknown;
      element: Element | null;
    }) => void,
  ): () => void; // returns unsubscribe fn

  // Component info
  getComponentName(element: Element): string | null;
  getComponentContext(element: Element): {
    props: Record<string, unknown>;
    signals: Array<{ name: string | null; value: unknown }>;
    tasks: number;
  } | null;

  // Render tracking
  onRender(
    callback: (info: {
      element: Element;
      duration: number;
      reason: "signal" | "task" | "initial";
    }) => void,
  ): () => void;
}
```

## Where to inject in Qwik source

> **Note:** The paths below reference the v1 codebase. v2 may have reorganized these, but the injection points (signal setter, subscription manager, render cycle) should have equivalents.

### Signal read/write  - `packages/qwik/src/core/state/signal.ts`

The `SignalImpl` class has `get value()` and `set value()`. The setter is where we can notify devtools:

```typescript
set value(v: T) {
  // existing logic...
  const oldValue = this.untrackedValue;
  this.untrackedValue = v;
  this[QObjectManagerSymbol].$notifySubs$();

  // NEW: notify devtools
  if (__DEV__ && typeof window.__QWIK_DEVTOOLS_HOOK__?.onSignalUpdate === 'function') {
    window.__QWIK_DEVTOOLS_HOOK__._emit('signal-update', {
      signal: this, oldValue, newValue: v
    });
  }
}
```

### Signal subscriptions  - `packages/qwik/src/core/state/common.ts`

`LocalSubscriptionManager.$notifySubs$()` is called when signals change. We can hook here to track which elements are re-rendered and why.

### Component context  - `packages/qwik/src/core/use/use-context.ts`

The context storage per element (`element.$contexts$`) can expose component info to devtools.

### Signal creation  - `packages/qwik/src/core/use/use-signal.ts`

`useSignal()` calls `_createSignal()`. We can register newly created signals with the devtools hook here, including the variable name in dev mode.

### Render cycle  - `packages/qwik/src/core/render/dom/notify-render.ts`

`notifyRender()` and `scheduleFrame()` control the render cycle. Wrapping these allows devtools to track render timing and reasons.

### Framework init  - `packages/qwik/src/qwikloader.ts`

The qwikloader fires `qinit`, `qidle`, `qsymbol` events. A `qdevtools` event or hook registration could happen here.

## Performance considerations

- All hook calls should be gated behind `__DEV__` or a `typeof window.__QWIK_DEVTOOLS_HOOK__ !== 'undefined'` check
- In production builds, the hook code should be tree-shaken completely
- The check itself is a single property lookup on `window`, which is negligible (~0.001ms)
- Signal getter should NOT be hooked (too hot path)  - only the setter on change
- Callbacks should be batched (don't fire per-signal, fire per-frame)

## Implementation approach

### Option A: Dev-only hook (recommended for v1)

- Hook is only available when `q:render` includes `dev`
- Zero overhead in production
- Extension falls back to qwik/json snapshot + live DOM for prod sites

### Option B: Always-on with lazy registration

- Hook is always present but does nothing until `window.__QWIK_DEVTOOLS_HOOK__` is set
- The check `typeof window.__QWIK_DEVTOOLS_HOOK__` is extremely cheap
- Allows devtools to work on production sites (valuable for debugging deployed apps)

## Prior art

| Framework | Hook global                      | Exposed since            |
| --------- | -------------------------------- | ------------------------ |
| React     | `__REACT_DEVTOOLS_GLOBAL_HOOK__` | React DevTools v1 (2015) |
| Vue       | `__VUE_DEVTOOLS_GLOBAL_HOOK__`   | Vue DevTools v1 (2016)   |
| Svelte    | `__svelte`                       | Svelte DevTools (2019)   |
| Solid     | `window._$afterCreateRoot`       | Solid DevTools (2022)    |
| **Qwik**  | **none**                         | n/a                      |

## What the extension already does without the hook

The browser extension is published and functional today:

- Parses `q:container`, `q:version`, `q:render`, `q:id`, `q:key` DOM attributes
- Parses `<script type="qwik/json">` for SSR state snapshot (signals, computed, QRLs, refs)
- Live DOM watching via `inspectedWindow.eval()` (input values, attributes, checked state)
- Component tree from DOM walking + `<!--qv-->` virtual nodes
- QRL parsing from `on:*` attributes
- Resumability score from Performance API resource tracking
- Serialization size analysis from qwik/json

## What the hook would unlock

- **Live signal values**: see actual current values, not just SSR snapshot
- **Signal change tracking**: highlight which signals changed and when
- **Component names**: real component function names instead of hashed q:key values in prod
- **Render profiling**: track re-renders with timing and causality (which signal triggered which render)
- **Signal dependency graph**: visualize which signals subscribe to which components
