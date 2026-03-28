import {
  MAX_NEARBY_ELEMENTS,
  RE_ALPHA_ONLY,
  RE_BEM_BLOCK,
  RE_CAMEL_CLASS,
  RE_DEV_KEY,
  RE_HASH_KEY_COLON,
  RE_HASH_KEY_SHORT,
  RE_PASCAL_CLASS,
  RE_PROD_SYMBOL,
  RE_SHORT_HYPHEN,
  RE_SHORT_UTILITY,
  RE_UTILITY_PREFIX,
} from './constants.js';

const SEMANTIC_TAGS: Record<string, string> = {
  header: 'Header',
  footer: 'Footer',
  nav: 'Nav',
  main: 'Main',
  section: 'Section',
  article: 'Article',
  aside: 'Aside',
  form: 'Form',
  dialog: 'Dialog',
  details: 'Details',
  button: 'Button',
  input: 'Input',
  select: 'Select',
  textarea: 'Textarea',
  a: 'Link',
  img: 'Image',
  video: 'Video',
  audio: 'Audio',
  canvas: 'Canvas',
  table: 'Table',
  ul: 'List',
  ol: 'OrderedList',
  li: 'ListItem',
  h1: 'H1',
  h2: 'H2',
  h3: 'H3',
  h4: 'H4',
  h5: 'H5',
  h6: 'H6',
  p: 'Paragraph',
  span: 'Span',
  svg: 'SVG',
};

const LANDMARK_TAGS = new Set([
  'header',
  'footer',
  'nav',
  'main',
  'section',
  'article',
  'form',
  'dialog',
]);

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function deriveComponentName(element: Element): string {
  const tag = element.tagName.toLowerCase();

  if (SEMANTIC_TAGS[tag] && tag !== 'div' && tag !== 'span') {
    return SEMANTIC_TAGS[tag];
  }

  // Use getAttribute('class') instead of .className to handle SVGElement
  // (SVGElement.className is an SVGAnimatedString, not a string)
  const cls = element.getAttribute('class') ?? '';
  if (cls) {
    const name = extractNameFromClasses(cls);
    if (name) return name;
  }

  const role = element.getAttribute('role');
  if (role) return capitalize(role);

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.length < 25) return capitalize(ariaLabel);

  if (SEMANTIC_TAGS[tag]) return SEMANTIC_TAGS[tag];
  return tag;
}

/**
 * Extract a readable name from CSS class names.
 * Prefers PascalCase/camelCase class names (likely component names).
 */
export function extractNameFromClasses(className: string): string | null {
  const classes = className.split(/\s+/).filter(Boolean);

  // First pass: look for PascalCase or camelCase names (likely component class names)
  for (const cls of classes) {
    if (RE_SHORT_HYPHEN.test(cls) && cls.length < 15) continue;
    if (RE_UTILITY_PREFIX.test(cls)) continue;

    if (RE_PASCAL_CLASS.test(cls)) return cls;
    if (RE_CAMEL_CLASS.test(cls)) return capitalize(cls);
    if (RE_BEM_BLOCK.test(cls)) return cls.split('-')[0];
  }

  for (const cls of classes) {
    if (cls.length > 2 && cls.length < 30 && !RE_SHORT_UTILITY.test(cls)) {
      return capitalize(cls.replace(/[-_]+(.)/g, (_, c) => c.toUpperCase()));
    }
  }

  return null;
}

/**
 * Extract readable component name from q:key.
 * Dev mode keys: "Header_component_0" -> "Header"
 * Prod mode keys: "w5MY:0G_0" -> null (hash)
 */
export function extractReadableFromKey(key: string): string | null {
  const devMatch = key.match(RE_DEV_KEY);
  if (devMatch) return devMatch[1];

  if (key.startsWith('Comp:')) return null;

  if (RE_HASH_KEY_COLON.test(key)) return null;
  if (RE_HASH_KEY_SHORT.test(key)) return null;

  // Keys like "builder-444ffd..." or "header-abc123..." → "Builder", "Header"
  const prefixMatch = key.match(/^([a-zA-Z]{3,})-[a-f0-9]{6}/);
  if (prefixMatch) return capitalize(prefixMatch[1]);

  const cleaned = key.replace(/_\d+$/, '');
  if (cleaned.length > 4 && RE_ALPHA_ONLY.test(cleaned)) {
    return capitalize(cleaned);
  }

  return null;
}

/**
 * Look at sibling/child elements after a virtual node comment to find a name.
 */
export function extractNameFromNearbyElements(comment: Comment): string | null {
  let sibling = comment.nextSibling;
  let maxLook = MAX_NEARBY_ELEMENTS;

  while (sibling && maxLook-- > 0) {
    if (sibling.nodeType === 1 /* ELEMENT_NODE */) {
      const el = sibling as Element;
      const cls = el.getAttribute('class') ?? '';
      if (cls) {
        const name = extractNameFromClasses(cls);
        if (name) return name;
      }

      const role = el.getAttribute('role');
      if (role) return capitalize(role);

      const tag = el.tagName.toLowerCase();
      if (LANDMARK_TAGS.has(tag)) {
        return capitalize(tag);
      }

      break;
    }

    if (sibling.nodeType === 8 /* COMMENT_NODE */) {
      if ((sibling as Comment).data.startsWith('/qv')) break;
    }

    sibling = sibling.nextSibling;
  }

  return null;
}

/**
 * Extract a component name from a QRL string.
 * QRL format: ./chunk.js#SymbolName[captures]
 * Dev: ./chunk.js#Header_component -> "Header"
 * Prod: q-abc.js#s_hash -> null
 */
export function extractNameFromQrl(qrl?: string): string | null {
  if (!qrl) return null;

  const hashIdx = qrl.indexOf('#');
  if (hashIdx < 0) return null;

  const afterHash = qrl.substring(hashIdx + 1);
  const endIdx = afterHash.search(/[[\s]/);
  const symbolName = endIdx >= 0 ? afterHash.substring(0, endIdx) : afterHash;

  const devMatch = symbolName.match(RE_DEV_KEY);
  if (devMatch) return devMatch[1];

  if (RE_PROD_SYMBOL.test(symbolName)) return null;

  if (RE_PASCAL_CLASS.test(symbolName) && symbolName.length > 2) {
    return symbolName;
  }

  return null;
}
