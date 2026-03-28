/**
 * Extract all assets from the page. This runs via inspectedWindow.eval()
 * so it executes in the page context and can access the Performance API.
 */
export const ASSET_EXTRACTION_SCRIPT = `
(function() {
  const result = { scripts: [], styles: [], images: [], preloads: [] };

  // Build a size map from performance entries, using the LAST entry
  // per URL to avoid stale sizes from previous SPA navigations.
  var sizeMap = {};
  try {
    var entries = performance.getEntriesByType('resource');
    for (var ei = 0; ei < entries.length; ei++) {
      var e = entries[ei];
      sizeMap[e.name] = e.transferSize || e.encodedBodySize || 0;
    }
  } catch(e) {}

  function getSize(url) {
    try {
      var fullUrl = new URL(url, location.href).href;
      return sizeMap[fullUrl] || 0;
    } catch(e) {}
    return 0;
  }

  // Deduplicate external resources by resolved URL.
  var seenUrls = {};

  var scriptEls = document.querySelectorAll('script[src]');
  for (var i = 0; i < scriptEls.length; i++) {
    var src = scriptEls[i].getAttribute('src');
    if (!src) continue;
    try { var fullSrc = new URL(src, location.href).href; } catch(e) { continue; }
    if (seenUrls[fullSrc]) continue;
    seenUrls[fullSrc] = true;
    var size = getSize(src);
    result.scripts.push({ url: src, size: size, type: scriptEls[i].getAttribute('type') || 'text/javascript' });
  }

  var inlineScripts = document.querySelectorAll('script:not([src])');
  for (var j = 0; j < inlineScripts.length; j++) {
    var content = inlineScripts[j].textContent || '';
    if (content.length > 0) {
      var t = inlineScripts[j].getAttribute('type') || 'text/javascript';
      result.scripts.push({ url: '(inline ' + t + ')', size: content.length, type: t });
    }
  }

  var extStyles = document.querySelectorAll('link[rel="stylesheet"]');
  for (var k = 0; k < extStyles.length; k++) {
    var href = extStyles[k].getAttribute('href');
    if (!href) continue;
    try { var fullHref = new URL(href, location.href).href; } catch(e) { continue; }
    if (seenUrls[fullHref]) continue;
    seenUrls[fullHref] = true;
    var sSize = getSize(href);
    result.styles.push({ url: href, size: sSize, type: 'text/css' });
    result.totalSize += sSize;
  }

  var inlineStyles = document.querySelectorAll('style');
  for (var si = 0; si < inlineStyles.length; si++) {
    var styleContent = inlineStyles[si].textContent || '';
    if (styleContent.length > 0) {
      var dataSrc = inlineStyles[si].getAttribute('data-src') || '';
      var label = dataSrc || ('inline style #' + (si + 1));
      result.styles.push({ url: label, size: styleContent.length, type: 'text/css' });
    }
  }

  var preloads = document.querySelectorAll('link[rel="modulepreload"], link[rel="preload"], link[rel="prefetch"]');
  for (var p = 0; p < preloads.length; p++) {
    var pHref = preloads[p].getAttribute('href');
    if (!pHref) continue;
    try { var fullPHref = new URL(pHref, location.href).href; } catch(e) { continue; }
    if (seenUrls[fullPHref]) continue;
    seenUrls[fullPHref] = true;
    var pSize = getSize(pHref);
    result.preloads.push({ url: pHref, size: pSize, type: preloads[p].getAttribute('as') || preloads[p].getAttribute('rel') });
    result.totalSize += pSize;
  }

  var imgs = document.querySelectorAll('img');
  for (let m = 0; m < imgs.length; m++) {
    const img = imgs[m];
    const hasWidthAttr = img.hasAttribute('width');
    const hasHeightAttr = img.hasAttribute('height');
    const hasAlt = img.hasAttribute('alt') && img.getAttribute('alt') !== '';
    const loading = img.getAttribute('loading');
    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    const alt = img.getAttribute('alt') || '';

    let format = 'unknown';
    const srcLower = src.toLowerCase();
    if (srcLower.includes('.webp') || srcLower.includes('format=webp')) format = 'webp';
    else if (srcLower.includes('.avif')) format = 'avif';
    else if (srcLower.includes('.png')) format = 'png';
    else if (srcLower.includes('.jpg') || srcLower.includes('.jpeg')) format = 'jpeg';
    else if (srcLower.includes('.gif')) format = 'gif';
    else if (srcLower.includes('.svg')) format = 'svg';
    else if (src.startsWith('data:image/')) format = src.split(';')[0].split('/')[1];

    let imgSize = 0;
    try {
      const imgUrl = new URL(src, location.href).href;
      const imgEntries = performance.getEntriesByName(imgUrl, 'resource');
      if (imgEntries.length > 0) imgSize = imgEntries[0].transferSize || imgEntries[0].encodedBodySize || 0;
    } catch(e) { console.debug('[Qwik DevTools] Failed to resolve asset URL', e); }

    result.images.push({
      src: src ? new URL(src, location.href).href : '',
      width: hasWidthAttr ? parseInt(img.getAttribute('width')) : null,
      height: hasHeightAttr ? parseInt(img.getAttribute('height')) : null,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      renderedWidth: img.clientWidth,
      renderedHeight: img.clientHeight,
      hasWidthAttr,
      hasHeightAttr,
      hasAlt,
      alt,
      loading,
      format,
      transferSize: imgSize
    });
  }

  return result;
})()
`;
