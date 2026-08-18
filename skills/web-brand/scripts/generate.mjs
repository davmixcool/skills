#!/usr/bin/env node
/**
 * Render a complete brand asset kit from one SVG mark + a colour config.
 *
 *   node generate.mjs --config brand.config.json --out ./brand [--public ./public]
 *
 * Everything is rasterised from the same vector geometry, so there is no
 * binary master to keep in sync — edit the config, re-run, all sizes rebuild.
 *
 * Requires: puppeteer-core + a local Chrome/Chromium.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/**
 * Load puppeteer-core, lazily — so --help and config errors work even where it
 * is not installed.
 *
 * A bare `import` resolves from *this file's* directory, so a skill installed
 * under ~/.claude/skills would never see the copy the user installed in their
 * own project. Fall back to resolving from the working directory, which is
 * where `npm i puppeteer-core` actually puts it.
 */
async function loadPuppeteer() {
  try {
    return (await import('puppeteer-core')).default;
  } catch {}
  try {
    const require = createRequire(path.join(process.cwd(), 'package.json'));
    return (await import(pathToFileURL(require.resolve('puppeteer-core')).href)).default;
  } catch {}
  throw new Error(
    'puppeteer-core not found, in either\n' +
      `  ${path.dirname(new URL(import.meta.url).pathname)}\n  ${process.cwd()}\n` +
      'Run `npm i puppeteer-core` in the directory you are running from.',
  );
}

// ── args ─────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (flag, fallback = null) => {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const has = (flag) => argv.includes(flag);

if (has('--help') || !arg('--config')) {
  console.log(`
Usage:
  node generate.mjs --config <file.json> --out <dir> [--public <dir>] [--only <substr>]

  --config   brand config JSON (see reference/config.md)
  --out      where the brand kit is written
  --public   optional: also place web-facing icons (favicons, ICO, SVG,
             apple-touch, android-chrome, og.png, site.webmanifest) into a
             site directory
  --only     render only assets whose name contains this substring
  --chrome   path to Chrome (default: first one found, or $CHROME_PATH)
`.trim());
  process.exit(has('--help') ? 0 : 2);
}

let CONFIG;
try {
  CONFIG = JSON.parse(fs.readFileSync(arg('--config'), 'utf8'));
} catch (e) {
  throw new Error(`could not read config ${arg('--config')}: ${e.message}`);
}
const OUT = path.resolve(arg('--out', './brand'));
const PUBLIC = arg('--public') ? path.resolve(arg('--public')) : null;
const ONLY = arg('--only');

// puppeteer-core ships no browser, so find one. Order: explicit flag, env, then
// the usual install paths on macOS and Linux.
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
].filter(Boolean);

const CHROME = arg('--chrome') || CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!CHROME) {
  throw new Error(
    'no Chrome found. Pass --chrome <path>, or set CHROME_PATH. Looked in:\n  ' +
      CHROME_CANDIDATES.join('\n  '),
  );
}

fs.mkdirSync(OUT, { recursive: true });
if (PUBLIC) fs.mkdirSync(PUBLIC, { recursive: true });

// ── config with defaults ─────────────────────────────────────────
const {
  name,
  shortName = name,
  tagline = '',
  headline = name,
  blurb = tagline,
  domain = '',
  colors: {
    ink = '#0a0a0d',
    accent = '#f0263f',
    light = '#ffffff',
    muted = '#a4a4ae',
    onDark = '#f2f2f4',
  } = {},
  font: { family: fontFamily = 'Inter', weight: fontWeight = 600 } = {},
  mark,
  markSmall = mark,
  // fraction of the tile the mark fills, and tile corner radius as a fraction
  inset = 0.9,
  cornerRadius = 0.22,
} = CONFIG;

if (!name) throw new Error('config: "name" is required');
if (!mark?.primary?.length) throw new Error('config: "mark.primary" must be a non-empty array of path d strings');

