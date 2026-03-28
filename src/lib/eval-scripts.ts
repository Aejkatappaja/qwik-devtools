import { MAX_LIVE_INPUTS, safeQIdSelector } from './constants.js';

/** Default timeout (ms) for eval scripts. Prevents hanging if page is unresponsive. */
const EVAL_TIMEOUT_MS = 5000;

/**
 * Wrapper around chrome.devtools.inspectedWindow.eval() with a timeout.
 * Wraps the callback API in a Promise for cross-browser consistency.
 * Rejects if the eval doesn't complete within the timeout period.
 */
export function safeEval(
  script: string,
  timeoutMs = EVAL_TIMEOUT_MS,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Eval timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      chrome.devtools.inspectedWindow.eval(
        script,
        (result: unknown, err: unknown) => {
          clearTimeout(timer);
          if (err) reject(err);
          else resolve(result);
        },
      );
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

/**
 * Fire-and-forget eval with timeout. Logs errors but doesn't throw.
 */
export function safeEvalQuiet(
  script: string,
  timeoutMs = EVAL_TIMEOUT_MS,
): void {
  safeEval(script, timeoutMs).catch((err) => {
    console.debug('[Qwik DevTools] eval failed:', err);
  });
}

/**
 * Eval scripts for the DevTools panel. Each function returns a JavaScript
 * string safe for chrome.devtools.inspectedWindow.eval().
 */

export function buildLiveStateScript(qId: string): string {
  return `
    (function() {
      const el = document.querySelector('${safeQIdSelector(qId)}');
      if (!el) return null;
      const r = {};
      if (el.value !== undefined) r.value = el.value;
      if (el.checked !== undefined) r.checked = el.checked;
      if (el.open !== undefined) r.open = el.open;
      for (let k in el.dataset) r['data-' + k] = el.dataset[k];
      const inputs = el.querySelectorAll('input, textarea, select');
      for (let j = 0; j < inputs.length && j < ${MAX_LIVE_INPUTS}; j++) {
        const inp = inputs[j];
        const lbl = inp.name || inp.id || inp.placeholder || inp.type || 'input' + j;
        r['input:' + lbl] = inp.value;
        if (inp.checked !== undefined && inp.checked) r['checked:' + lbl] = true;
      }
      for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        if (a.name.startsWith('aria-') || a.name === 'state' || a.name.startsWith('data-'))
          r[a.name] = a.value;
      }
      return r;
    })()
  `;
}

export function buildSetInputScript(qId: string, newVal: string): string {
  const selector = `document.querySelector('${safeQIdSelector(qId)}')`;
  return buildSetInputScriptForSelector(selector, newVal);
}

export function buildSetChildInputScript(
  qId: string,
  label: string,
  newVal: string,
): string {
  const selector = `
    (function() {
      const el = document.querySelector('${safeQIdSelector(qId)}');
      if (!el) return null;
      const inputs = el.querySelectorAll('input, textarea, select');
      for (let i = 0; i < inputs.length; i++) {
        const inp = inputs[i];
        if (inp.name === ${JSON.stringify(label)} || inp.id === ${JSON.stringify(label)}
            || inp.placeholder === ${JSON.stringify(label)} || inp.type === ${JSON.stringify(label)}) {
          return inp;
        }
      }
      return null;
    })()
  `;
  return buildSetInputScriptForSelector(selector, newVal);
}

function buildSetInputScriptForSelector(
  selector: string,
  newVal: string,
): string {
  return `
    (function() {
      const el = ${selector};
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      const proto = tag === 'textarea' ? HTMLTextAreaElement.prototype
                : tag === 'select' ? HTMLSelectElement.prototype
                : HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      nativeSetter.call(el, ${JSON.stringify(newVal)});
      el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: ${JSON.stringify(newVal)}, inputType: 'insertText' }));
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      return true;
    })()
  `;
}

export function buildSetCheckedScript(qId: string, checked: boolean): string {
  return `
    (function() {
      const el = document.querySelector('${safeQIdSelector(qId)}');
      if (!el) return false;
      el.checked = ${checked};
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `;
}

export function buildSetOpenScript(qId: string, open: boolean): string {
  return `
    (function() {
      const el = document.querySelector('${safeQIdSelector(qId)}');
      if (!el) return false;
      ${open ? 'el.setAttribute("open", "")' : 'el.removeAttribute("open")'};
      return true;
    })()
  `;
}

export function buildSetDataScript(
  qId: string,
  dataKey: string,
  newVal: string,
): string {
  return `
    (function() {
      const el = document.querySelector('${safeQIdSelector(qId)}');
      if (!el) return false;
      el.dataset[${JSON.stringify(dataKey)}] = ${JSON.stringify(newVal)};
      return true;
    })()
  `;
}

export function buildSetAriaScript(
  qId: string,
  attrName: string,
  newVal: string,
): string {
  return `
    (function() {
      const el = document.querySelector('${safeQIdSelector(qId)}');
      if (!el) return false;
      el.setAttribute(${JSON.stringify(attrName)}, ${JSON.stringify(newVal)});
      return true;
    })()
  `;
}

export function buildInspectScript(qId: string): string {
  return `inspect(document.querySelector('${safeQIdSelector(qId)}'))`;
}

export function buildOpenInEditorScript(filePath: string): string {
  return `fetch('/__open-in-editor?file=' + encodeURIComponent(${JSON.stringify(filePath)})).catch(function(){})`;
}
