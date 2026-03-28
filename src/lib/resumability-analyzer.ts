/**
 * Script executed via inspectedWindow.eval() to analyze resumability,
 * serialization, and prefetch status of a Qwik app.
 */
export const RESUMABILITY_SCRIPT = `
(function() {
  const container = document.querySelector('[q\\\\:container]');
  if (!container) return null;

  const containerState = container.getAttribute('q:container') || 'unknown';

  const listeners = [];
  const allEls = container.querySelectorAll('*');
  for (let i = 0; i < allEls.length; i++) {
    const el = allEls[i];
    for (let j = 0; j < el.attributes.length; j++) {
      const attr = el.attributes[j];
      if (attr.name.startsWith('on:') || attr.name.startsWith('on-')) {
        const eventName = attr.name.replace(/^on[:\\-]/, '').replace(/\\$.*$/, '');
        const qrls = attr.value.split('\\n').filter(Boolean);
        for (let k = 0; k < qrls.length; k++) {
          listeners.push({
            event: eventName,
            elementId: el.getAttribute('q:id') || '',
            qrl: qrls[k].trim(),
            loaded: false
          });
        }
      }
    }
  }

  const loadedResources = new Set();
  try {
    const entries = performance.getEntriesByType('resource');
    for (let r = 0; r < entries.length; r++) {
      loadedResources.add(entries[r].name);
    }
  } catch(e) { console.debug('[Qwik DevTools] Failed to read performance entries', e); }

  const base = container.getAttribute('q:base') || '/build/';
  let resumed = 0;
  for (let l = 0; l < listeners.length; l++) {
    const hashIdx = listeners[l].qrl.indexOf('#');
    const chunkUrl = hashIdx >= 0 ? listeners[l].qrl.substring(0, hashIdx) : listeners[l].qrl;
    try {
      const fullUrl = new URL(chunkUrl, new URL(base, location.href)).href;
      if (loadedResources.has(fullUrl)) {
        listeners[l].loaded = true;
        resumed++;
      }
    } catch(e) { console.debug('[Qwik DevTools] Failed to resolve QRL URL', e); }
  }

  const total = listeners.length;
  const pending = total - resumed;
  const score = total > 0 ? Math.round((pending / total) * 100) : 100;

  const scriptEl = document.querySelector('script[type="qwik/json"]');
  let rawSize = 0;
  const breakdown = {
    totalObjects: 0, signal: 0, computed: 0, qrl: 0,
    string: 0, number: 0, object: 0, array: 0, other: 0,
    rawSize: 0, topObjects: []
  };

  if (scriptEl && scriptEl.textContent) {
    const raw = scriptEl.textContent;
    rawSize = raw.length;
    breakdown.rawSize = rawSize;

    try {
      const parsed = JSON.parse(raw);
      const objs = parsed.objs || [];
      breakdown.totalObjects = objs.length;

      const sizes = [];
      for (let o = 0; o < objs.length; o++) {
        const val = objs[o];
        const objSize = JSON.stringify(val).length;
        let type = 'other';

        if (val === null || val === undefined) { type = 'other'; }
        else if (typeof val === 'string') {
          const code = val.charCodeAt(0);
          if (code === 0x12) type = 'signal';
          else if (code === 0x11) type = 'computed';
          else if (code === 0x02) type = 'qrl';
          else type = 'string';
        }
        else if (typeof val === 'number') type = 'number';
        else if (Array.isArray(val)) type = 'array';
        else if (typeof val === 'object') type = 'object';

        let preview = '';
        if (typeof val === 'string') {
          preview = val.length > 60 ? '"' + val.substring(0, 60) + '..."' : '"' + val + '"';
        } else if (typeof val === 'number' || typeof val === 'boolean') {
          preview = String(val);
        } else if (val === null) {
          preview = 'null';
        } else if (Array.isArray(val)) {
          const arrPreview = val.slice(0, 3).map((v) => JSON.stringify(v)).join(', ');
          preview = '[' + arrPreview + (val.length > 3 ? ', ... (' + val.length + ')' : '') + ']';
        } else if (typeof val === 'object') {
          const objEntries = Object.entries(val).slice(0, 3);
          const parts = objEntries.map((e) => e[0] + ': ' + JSON.stringify(e[1]).substring(0, 20));
          preview = '{' + parts.join(', ') + (Object.keys(val).length > 3 ? ', ...' : '') + '}';
        }

        breakdown[type] = (breakdown[type] || 0) + 1;
        sizes.push({ index: o, size: objSize, type, preview });
      }

      sizes.sort((a, b) => b.size - a.size);
      breakdown.topObjects = sizes.slice(0, 10);
    } catch(e) { console.debug('[Qwik DevTools] Failed to parse qwik/json', e); }
  }

  const preloadLinks = document.querySelectorAll('link[rel="modulepreload"], link[rel="preload"][as="script"]');
  const totalModules = preloadLinks.length;
  let loadedModules = 0;
  let totalPrefetchSize = 0;
  let loadedPrefetchSize = 0;

  for (let p = 0; p < preloadLinks.length; p++) {
    const href = preloadLinks[p].getAttribute('href');
    if (!href) continue;
    try {
      const fullHref = new URL(href, location.href).href;
      const resEntries = performance.getEntriesByName(fullHref, 'resource');
      if (resEntries.length > 0) {
        const entry = resEntries[0];
        const sz = entry.transferSize || entry.encodedBodySize || 0;
        totalPrefetchSize += sz;
        if (entry.responseEnd > 0) {
          loadedModules++;
          loadedPrefetchSize += sz;
        }
      }
    } catch(e) { console.debug('[Qwik DevTools] Failed to resolve prefetch URL', e); }
  }

  return {
    containerState,
    totalListeners: total,
    pendingListeners: pending,
    resumedListeners: resumed,
    resumabilityScore: score,
    listenerBreakdown: listeners.slice(0, 50),
    serializationSize: rawSize,
    serializationBreakdown: breakdown,
    prefetchStatus: {
      totalModules,
      loadedModules,
      pendingModules: totalModules - loadedModules,
      totalSize: totalPrefetchSize,
      loadedSize: loadedPrefetchSize
    }
  };
})()
`;