// ── mark rendering ───────────────────────────────────────────────
/** @param {object} m  @param {string} a colour for `primary` @param {string} b colour for `accent` */
const svg = (m, a, b = a) => `
<svg viewBox="${m.viewBox || '0 0 200 200'}" fill="none">
  ${(m.primary || []).map((d) => `<path d="${d}" fill="${a}"/>`).join('\n  ')}
  ${(m.accent || []).map((d) => `<path d="${d}" fill="${b}"/>`).join('\n  ')}
</svg>`;

const MARK = (a, b) => svg(mark, a, b);
const MARK_SMALL = (a, b) => svg(markSmall, a, b);

/**
 * A standalone `favicon.svg` — the same rounded tile as the raster favicons, but
 * vector. Uses `markSmall`: the browser tab is the only place this file is used,
 * so it is subject to the same 16px legibility rule as favicon-16x16.png.
 */
function faviconSvg() {
  const parts = (markSmall.viewBox || '0 0 200 200').trim().split(/[\s,]+/).map(Number);
  const [vx, vy, vw, vh] = parts.length === 4 && parts.every(Number.isFinite)
    ? parts
    : [0, 0, 200, 200];

  const S = 512;                                   // nominal box; it is vector either way
  const n = (v) => +v.toFixed(3);
  const scale = (S * inset) / Math.max(vw, vh);
  const tx = (S - vw * scale) / 2 - vx * scale;
  const ty = (S - vh * scale) / 2 - vy * scale;

  const paths = [
    ...(markSmall.primary || []).map((d) => `<path d="${d}" fill="${light}"/>`),
    ...(markSmall.accent || []).map((d) => `<path d="${d}" fill="${accent}"/>`),
  ].join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" rx="${n(S * cornerRadius)}" fill="${ink}"/>
  <g transform="translate(${n(tx)} ${n(ty)}) scale(${n(scale)})">
    ${paths}
  </g>
</svg>
`;
}

const FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${fontWeight}&display=swap">`;

const page = (body, css = '') => `<!DOCTYPE html><html><head><meta charset="utf-8">${FONT_LINK}
<style>*{margin:0;padding:0;box-sizing:border-box}
html,body{background:transparent}
body{font-family:"${fontFamily}",system-ui,sans-serif;display:grid;place-items:center}
svg{display:block}
${css}</style></head><body>${body}</body></html>`;

/** a square tile holding the mark, sized by `inset` */
const tile = (size, bg, rounded) => `
  .tile{width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg};
        border-radius:${rounded ? Math.round(size * cornerRadius) + 'px' : '0'}}
  .tile svg{width:${Math.round(size * inset)}px;height:${Math.round(size * inset)}px}`;

const box = (w, h) => `body{width:${w}px;height:${h}px}`;
const full = (s) => `svg{width:${s}px;height:${s}px}`;

// ── the kit ──────────────────────────────────────────────────────
const assets = [
  // avatars — mark on its dark ground, and the light inverse
  { name: 'avatar-1024.png', w: 1024, h: 1024,
    html: page(`<div class="tile">${MARK(light, accent)}</div>`, box(1024, 1024) + tile(1024, ink, true)) },
  { name: 'avatar-square-1024.png', w: 1024, h: 1024,
    html: page(`<div class="tile">${MARK(light, accent)}</div>`, box(1024, 1024) + tile(1024, ink, false)) },
  { name: 'avatar-light-1024.png', w: 1024, h: 1024,
    html: page(`<div class="tile">${MARK(ink, accent)}</div>`, box(1024, 1024) + tile(1024, light, true)) },
  { name: 'avatar-light-square-1024.png', w: 1024, h: 1024,
    html: page(`<div class="tile">${MARK(ink, accent)}</div>`, box(1024, 1024) + tile(1024, light, false)) },

  // bare marks, transparent
  { name: 'mark-duo-dark-1024.png', w: 1024, h: 1024, transparent: true,
    html: page(MARK(light, accent), box(1024, 1024) + full(1024)) },
  { name: 'mark-duo-light-1024.png', w: 1024, h: 1024, transparent: true,
    html: page(MARK(ink, accent), box(1024, 1024) + full(1024)) },
  { name: 'mark-light-1024.png', w: 1024, h: 1024, transparent: true,
    html: page(MARK(light), box(1024, 1024) + full(1024)) },
  { name: 'mark-accent-1024.png', w: 1024, h: 1024, transparent: true,
    html: page(MARK(accent), box(1024, 1024) + full(1024)) },
  { name: 'mark-ink-1024.png', w: 1024, h: 1024, transparent: true,
    html: page(MARK(ink), box(1024, 1024) + full(1024)) },

  // lockups — named for the ground they sit on
  { name: 'lockup-dark-2400.png', w: 2400, h: 620, transparent: true,
    html: page(`<div class="lock">${MARK(light, accent)}<span>${name}</span></div>`,
      box(2400, 620) + `.lock{display:flex;align-items:center;gap:34px}
       .lock svg{width:520px;height:520px}
       span{font-size:270px;font-weight:${fontWeight};letter-spacing:-.045em;color:${light};line-height:1}`) },
  { name: 'lockup-light-2400.png', w: 2400, h: 620, transparent: true,
    html: page(`<div class="lock">${MARK(ink, accent)}<span>${name}</span></div>`,
      box(2400, 620) + `.lock{display:flex;align-items:center;gap:34px}
       .lock svg{width:520px;height:520px}
       span{font-size:270px;font-weight:${fontWeight};letter-spacing:-.045em;color:${ink};line-height:1}`) },

  // raster favicons — Google Search ignores SVG favicons
  { name: 'favicon-16x16.png', w: 16, h: 16, web: true,
    html: page(`<div class="tile">${MARK_SMALL(light, accent)}</div>`, box(16, 16) + tile(16, ink, true)) },
  { name: 'favicon-32x32.png', w: 32, h: 32, web: true,
    html: page(`<div class="tile">${MARK(light, accent)}</div>`, box(32, 32) + tile(32, ink, true)) },
  { name: 'favicon-48x48.png', w: 48, h: 48, web: true,
    html: page(`<div class="tile">${MARK(light, accent)}</div>`, box(48, 48) + tile(48, ink, true)) },
  { name: 'apple-touch-icon.png', w: 180, h: 180, web: true,
    html: page(`<div class="tile">${MARK_SMALL(light, accent)}</div>`, box(180, 180) + tile(180, ink, false)) },
  { name: 'android-chrome-192x192.png', w: 192, h: 192, web: true,
    html: page(`<div class="tile">${MARK(light, accent)}</div>`, box(192, 192) + tile(192, ink, true)) },
  { name: 'android-chrome-512x512.png', w: 512, h: 512, web: true,
    html: page(`<div class="tile">${MARK(light, accent)}</div>`, box(512, 512) + tile(512, ink, true)) },

  // social
  { name: 'social-banner-1500x500.png', w: 1500, h: 500,
    html: page(
      `<div class="bn"><div class="lock">${MARK(light, accent)}<span>${name}</span></div><p>${tagline}</p></div>`,
      box(1500, 500) + `.bn{width:1500px;height:500px;background:${ink};display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:32px}
       .lock{display:flex;align-items:center;gap:8px}
       .lock svg{width:136px;height:136px}
       .lock span{font-size:82px;font-weight:${fontWeight};letter-spacing:-.045em;color:${onDark};line-height:1}
       p{font-size:29px;color:${muted};letter-spacing:-.01em}`) },
  { name: 'og-1200x630.png', w: 1200, h: 630, web: true,
    html: page(
      `<div class="og">
         <div class="lock">${MARK(light, accent)}<span class="wm">${name}</span></div>
         <h1>${headline.split('\n').join('<br>')}</h1>
         <p>${blurb}</p>
         ${domain ? `<div class="url">${domain}</div>` : ''}
       </div>`,
      box(1200, 630) + `.og{width:1200px;height:630px;background:${ink};padding:74px 80px;position:relative}
       .lock{display:flex;align-items:center;gap:2px}
       .lock svg{width:74px;height:74px}
       .wm{font-size:29px;font-weight:${fontWeight};letter-spacing:-.03em;color:${onDark}}
       h1{margin-top:92px;font-size:84px;font-weight:${fontWeight};letter-spacing:-.045em;
          line-height:1.04;color:${onDark}}
       .og p{margin-top:28px;font-size:26px;color:${muted};letter-spacing:-.01em}
       .url{position:absolute;right:80px;bottom:64px;font-size:22px;color:${muted};opacity:.7}`) },
];

// ── ICO packing (no image library needed) ────────────────────────
// The ICO container has allowed embedded PNG data since Vista, so the PNGs
// go in verbatim rather than being re-encoded as BMP.
const pngSize = (b) => [b.readUInt32BE(16), b.readUInt32BE(20)];

function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);            // reserved
  header.writeUInt16LE(1, 2);            // type: icon
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + 16 * pngs.length;
  const entries = [];
  for (const data of pngs) {
    const [w, h] = pngSize(data);
    const e = Buffer.alloc(16);
    e.writeUInt8(w >= 256 ? 0 : w, 0);   // 256 is encoded as 0
    e.writeUInt8(h >= 256 ? 0 : h, 1);
    e.writeUInt8(0, 2);                  // palette size
    e.writeUInt8(0, 3);                  // reserved
    e.writeUInt16LE(1, 4);               // colour planes
    e.writeUInt16LE(32, 6);              // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...pngs]);
}

