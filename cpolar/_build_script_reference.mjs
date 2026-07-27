/* Build the shareable demo copy of the front page.
 *
 *   node make_demo.mjs ../_deploy/cpolar
 *
 * Two jobs.
 *
 * 1. Copy only what the browser actually fetches. The working folder is ~70MB
 *    of sources, backups and test scripts; the page itself pulls 53 files and
 *    about 14MB. `served_files.txt` is that list, recorded by loading the real
 *    page and logging every successful request (see whatfetches.mjs).
 *
 * 2. Rewrite root-absolute asset paths to relative ones. The reference site was
 *    built to sit at a domain root, so its CSS and JS ask for "/assets/...".
 *    Served from a subfolder that resolves to the wrong place - on GitHub Pages
 *    it became https://aldrinor.github.io/assets/... and 404'd every font,
 *    texture and model. The page loaded, the fonts fell back and the mountain
 *    never appeared.
 *
 *    CSS lives in <root>/_astro/, so "/assets/x" becomes "../assets/x".
 *    JS paths resolve against the document, not the script, so the leading
 *    slash is simply dropped: "/assets/x" becomes "assets/x".
 *
 * Re-runnable: it rebuilds the folder from scratch every time.
 */

import fs from 'node:fs';
import path from 'node:path';

const DEST = process.argv[2];
if (!DEST) { console.error('usage: node make_demo.mjs <destination>'); process.exit(1); }

const list = fs.readFileSync('served_files.txt', 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const ICONS = ['favicon.ico', 'favicon-16.png', 'favicon-32.png', 'favicon-64.png', 'apple-touch-icon.png'];

/* Windows keeps a handle on a folder for a moment after something reads it,
   so a plain rmSync can throw EBUSY. Empty the contents instead of removing
   the folder itself, and retry a few times. */
function clear(dir){
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir)) {
    const p = path.join(dir, e);
    for (let i = 0; i < 5; i++) {
      try { fs.rmSync(p, {recursive: true, force: true}); break; }
      catch (err) { if (i === 4) throw err; }
    }
  }
}
clear(DEST);
fs.mkdirSync(DEST, {recursive: true});

let bytes = 0, rewritten = 0, files = 0;
for (const f of [...list, ...ICONS]) {
  if (!fs.existsSync(f)) { console.log('  missing, skipped: ' + f); continue; }
  const out = path.join(DEST, f);
  fs.mkdirSync(path.dirname(out), {recursive: true});

  if (f.endsWith('.css') || f.endsWith('.js') || f.endsWith('.html')) {
    let s = fs.readFileSync(f, 'utf8');
    const before = s;
    if (f.endsWith('.css')) {
      // depth of this file below the site root decides how far back to step
      const up = '../'.repeat(f.split('/').length - 1) || './';
      s = s.replace(/url\((['"]?)\/(assets|libs)\//g, (m, q, d) => `url(${q}${up}${d}/`);
    } else {
      s = s.replace(/(['"])\/(assets|libs)\//g, (m, q, d) => `${q}${d}/`);
    }
    if (s !== before) rewritten++;
    fs.writeFileSync(out, s);
    bytes += Buffer.byteLength(s);
  } else {
    fs.copyFileSync(f, out);
    bytes += fs.statSync(f).size;
  }
  files++;
}

/* 3. Make their router match at a subfolder.
 *
 *    Their app resolves the 3D scene from the URL:
 *
 *      getPage(e){let t=e.replace(/\/$/,"");t===""&&(t="/");const n=PT[t];...}
 *
 *    PT maps "/" to the homepage scene. Served from a subfolder the pathname
 *    is "/nf-bigidea-preview/cpolar/", which is not in PT, so getPage returns
 *    undefined and NOTHING loads - no models, no textures, no transcoder. The
 *    page came up looking fine with a grey gradient where the mountain should
 *    be, and threw no error at all, because a missing route is not a failure
 *    to them, it just means "no scene on this page".
 *
 *    One-line fix: fall back to the homepage route when the lookup misses.
 *    Correct here because the demo is only ever the homepage.
 */
{
  const f = path.join(DEST, '_astro/GlobalApp.vK8XqYB9.js');
  const was = 'const n=PT[t];return this.pages[n]';
  const now = 'let n=PT[t];n===void 0&&(n=PT["/"]);return this.pages[n]';
  let js = fs.readFileSync(f, 'utf8');
  if (!js.includes(was)) {
    console.log('WARNING: the router patch did not apply - their bundle changed. '
              + 'The mountain will not render at a subfolder.');
  } else {
    fs.writeFileSync(f, js.replace(was, now));
    console.log('router patched to fall back to the homepage route');
  }
}

/* keep the demo out of search results */
const idx = path.join(DEST, 'index.html');
let html = fs.readFileSync(idx, 'utf8');
html = html.replace('<meta name="robots" content="index, follow">',
  '<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">' +
  '<meta name="googlebot" content="noindex, nofollow">');
fs.writeFileSync(idx, html);

const left = [];
for (const f of fs.readdirSync(DEST, {recursive: true})) {
  const p = path.join(DEST, f);
  if (!fs.statSync(p).isFile()) continue;
  if (!/\.(css|js|html)$/.test(f)) continue;
  const s = fs.readFileSync(p, 'utf8');
  const m = s.match(/["'(]\/(assets|libs)\//g);
  if (m) left.push(f + ' (' + m.length + ')');
}

console.log(files + ' files, ' + (bytes / 1048576).toFixed(1) + ' MB');
console.log(rewritten + ' files had absolute paths rewritten');
console.log(left.length ? 'STILL ABSOLUTE: ' + left.join(', ') : 'no absolute /assets or /libs paths remain');
console.log('noindex: ' + (fs.readFileSync(idx, 'utf8').includes('noindex') ? 'set' : 'NOT SET'));
