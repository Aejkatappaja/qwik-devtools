import { describe, expect, it } from 'vitest';
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
} from './eval-scripts.js';

describe('eval-scripts', () => {
  describe('buildLiveStateScript', () => {
    it('generates script targeting correct q:id', () => {
      const script = buildLiveStateScript('42');
      expect(script).toContain('q\\\\:id="42"');
      expect(script).toContain('el.value');
      expect(script).toContain('el.checked');
      expect(script).toContain('el.dataset');
    });

    it('returns an IIFE', () => {
      const script = buildLiveStateScript('0');
      expect(script).toContain('(function()');
      expect(script.trim()).toMatch(/\)\s*$/); // ends with closing paren
    });
  });

  describe('buildSetInputScript', () => {
    it('uses native setter pattern', () => {
      const script = buildSetInputScript('5', 'hello');
      expect(script).toContain('nativeSetter.call');
      expect(script).toContain('"hello"');
      expect(script).toContain('InputEvent');
    });

    it('escapes special characters in value', () => {
      const script = buildSetInputScript('5', 'say "hi"');
      expect(script).toContain('say \\"hi\\"');
    });
  });

  describe('buildSetChildInputScript', () => {
    it('searches for child input by label', () => {
      const script = buildSetChildInputScript(
        '10',
        'email',
        'test@example.com',
      );
      expect(script).toContain('"email"');
      expect(script).toContain('"test@example.com"');
      expect(script).toContain('inp.name');
      expect(script).toContain('inp.id');
    });
  });

  describe('buildSetCheckedScript', () => {
    it('sets checked to true', () => {
      const script = buildSetCheckedScript('7', true);
      expect(script).toContain('el.checked = true');
      expect(script).toContain('change');
    });

    it('sets checked to false', () => {
      const script = buildSetCheckedScript('7', false);
      expect(script).toContain('el.checked = false');
    });
  });

  describe('buildSetOpenScript', () => {
    it('sets open attribute', () => {
      const script = buildSetOpenScript('3', true);
      expect(script).toContain('setAttribute("open"');
    });

    it('removes open attribute', () => {
      const script = buildSetOpenScript('3', false);
      expect(script).toContain('removeAttribute("open"');
    });
  });

  describe('buildSetDataScript', () => {
    it('sets dataset property', () => {
      const script = buildSetDataScript('1', 'theme', 'dark');
      expect(script).toContain('el.dataset');
      expect(script).toContain('"theme"');
      expect(script).toContain('"dark"');
    });
  });

  describe('buildSetAriaScript', () => {
    it('sets aria attribute', () => {
      const script = buildSetAriaScript('2', 'aria-label', 'Close');
      expect(script).toContain('setAttribute');
      expect(script).toContain('"aria-label"');
      expect(script).toContain('"Close"');
    });
  });

  describe('buildInspectScript', () => {
    it('calls inspect()', () => {
      const script = buildInspectScript('99');
      expect(script).toContain('inspect(');
      expect(script).toContain('q\\\\:id="99"');
    });
  });

  describe('buildOpenInEditorScript', () => {
    it('fetches open-in-editor endpoint', () => {
      const script = buildOpenInEditorScript('src/components/Header.tsx');
      expect(script).toContain('__open-in-editor');
      expect(script).toContain('encodeURIComponent');
      expect(script).toContain('src/components/Header.tsx');
    });
  });
});
