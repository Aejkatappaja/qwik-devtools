# Component Tree: How It Works

The component tree is the core feature of Qwik DevTools. This document explains how the tree is built, why it behaves differently after SPA navigation, and what the current limitations are.

## Tree Building Pipeline

The tree is built in three stages:

### 1. DOM Discovery (`buildTree`)

A `TreeWalker` scans the Qwik container for elements that the framework manages:

| Signal | Example | When present |
|--------|---------|--------------|
| `q:id` attribute | `<div q:id="5">` | SSR-rendered elements |
| `q:key` attribute | `<div q:key="counter_1">` | SSR + client-rendered elements |
| `on:*` / `on-*` event attributes | `<button on:click="./chunk.js#handler">` | Any interactive element |
| `<!--qv-->` comments | `<!--qv q:id=4 q:key=layout_0-->` | Virtual component boundaries |

Nesting is determined by DOM containment. Virtual node boundaries (`<!--qv-->` / `<!--/qv-->`) are matched as pairs to correctly scope sibling components.

### 2. State Enrichment (`enrichTreeWithState`)

When the Qwik container is in `paused` state (fresh SSR), the `<script type="qwik/json">` tag contains the full serialized state:

- **`refs`** maps `q:id` to object indices (signals, stores, QRLs)
- **`ctx`** maps `q:id` to component context (component QRL, props, tasks)

Enrichment resolves component names from QRL symbols (e.g. `./chunk.js#DocSearch_component` becomes "DocSearch") and marks stateful nodes with `hasContext: true`.

### 3. Tree Cleaning (`cleanTree`)

Removes noise from the raw tree:

- **Boring leaf tags** (link, script, style, meta, etc.) with no state or children
- **CSS hash names** (e.g. `Cxmqbja`) replaced with readable tag names
- **Single-child wrapper flattening** (div > div > Header becomes Header) — only when enrichment data is available to reliably identify stateless wrappers

## SSR vs SPA Navigation

### Initial load (SSR, `q:container="paused"`)

Best experience. The full pipeline runs:

```
DOM scan (q:id, q:key, <!--qv-->, on:*)
  → Enrichment from qwik/json (names, state, context)
    → Cleaning with flattening
      → Rich tree with component names like DocSearch, ThemeIcon, QwikLogo
```

### After SPA navigation (`q:container="resumed"`)

The tree is still built, but with reduced fidelity:

```
DOM scan (q:id, q:key, on:*)
  → No enrichment (qwik/json is stale)
    → Cleaning without flattening (hasContext is unreliable)
      → Tree with heuristic names (tag names, CSS classes, q:key prefixes)
```

**Why the difference:**

| | SSR (paused) | After SPA nav (resumed) |
|---|---|---|
| `q:id` on elements | All elements | Layout only (new route content may lack them) |
| `<!--qv-->` comments | Present | May be absent for client-rendered content |
| `qwik/json` state | Fresh, accurate | Stale (reflects initial load, not current state) |
| Component names | From QRL symbols ("DocSearch") | From DOM heuristics ("Div", "Button") |
| State/signals | Full snapshot | Unavailable |

### Component Naming Fallback Chain

When enrichment is unavailable, names are resolved in this order:

1. **Semantic HTML tag** — `<header>` becomes "Header", `<nav>` becomes "Nav"
2. **CSS class names** — PascalCase or camelCase classes (e.g. class `DocSearch` becomes "DocSearch")
3. **Event handler QRLs** — `on:click="./chunk.js#MyComponent_onClick"` extracts "MyComponent" (dev builds only; production QRLs are minified)
4. **`q:key` prefix** — `q:key="builder-abc123..."` extracts "Builder"
5. **Tag name** — fallback to "Div", "Button", etc.

### Why Production QRLs Don't Help

In development builds, QRL symbols are human-readable: `DocSearch_component`, `ThemeIcon_onClick`. In production, they are minified to hashes: `s_abc123`. The `s_` prefix is detected and skipped since it yields no useful name.

This is analogous to React DevTools in production: without a dev build or source maps, component names are minified.

## Recommendations

- **Reload the page** (`Cmd+R`) after SPA navigation to get the full enriched tree for the current route
- **Use dev builds** when possible — component names and QRL symbols are human-readable
- **First load** always gives the best tree — open DevTools before navigating

## Future: `__QWIK_DEVTOOLS_HOOK__`

The long-term fix is a runtime hook (like React's `__REACT_DEVTOOLS_GLOBAL_HOOK__`). This would give DevTools direct access to:

- Live signal values (not stale snapshots)
- Real component names in production
- Full tree after SPA navigation
- Render cycle tracking

See the [RFC](DEVTOOLS_HOOK_RFC.md) for details.
