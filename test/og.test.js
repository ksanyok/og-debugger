import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { checkOpenGraph, extractSocial, lintSocial, previews, imageSize } from '../src/index.js';

function png(w, h) {
  const buf = Buffer.alloc(33);
  buf.writeUInt32BE(0x89504e47, 0); buf.writeUInt32BE(0x0d0a1a0a, 4);
  buf.writeUInt32BE(13, 8); buf.write('IHDR', 12); buf.writeUInt32BE(w, 16); buf.writeUInt32BE(h, 20);
  return Buffer.concat([buf, deflateSync(Buffer.alloc(10))]);
}
const jpeg = (w, h) => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 11, 8, h >> 8, h & 255, w >> 8, w & 255, 3, 0, 0, 0]);
const PAGE = `<html><head><title>Fallback title</title><meta name="description" content="Fallback description">
<link rel="canonical" href="https://example.com/post">
<meta property="og:title" content="Great post"><meta property="og:type" content="article">
<meta property="og:url" content="https://example.com/post"><meta property="og:image" content="/img/share.png">
<meta property="og:description" content="What the post is about.">
<meta name="twitter:card" content="summary_large_image"></head><body></body></html>`;
const codes = (l) => l.map((i) => i.code);
const web = (routes) => async (url) => {
  const r = routes[url];
  return r ? new Response(r.body, { status: r.status || 200, headers: { 'content-type': r.type || 'text/html' } }) : new Response('nope', { status: 404 });
};

test('reads image sizes from headers', () => {
  assert.deepEqual(imageSize(png(1200, 630)), { type: 'png', width: 1200, height: 630 });
  assert.deepEqual(imageSize(jpeg(800, 418)), { type: 'jpeg', width: 800, height: 418 });
  assert.deepEqual(imageSize(Buffer.from('GIF89a\x10\x00\x20\x00', 'latin1')), { type: 'gif', width: 16, height: 32 });
  assert.equal(imageSize(Buffer.from('<svg/>')), null);
});

test('extracts tags and resolves the image URL', () => {
  const s = extractSocial(PAGE, 'https://example.com/post');
  assert.equal(s.og['og:title'], 'Great post');
  assert.deepEqual(s.images, ['https://example.com/img/share.png']);
  assert.deepEqual(lintSocial(s), []);
});

test('previews fall back to title and description', () => {
  const p = previews(extractSocial('<title>Only title</title><meta name="description" content="Only desc">'));
  assert.equal(p.facebook.title, 'Only title');
  assert.equal(p.x.description, 'Only desc');
  const c = codes(lintSocial(extractSocial('<title>x</title>')));
  for (const code of ['missing-title', 'missing-image', 'missing-type', 'missing-url', 'no-twitter-card']) assert.ok(c.includes(code), code);
});

test('flags og:url / canonical mismatch and duplicates', () => {
  const s = extractSocial('<link rel="canonical" href="https://e.com/a"><meta property="og:url" content="https://e.com/b"><meta property="og:title" content="1"><meta property="og:title" content="2">');
  const c = codes(lintSocial(s));
  assert.ok(c.includes('url-canonical-mismatch'));
  assert.ok(c.includes('duplicate-tag'));
});

test('downloads and checks the share image', async () => {
  const ok = await checkOpenGraph('https://example.com/post', { fetch: web({ 'https://example.com/post': { body: PAGE }, 'https://example.com/img/share.png': { body: png(1200, 630), type: 'image/png' } }) });
  assert.equal(ok.image.width, 1200);
  assert.equal(ok.ok, true);
  const small = await checkOpenGraph('https://example.com/post', { fetch: web({ 'https://example.com/post': { body: PAGE }, 'https://example.com/img/share.png': { body: png(150, 150), type: 'image/png' } }) });
  assert.ok(codes(small.issues).includes('image-too-small'));
  const broken = await checkOpenGraph('https://example.com/post', { fetch: web({ 'https://example.com/post': { body: PAGE } }) });
  assert.ok(codes(broken.issues).includes('image-broken'));
});
