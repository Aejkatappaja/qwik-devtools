import type { SVGTemplateResult } from 'lit';
import { svg } from 'lit';

export const inspectIcon: SVGTemplateResult = svg`<svg
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
  <path d="m13 13 6 6"/>
</svg>`;

export const refreshIcon: SVGTemplateResult = svg`<svg
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  <polyline points="21 3 21 9 15 9"/>
</svg>`;

export const moonIcon: SVGTemplateResult = svg`<svg
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`;

export const sunIcon: SVGTemplateResult = svg`<svg
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/>
  <line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/>
  <line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>`;

export const qwikLogo: SVGTemplateResult = svg`<svg viewBox="0 0 500 506" xmlns="http://www.w3.org/2000/svg">
  <path fill="#c0caf5" d="M370.826 224.859 156.157 16.117l23.021 158.743-50.004 49.999 213.863 198.793-12.209-158.792 39.998-40.001Z"/>
  <path fill="#18b6f6" d="m250 449.707 181.102 55.804-88.065-81.859-213.863-198.793 50.004-49.999-23.021-158.743L8.348 193.702a62.314 62.314 0 0 0 0 62.314l93.843 162.535a62.314 62.314 0 0 0 53.965 31.156H250Z"/>
  <path fill="#ac7ef4" d="M343.843 0H156.157a62.312 62.312 0 0 0-53.965 31.157L8.348 193.702 156.157 16.117l214.669 208.742-39.998 40.001 12.209 158.792 88.065 81.859c5.078 1.564 9.533-3.756 7.102-8.48l-40.395-78.48 93.842-162.535a62.313 62.313 0 0 0 .001-62.314L397.808 31.157A62.312 62.312 0 0 0 343.843 0Z"/>
</svg>`;

export const expandArrow: SVGTemplateResult = svg`<svg viewBox="0 0 16 16" fill="currentColor">
  <path d="M6 3l5 5-5 5z"/>
</svg>`;

export const fileIcon: SVGTemplateResult = svg`<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
</svg>`;

export const folderOpenIcon: SVGTemplateResult = svg`<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
</svg>`;

export const folderClosedIcon: SVGTemplateResult = svg`<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
</svg>`;

export const copyIcon: SVGTemplateResult = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
</svg>`;

export const checkIcon: SVGTemplateResult = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"/>
</svg>`;

export const externalLinkIcon: SVGTemplateResult = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  <polyline points="15 3 21 3 21 9"/>
  <line x1="10" y1="14" x2="21" y2="3"/>
</svg>`;

export const refreshSmallIcon: SVGTemplateResult = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  <polyline points="21 3 21 9 15 9"/>
</svg>`;

export const collapseAllIcon: SVGTemplateResult = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 14 10 14 10 20"/>
  <polyline points="20 10 14 10 14 4"/>
  <line x1="14" y1="10" x2="21" y2="3"/>
  <line x1="3" y1="21" x2="10" y2="14"/>
</svg>`;

export const expandAllIcon: SVGTemplateResult = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="15 3 21 3 21 9"/>
  <polyline points="9 21 3 21 3 15"/>
  <line x1="21" y1="3" x2="14" y2="10"/>
  <line x1="3" y1="21" x2="10" y2="14"/>
</svg>`;
