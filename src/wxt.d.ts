/// <reference types="wxt/browser" />

declare function defineContentScript(options: {
  matches: string[];
  runAt?: string;
  main(): void;
}): { matches: string[]; runAt?: string; main(): void };

declare function defineBackground(fn: () => void): () => void;
