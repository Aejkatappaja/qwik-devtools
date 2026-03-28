import { isRecord } from './constants.js';
import {
  buildInspectScript,
  buildLiveStateScript,
  buildOpenInEditorScript,
  buildSetAriaScript,
  buildSetCheckedScript,
  buildSetChildInputScript,
  buildSetDataScript,
  buildSetInputScript,
  buildSetOpenScript,
  safeEval,
  safeEvalQuiet,
} from './eval-scripts.js';

/** Default timeout for bridge operations */
const BRIDGE_TIMEOUT_MS = 5000;

/**
 * Typed remote API for communicating with the inspected page.
 * Wraps chrome.devtools.inspectedWindow.eval() behind type-safe methods
 * with timeouts and error handling.
 *
 * Usage:
 * ```ts
 * const bridge = new PageBridge();
 * const state = await bridge.getLiveState(qId);
 * await bridge.setValue(qId, 'hello');
 * ```
 */
export class PageBridge {
  private _timeout: number;

  constructor(timeoutMs = BRIDGE_TIMEOUT_MS) {
    this._timeout = timeoutMs;
  }

  async getLiveState(qId: string): Promise<Record<string, unknown> | null> {
    const result = await safeEval(buildLiveStateScript(qId), this._timeout);
    return isRecord(result) ? result : null;
  }

  async setValue(qId: string, value: string): Promise<boolean> {
    const result = await safeEval(
      buildSetInputScript(qId, value),
      this._timeout,
    );
    return result === true;
  }

  async setChildInputValue(
    qId: string,
    label: string,
    value: string,
  ): Promise<boolean> {
    const result = await safeEval(
      buildSetChildInputScript(qId, label, value),
      this._timeout,
    );
    return result === true;
  }

  async setChecked(qId: string, checked: boolean): Promise<boolean> {
    const result = await safeEval(
      buildSetCheckedScript(qId, checked),
      this._timeout,
    );
    return result === true;
  }

  async setOpen(qId: string, open: boolean): Promise<boolean> {
    const result = await safeEval(buildSetOpenScript(qId, open), this._timeout);
    return result === true;
  }

  async setData(qId: string, key: string, value: string): Promise<boolean> {
    const result = await safeEval(
      buildSetDataScript(qId, key, value),
      this._timeout,
    );
    return result === true;
  }

  async setAria(qId: string, attr: string, value: string): Promise<boolean> {
    const result = await safeEval(
      buildSetAriaScript(qId, attr, value),
      this._timeout,
    );
    return result === true;
  }

  inspectElement(qId: string): void {
    safeEvalQuiet(buildInspectScript(qId), this._timeout);
  }

  openInEditor(filePath: string): void {
    safeEvalQuiet(buildOpenInEditorScript(filePath), this._timeout);
  }

  async eval<T = unknown>(script: string): Promise<T> {
    return (await safeEval(script, this._timeout)) as T;
  }

  async getPathname(): Promise<string | null> {
    const result = await safeEval('location.pathname', this._timeout);
    return typeof result === 'string' ? result : null;
  }
}
