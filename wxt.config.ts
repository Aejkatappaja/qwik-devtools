import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  imports: false,
  manifest: {
    name: 'Qwik DevTools',
    description: 'Developer tools for Qwik framework applications',
    version: '0.1.0',
    permissions: ['tabs'],
    web_accessible_resources: [
      {
        resources: ['nav-hook.js'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