// ── render ───────────────────────────────────────────────────────
const puppeteer = await loadPuppeteer();

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--disable-gpu', '--force-device-scale-factor=1'],
});

const written = [];
for (const a of assets) {
  if (ONLY && !a.name.includes(ONLY)) continue;
  const p = await browser.newPage();
  await p.setViewport({ width: a.w, height: a.h, deviceScaleFactor: 1 });

  // navigate to a temp file rather than setContent: setContent + networkidle0
  // hangs waiting on the webfont stylesheet
  const tmp = path.join(OUT, `.tmp-${a.name}.html`);
  fs.writeFileSync(tmp, a.html);
  await p.goto(`file://${tmp}`, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 250));

  const dest = path.join(OUT, a.name);
  await p.screenshot({ path: dest, omitBackground: !!a.transparent });
  fs.unlinkSync(tmp);
  written.push(a);
  console.log(`  ${a.name.padEnd(34)} ${a.w}x${a.h}${a.transparent ? '  transparent' : ''}`);
  await p.close();
}
await browser.close();

// ── favicon.svg ──────────────────────────────────────────────────
// Vector, so it is written rather than screenshotted. The <head> block links it
// and the verifier checks it, so it ships alongside the raster favicons.
if (!ONLY || 'favicon.svg'.includes(ONLY)) {
  const out = faviconSvg();
  fs.writeFileSync(path.join(OUT, 'favicon.svg'), out);
  console.log(`  ${'favicon.svg'.padEnd(34)} vector, ${out.length} bytes`);
}

