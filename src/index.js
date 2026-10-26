import { metaMap, text, strip, tags, first } from './html.js';
import { imageSize } from './image.js';

export { imageSize } from './image.js';

const OG_TYPES = new Set(['website', 'article', 'book', 'profile', 'music.song', 'music.album', 'music.playlist', 'music.radio_station', 'video.movie', 'video.episode', 'video.tv_show', 'video.other', 'product', 'product.item', 'og:product']);

/** Extract Open Graph and Twitter Card tags plus fallbacks from HTML. */
export function extractSocial(html, url) {
  const clean = strip(html);
  const head = /<head\b[\s\S]*?<\/head>/i.exec(clean)?.[0] || clean;
  const meta = metaMap(head);
  const abs = (h) => { if (!h) return null; try { return url ? new URL(h, url).toString() : h; } catch { return h; } };
  const og = {};
  const twitter = {};
  for (const [k, v] of Object.entries(meta)) {
    if (k.startsWith('og:') || k.startsWith('article:') || k.startsWith('fb:')) og[k] = v;
    if (k.startsWith('twitter:')) twitter[k] = v;
  }
  const canonical = tags(head, 'link').find((l) => (l.rel || '').toLowerCase() === 'canonical')?.href;
  return { og, twitter, title: text(head, 'title'), description: first(meta.description) ?? null, canonical: abs(canonical), images: [].concat(og['og:image'] || og['og:image:url'] || []).map(abs) };
}

/** How each platform will render the link, with the fallbacks it uses. */
export function previews(s) {
  const g = (k) => first(s.og[k]);
  const t = (k) => first(s.twitter[k]);
  const ogTitle = g('og:title') || s.title;
  const ogDesc = g('og:description') || s.description;
  return {
    facebook: { title: ogTitle, description: ogDesc, image: s.images[0] || null, site: g('og:site_name') || null },
    linkedin: { title: ogTitle, description: ogDesc, image: s.images[0] || null },
    x: { card: t('twitter:card') || (s.images[0] ? 'summary' : null), title: t('twitter:title') || ogTitle, description: t('twitter:description') || ogDesc, image: t('twitter:image') || t('twitter:image:src') || s.images[0] || null },
  };
}

/** Lint extracted tags (image facts are added by checkOpenGraph). */
export function lintSocial(s, context = {}) {
  const out = [];
  const add = (level, code, message) => out.push({ level, code, message });
  const g = (k) => first(s.og[k]);
  for (const k of ['og:title', 'og:type', 'og:image', 'og:url']) if (!g(k)) add(k === 'og:image' || k === 'og:title' ? 'error' : 'warning', `missing-${k.slice(3)}`, `${k} is missing.`);
  if (!g('og:description')) add('warning', 'missing-description', 'og:description is missing.');
  if (g('og:title') && g('og:title').length > 95) add('warning', 'title-long', `og:title is ${g('og:title').length} characters; Facebook truncates after ~88.`);
  if (g('og:description') && g('og:description').length > 200) add('info', 'description-long', `og:description is ${g('og:description').length} characters; most platforms show ~150.`);
  if (g('og:type') && !OG_TYPES.has(g('og:type'))) add('info', 'unknown-type', `og:type "${g('og:type')}" is not a standard type.`);
  if (s.images[0] && !/^https?:\/\//.test(s.images[0])) add('error', 'image-relative', 'og:image must be an absolute URL.');
  if (s.images[0]?.startsWith('http:')) add('warning', 'image-http', 'og:image uses http://; some platforms require https.');
  if (g('og:url') && s.canonical && g('og:url').replace(/\/$/, '') !== s.canonical.replace(/\/$/, '')) add('warning', 'url-canonical-mismatch', `og:url (${g('og:url')}) differs from the canonical URL (${s.canonical}); shares and likes may be split.`);
  if (!first(s.twitter['twitter:card'])) add('info', 'no-twitter-card', 'No twitter:card: X shows a small summary card by default; use summary_large_image for a big preview.');
  for (const [k, v] of Object.entries(s.og)) if (Array.isArray(v) && !['og:image', 'og:image:url', 'og:image:width', 'og:image:height', 'og:image:alt', 'og:image:type', 'og:locale:alternate', 'article:tag', 'og:video'].includes(k)) add('warning', 'duplicate-tag', `${k} is set ${v.length} times.`);
  return out;
}

/**
 * Fetch a page, read its social tags and inspect the share image.
 * @param {string} url
 * @param {{fetch?: typeof fetch, userAgent?: string, checkImage?: boolean}} [options]
 */
export async function checkOpenGraph(url, options = {}) {
  const doFetch = options.fetch || globalThis.fetch;
  const start = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).toString();
  const ua = options.userAgent || 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
  const res = await doFetch(start, { redirect: 'follow', headers: { 'user-agent': ua, accept: 'text/html' } });
  const finalUrl = res.url || start;
  const social = extractSocial(await res.text(), finalUrl);
  const issues = lintSocial(social);
  if (res.status >= 400) issues.unshift({ level: 'error', code: 'http-error', message: `The page returned HTTP ${res.status} to the crawler user agent.` });
  let image = null;
  const imgUrl = previews(social).facebook.image;
  if (imgUrl && options.checkImage !== false && /^https?:/.test(imgUrl)) {
    try {
      const r = await doFetch(imgUrl, { redirect: 'follow', headers: { 'user-agent': ua } });
      const buf = Buffer.from(await r.arrayBuffer());
      image = { url: imgUrl, status: r.status, contentType: r.headers.get('content-type'), bytes: buf.length, ...(imageSize(buf) || {}) };
      if (r.status >= 400) issues.push({ level: 'error', code: 'image-broken', message: `og:image returns HTTP ${r.status}.` });
      else if (!image.type) issues.push({ level: 'error', code: 'image-format', message: `og:image is not a PNG, JPEG, GIF or WebP image (${image.contentType}).` });
      else {
        if (image.width && (image.width < 200 || image.height < 200)) issues.push({ level: 'error', code: 'image-too-small', message: `og:image is ${image.width}×${image.height}; Facebook requires at least 200×200.` });
        else if (image.width && image.width < 1200) issues.push({ level: 'warning', code: 'image-small', message: `og:image is ${image.width}×${image.height}; use 1200×630 for large previews.` });
        if (image.width && image.height && Math.abs(image.width / image.height - 1.91) > 0.25 && image.width >= 600) issues.push({ level: 'info', code: 'image-ratio', message: `og:image ratio is ${(image.width / image.height).toFixed(2)}:1; 1.91:1 (1200×630) avoids cropping.` });
        if (image.bytes > 8 * 1024 * 1024) issues.push({ level: 'error', code: 'image-heavy', message: `og:image is ${(image.bytes / 1048576).toFixed(1)} MB; the limit is 8 MB (5 MB on X).` });
        else if (image.bytes > 5 * 1024 * 1024) issues.push({ level: 'warning', code: 'image-heavy', message: `og:image is ${(image.bytes / 1048576).toFixed(1)} MB; X accepts at most 5 MB.` });
      }
    } catch (err) {
      issues.push({ level: 'error', code: 'image-broken', message: `og:image could not be downloaded: ${err.message}` });
    }
  }
  return { url: start, finalUrl, status: res.status, ...social, image, previews: previews(social), issues, ok: !issues.some((i) => i.level === 'error') };
}
