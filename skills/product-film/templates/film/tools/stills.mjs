#!/usr/bin/env node
/**
 * Store images, posters and social cards in the film's look: frames of the film rendered without
 * words (?clean), each laid out at its exact size with one headline in the film's type, in each
 * theme. Everything is described in stills.json (see the sample next to it).
 *
 *   node tools/stills.mjs [--config stills.json] [--only store]
 *
 * stills.json:
 *   brand    { name, mark }: the wordmark (mark: inline SVG in currentColor)
 *   themes   ["light", "dark"]
 *   frames   { name: { t, query? } }: film moments; query adds URL flags (e.g. "still=bin")
 *   sets     { name: { dir, images: [...] } }, each image:
 *     file, w, h          output name and size
 *     frame               which frame fills it
 *     x                   cover crop: 0 keeps the left edge, 1 the right (default 0.5)
 *     fit: "contain"      the whole frame, sharp, faded at its edges over the sky; zoom, y place it
 *     real                a real capture laid over a soft blur of the frame: { src: "captures/popup-{theme}.png", width: 0.28 }
 *     layout              side (headline left, over a wash) · top (centred above) · hero (wordmark,
 *                         line, foot) · poster (wordmark, title, line) · brand (wordmark only, for small tiles)
 *     title, line, foot   the words (HTML: <br> for breaks); size: the title's px at 1280 wide
 *
 * One idea per image, the same words the film and the store listing use, and nothing the
 * product doesn't do.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';
import { serve } from './serve.mjs';
import { launch, openFilm, CLIP, arg } from './browser.mjs';

const config = JSON.parse(readFileSync(arg('config', 'stills.json'), 'utf8'));
const only = arg('only', null);
const themes = config.themes || ['light', 'dark'];
const BRAND = (size) => `<div class="brand" style="font-size:${size}px">${config.brand.mark}<span>${config.brand.name}</span></div>`;
/** The end shot's ground, behind a contained frame. Match it to film.js GROUNDS.night. */
const SKY = config.sky || {
  dark: 'radial-gradient(90% 80% at 50% 42%,#1a1f33 0%,#0b0e18 45%,#040508 100%)',
  light: 'radial-gradient(90% 80% at 50% 42%,#ffffff 0%,#f1f1f4 50%,#dcdce3 100%)',
};

const STYLE = (dark) => `
  *{box-sizing:border-box} html,body{margin:0}
  body{font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;color:${dark ? '#f4f5f7' : '#16181d'};background:${dark ? '#05060a' : '#f4f4f6'}}
  .page{position:relative;overflow:hidden}
  .bg{position:absolute;inset:0;background-repeat:no-repeat}
  .soft{filter:blur(14px) saturate(1.1);transform:scale(1.08);opacity:${dark ? 0.75 : 0.85}}
  .wash{position:absolute;inset:0;background:linear-gradient(90deg,${dark ? 'rgba(4,5,10,.82),rgba(4,5,10,.55) 30%,rgba(4,5,10,0) 55%' : 'rgba(250,250,252,.88),rgba(250,250,252,.6) 30%,rgba(250,250,252,0) 55%'})}
  .h{font-weight:600;letter-spacing:-.04em;line-height:1.05;background:linear-gradient(180deg,${dark ? '#fff 30%,#b9bcc6' : '#16181d 30%,#4a4f59'} 100%);-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.18em;margin-bottom:-.18em}
  .l{font-weight:500;letter-spacing:-.02em;line-height:1.25;color:${dark ? '#c9ccd3' : '#4a4f59'}}
  .brand{display:inline-flex;align-items:center;gap:.28em;font-weight:600;letter-spacing:-.04em;line-height:1}
  .brand svg{width:1em;height:1em}
  .shot{position:absolute;top:50%;transform:translateY(-50%);border-radius:14px;box-shadow:0 40px 90px -30px rgba(0,0,0,${dark ? '.8' : '.35'}),0 0 0 1px ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}}`;