// ── favicon.ico ──────────────────────────────────────────────────
const icoParts = ['favicon-16x16.png', 'favicon-32x32.png', 'favicon-48x48.png']
  .map((f) => path.join(OUT, f))
  .filter((f) => fs.existsSync(f));

if (icoParts.length) {
  const ico = buildIco(icoParts.map((f) => fs.readFileSync(f)));
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico);
  console.log(`  ${'favicon.ico'.padEnd(34)} ${icoParts.length} sizes, ${ico.length} bytes`);
}

// ── place web-facing files ───────────────────────────────────────
if (PUBLIC) {
  const move = written.filter((a) => a.web).map((a) => a.name).concat('favicon.ico', 'favicon.svg');
  for (const f of move) {
    const src = path.join(OUT, f);
    if (!fs.existsSync(src)) continue;
    // the OG card is referenced as og.png by convention
    const dest = path.join(PUBLIC, f === 'og-1200x630.png' ? 'og.png' : f);
    fs.copyFileSync(src, dest);
  }

  const manifest = {
    id: '/',
    name,
    short_name: shortName,
    description: blurb,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: ink,
    theme_color: ink,
    lang: 'en',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
  fs.writeFileSync(path.join(PUBLIC, 'site.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n  → web icons + site.webmanifest placed in ${PUBLIC}`);
}

console.log(`\n${written.length} assets written to ${OUT}`);