function page(o, theme, frames) {
  const { w, h } = o, u = w / 1280, dark = theme === 'dark';
  const img = frames[o.frame];
  const scale = Math.max(w / 1920, h / 1080), fw = 1920 * scale, fh = 1080 * scale;
  let body = `<div class="bg${o.real ? ' soft' : ''}" style="background-image:url(${img});background-size:${fw}px ${fh}px;background-position:${-(fw - w) * (o.x ?? 0.5)}px ${-(fh - h) / 2}px"></div>`;
  if (o.fit === 'contain') {
    const cw = w * (o.zoom ?? 1), ch = 1080 * (cw / 1920), mask = 'radial-gradient(closest-side,#000 72%,transparent)';
    body = `<div class="bg" style="background:${SKY[theme]}"></div><div class="bg" style="left:${(w - cw) / 2}px;top:${(h - ch) * (o.y ?? 0.5)}px;width:${cw}px;height:${ch}px;right:auto;bottom:auto;background-image:url(${img});background-size:100% 100%;-webkit-mask-image:${mask};mask-image:${mask}"></div>`;
  }
  if (o.real) {
    const file = o.real.src.replace('{theme}', theme);
    const src = `data:image/${extname(file).slice(1).replace('jpg', 'jpeg')};base64,${readFileSync(file).toString('base64')}`;
    body += `<img class="shot" src="${src}" style="width:${w * (o.real.width ?? 0.45)}px;right:${w * (o.real.right ?? 0.06)}px;border-radius:${14 * u}px">`;
  }
  const title = (size, extra = '') => (o.title ? `<div class="h" style="font-size:${size * u}px${extra}">${o.title}</div>` : '');
  const line = (size, gap) => (o.line ? `<div class="l" style="font-size:${size * u}px;margin-top:${gap * u}px">${o.line}</div>` : '');
  if (o.layout === 'side') {
    body += `<div class="wash"></div><div style="position:absolute;left:${84 * u}px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">${title(o.size || 56)}${line(26, 22)}</div>`;
  } else if (o.layout === 'top') {
    body += `<div style="position:absolute;left:0;right:0;top:${84 * u}px;text-align:center">${title(o.size || 54)}${line(26, 16)}</div>`;
  } else if (o.layout === 'poster') {
    body += `<div style="position:absolute;left:0;right:0;top:${64 * u}px;text-align:center"><div style="margin-bottom:${22 * u}px">${BRAND(40 * u)}</div>${title(o.size || 60)}${line(26, 18)}</div>`;
  } else if (o.layout === 'hero') {
    body += `<div style="position:absolute;left:0;right:0;top:${80 * u}px;text-align:center">${BRAND(64 * u)}${line(28, 18)}</div>`;
    if (o.foot) body += `<div class="l" style="position:absolute;left:0;right:0;bottom:${70 * u}px;text-align:center;font-size:${24 * u}px">${o.foot}</div>`;
  } else if (o.layout === 'brand') {
    const small = w < 600;
    const strong = dark ? 'rgba(4,5,10,.92),rgba(4,5,10,.75) 38%,rgba(4,5,10,0) 68%' : 'rgba(250,250,252,.95),rgba(250,250,252,.8) 38%,rgba(250,250,252,0) 68%';
    if (!small) body += `<div class="wash" style="background:linear-gradient(90deg,${strong})"></div>`;
    body += `<div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:${small ? 'center' : 'flex-start'};padding-left:${small ? 0 : 90}px">
      <div style="padding:${small ? '14px 24px' : '0'};border-radius:18px;${small ? `background:${dark ? 'rgba(5,6,10,.55)' : 'rgba(250,250,252,.7)'};backdrop-filter:blur(8px)` : ''}">
      ${BRAND(small ? 46 : 82)}${o.line ? `<div class="l" style="font-size:30px;margin-top:20px">${o.line}</div>` : ''}</div></div>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=block" rel="stylesheet"><style>${STYLE(dark)}</style></head>
    <body><div class="page" style="width:${w}px;height:${h}px">${body}</div></body></html>`;
}

const server = await serve(0);
const browser = await launch();
try {
  for (const theme of themes) {
    // 1. the film's frames, without words, grouped by URL flags
    const frames = {};
    const byQuery = {};
    for (const [name, f] of Object.entries(config.frames)) (byQuery[f.query || ''] ||= []).push([name, f]);
    for (const [query, list] of Object.entries(byQuery)) {
      const tab = await openFilm(browser, `http://127.0.0.1:${server.address().port}/index.html?export&clean&theme=${theme}${query ? `&${query}` : ''}`);
      for (const [name, f] of list) {
        await tab.evaluate((t) => window.renderFrame(t), f.t);
        frames[name] = `data:image/png;base64,${(await tab.screenshot({ type: 'png', clip: CLIP })).toString('base64')}`;
      }
      await tab.close();
    }
    // 2. each image, laid out and shot at its size
    for (const [setName, set] of Object.entries(config.sets)) {
      if (only && only !== setName) continue;
      const dir = `${set.dir}/${theme}`;
      mkdirSync(dir, { recursive: true });
      for (const o of set.images) {
        const p = await browser.newPage({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: 1 });
        await p.setContent(page(o, theme, frames), { waitUntil: 'networkidle' });
        await p.evaluate(() => document.fonts.ready);
        const type = o.file.endsWith('.png') ? 'png' : 'jpeg';
        writeFileSync(`${dir}/${o.file}`, await p.screenshot({ type, ...(type === 'jpeg' ? { quality: 92 } : {}) }));
        await p.close();
        console.log(`${dir}/${o.file}`);
      }
    }
  }
} finally {
  await browser.close();
  server.close();
}
