#!/usr/bin/env node
/**
 * Films a working web prototype: a take, frame by frame, on a virtual clock. The prototype runs in
 * headless Chrome; time only moves when a frame is taken, so every frame is smooth however long it
 * takes to draw. A scripted pointer and keys drive the prototype's real interactions (CDP mouse and
 * key events), a camera follows what's happening, and a drawn pointer and keycaps go on top.
 * Silent by default; --music adds a track (for a cut posted on its own, as on TikTok).
 *
 *   node scripts/take.mjs <take file> <out.mp4> [--size 1080x1080] [--fps 60] [--scale 2] [--port 9337]
 *   node scripts/take.mjs <take file> <out.mp4> --stills 1.5,4.6,9 [--scale 1]        PNGs, to check
 *   node scripts/take.mjs <take file> <out.mp4> --music <track> [--music-start 12.5] [--lufs -16]
 *
 * The take file (see reference/take-file.md) names the prototype, its stage size, the actions and
 * where the camera should look. Needs Node 22+ (WebSocket), Chrome and ffmpeg.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [takeFile, out, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => { const i = rest.indexOf(`--${name}`); return i < 0 ? fallback : rest[i + 1]; };
if (!takeFile || !out) { console.error('usage: node scripts/take.mjs <take file> <out.mp4> [--size WxH] [--fps 60] [--scale 2] [--stills 1,2] [--music <track>]'); process.exit(1); }
const TAKE = (await import(pathToFileURL(resolve(takeFile)).href)).default;
const HERE = dirname(resolve(takeFile));
const FPS = Number(opt('fps', 60)), SCALE = Number(opt('scale', 2)), PORT = Number(opt('port', 9337));
const [FW, FH] = opt('size', TAKE.size || '1080x1080').split('x').map(Number);
const stills = (opt('stills', '') || '').split(',').filter(Boolean).map(Number);
const { width: SW, height: SH } = TAKE.stage;
const WARM = TAKE.warm ?? 1, DURATION = TAKE.duration;
// A frame wider than the stage would crop its top and bottom; with `extend`, the camera may instead
// look past its sides by EXT (the setup draws something there: see reference/take-file.md).
const EXT = TAKE.extend && FW / FH > SW / SH + 0.01 ? Math.ceil((FW / FH * SH - SW) / 2) + 2 : 0;
const src = (v) => (typeof v === 'function' ? `(${v.toString()})` : v);
mkdirSync(dirname(resolve(out)), { recursive: true });

/* ---------- The actions, typing spread into key presses ---------- */

const MOD = { alt: 1, ctrl: 2, meta: 4, shift: 8 };
const keyOf = (ch) => ({ code: ch === ' ' ? 'Space' : /[a-z]/i.test(ch) ? `Key${ch.toUpperCase()}` : /\d/.test(ch) ? `Digit${ch}` : '', key: ch, text: ch });
const ACTIONS = TAKE.actions.flatMap((a) => (a.type
  ? [...a.type].map((ch, i) => ({ at: a.at + i * (a.every ?? 0.07), press: keyOf(ch) }))
  : [a])).sort((a, b) => a.at - b.at);

/* ---------- The virtual clock (in the page before it loads) ---------- */

const SHIM = `(() => {
  const realRAF = window.requestAnimationFrame.bind(window), realTimeout = window.setTimeout.bind(window);
  let vt = 0, tid = 1;
  const raf = [], timers = new Map(), born = new WeakMap(), vborn = new WeakMap();
  performance.now = () => vt;
  const base = Date.now(); Date.now = () => base + vt;
  window.requestAnimationFrame = (cb) => { raf.push(cb); return raf.length; };
  window.cancelAnimationFrame = () => {};
  window.setTimeout = (fn, ms = 0, ...a) => { const id = tid++; timers.set(id, { at: vt + ms, fn: () => fn(...a) }); return id; };
  window.clearTimeout = (id) => timers.delete(id);
  window.setInterval = (fn, ms = 0) => { const id = tid++; const step = () => { timers.set(id, { at: vt + ms, fn: () => { fn(); step(); } }); }; step(); return id; };
  window.clearInterval = (id) => timers.delete(id);
  try { for (const [k, v] of Object.entries(${JSON.stringify(TAKE.storage || {})})) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch {}
  window.__take = { ext: ${EXT}, cam: { ox: 0, oy: 0, k: 1 }, focus: null, cross: false, moving: false };
  window.__time = (ms) => { vt = ms; };
  // Timers, animation frames, CSS and Web animations, videos and images, all brought up to the clock.
  window.__tick = async () => {
    for (const [id, t] of [...timers].sort((a, b) => a[1].at - b[1].at)) if (t.at <= vt) { timers.delete(id); try { t.fn(); } catch (e) { console.error(e); } }
    for (const cb of raf.splice(0)) { try { cb(vt); } catch (e) { console.error(e); } }
    window.__take.afterFrame?.();
    for (const a of document.getAnimations()) { if (!born.has(a)) { born.set(a, vt); a.pause(); } a.currentTime = vt - born.get(a); }
    const waits = [];
    for (const v of document.querySelectorAll('video')) {
      if (!vborn.has(v)) vborn.set(v, vt);
      v.pause();
      if (v.readyState < 1) waits.push(new Promise((r) => { v.addEventListener('loadedmetadata', r, { once: true }); realTimeout(r, 3000); }));
    }
    await Promise.all(waits);
    const seeks = [];
    for (const v of document.querySelectorAll('video')) {
      const t = ((vt - vborn.get(v)) / 1000) % (v.duration || 1e9);
      if (Math.abs(v.currentTime - t) > 0.001) seeks.push(new Promise((r) => { v.addEventListener('seeked', r, { once: true }); realTimeout(r, 1500); v.currentTime = t; }));
    }
    const imgs = [...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); realTimeout(r, 3000); }));
    await Promise.all([...seeks, ...imgs]);
    await new Promise((r) => realRAF(() => realRAF(r)));
  };
})();`;

/* ---------- The camera, the drawn pointer and keycaps (after the page loads) ---------- */

const OVERLAY = `(() => {
  const T = window.__take, W = ${FW}, H = ${FH};
  // Where an element's centre is, in stage coordinates (the inverse of the camera), for actions' "to".
  T.at = (sel, dx = 0, dy = 0) => { const el = document.querySelector(sel); if (!el) throw new Error('no ' + sel); const r = el.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - T.cam.ox) / T.cam.k + dx, y: (r.top + r.height / 2 - T.cam.oy) / T.cam.k + dy }; };
  const apply = ${TAKE.camera?.apply ? src(TAKE.camera.apply) : `(x, y, k, ox, oy) => { const el = document.querySelector(${JSON.stringify(TAKE.camera?.selector || 'body')}); el.style.transformOrigin = '0 0'; el.style.transform = \`translate(\${ox}px, \${oy}px) scale(\${k})\`; }`};
  T.camera = (x, y, k) => { const ox = W / 2 - x * k, oy = H / 2 - y * k; T.cam = { ox, oy, k }; apply(x, y, k, ox, oy); };
  T.focusOf = ${TAKE.focus ? src(TAKE.focus) : 'null'};
  document.body.insertAdjacentHTML('beforeend', \`
    <style>
      #__cur { position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none; transform-origin: 6px 3px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.3)); }
      #__cross { position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none; display: none; }
      #__keys { position: fixed; left: 0; top: 0; z-index: 2147483646; display: flex; gap: 8px; pointer-events: none; transform-origin: 0 0; }
      #__keys span { min-width: 54px; height: 50px; padding: 0 14px; border-radius: 12px; background: linear-gradient(180deg, #34312e, #22201e); color: #fff;
        font: 500 21px/50px -apple-system, system-ui, sans-serif; text-align: center; box-shadow: 0 4px 0 #100e0c, 0 14px 24px -10px rgba(0,0,0,.5); }
    </style>
    <svg id="__cross" width="30" height="30" viewBox="0 0 30 30"><path d="M15 2v26M2 15h26" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><path d="M15 2v26M2 15h26" stroke="#111" stroke-width="1.4" stroke-linecap="round"/></svg>
    <svg id="__cur" width="30" height="30" viewBox="0 0 28 28"><path d="M6 3.2v19.5l4.8-4.7 3 7 3.3-1.4-3-6.9h6.7L6 3.2z" fill="#fff"/><path d="M7.6 6.9v12.3l3.5-3.4 3.2 7.3 1.2-.5-3.1-7.2h4.8L7.6 6.9z" fill="#000"/></svg>
    <div id="__keys"></div>\`);
  const $ = (s) => document.getElementById(s);
  T.overlay = (cx, cy, k, pressed, keys, alpha) => {
    const s = k / 1.25;
    $('__cur').style.transform = \`translate(\${cx - 6}px, \${cy - 3}px) scale(\${s * (pressed ? 0.88 : 1)})\`;
    $('__cur').style.display = T.cross ? 'none' : '';
    $('__cross').style.display = T.cross ? '' : 'none';
    $('__cross').style.transform = \`translate(\${cx - 15}px, \${cy - 15}px) scale(\${s})\`;
    const el = $('__keys'), html = keys.map((c) => '<span>' + c + '</span>').join('');
    if (el._h !== html) { el._h = html; el.innerHTML = html; }
    el.style.opacity = alpha;
    el.style.transform = \`translate(\${cx + 26 * s}px, \${cy + 30 * s + 8 * (1 - alpha)}px) scale(\${s * 0.9})\`;
  };
})()`;

/* ---------- Chrome ---------- */

const CHROME = process.env.CHROME_PATH || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p));
if (!CHROME) { console.error('No Chrome found: set CHROME_PATH.'); process.exit(1); }
const profile = mkdtempSync(join(tmpdir(), 'take-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run',
  '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page'); } catch {} }
if (!target) { chrome.kill(); throw new Error(`Chrome didn't start on port ${PORT} (another take running? use --port)`); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const waiting = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => {
  const m = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (m.result?.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description || m.result.exceptionDetails.text);
  return m.result?.result?.value;
};

const page = /^https?:|^file:/.test(TAKE.page) ? TAKE.page : pathToFileURL(resolve(HERE, TAKE.page)).href;
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: FW, height: FH, deviceScaleFactor: SCALE, mobile: false });
await send('Page.addScriptToEvaluateOnNewDocument', { source: SHIM });
await send('Page.navigate', { url: page });
for (let i = 0; i < 100 && (await evaluate('document.readyState').catch(() => '')) !== 'complete'; i++) await sleep(100);
await evaluate('document.fonts.ready.then(() => true)');
await evaluate(OVERLAY);
if (TAKE.setup) await evaluate(`(${src(TAKE.setup)})()`);
for (const f of [].concat(TAKE.scripts || [])) await evaluate(readFileSync(resolve(HERE, f), 'utf8'));

/* ---------- Filming ---------- */

const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const fill = Math.max(FW / (SW + 2 * EXT), FH / SH);
const ptr = { ...(TAKE.pointer || { x: SW / 2, y: SH / 2 }) };
let tween = null, held = false, mods = 0, keys = [], keysAt = -9, cam = null;
// Keys held down across moments (`keydown` … `keyup`), as a hand holds ⌥ while the pointer moves. A held
// modifier rides on every mouse and key event until it's let go.
let heldMods = 0;
const MODKEY = { Alt: MOD.alt, Control: MOD.ctrl, Meta: MOD.meta, Shift: MOD.shift };

async function mouse(type, extra = {}) {
  const { ox, oy, k } = await evaluate('__take.cam');
  await send('Input.dispatchMouseEvent', { type, x: ox + ptr.x * k, y: oy + ptr.y * k, button: 'left', buttons: held ? 1 : 0, modifiers: mods | heldMods, ...extra });
}
const vkOf = (p) => ({ Escape: 27, Space: 32, Enter: 13, Backspace: 8, Tab: 9, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }[p.code]
  ?? { Alt: 18, Control: 17, Meta: 91, Shift: 16 }[p.key] ?? (p.key || ' ').toUpperCase().charCodeAt(0));
async function keyDown(p, modifiers) {
  const base = { code: p.code, key: p.key, modifiers, windowsVirtualKeyCode: vkOf(p) };
  await send('Input.dispatchKeyEvent', { type: p.text && !modifiers ? 'keyDown' : 'rawKeyDown', ...base, ...(p.text && !modifiers ? { text: p.text } : {}) });
}
async function key(p) {
  const modifiers = (p.alt ? MOD.alt : 0) | (p.ctrl ? MOD.ctrl : 0) | (p.meta ? MOD.meta : 0) | (p.shift ? MOD.shift : 0) | heldMods;
  await keyDown(p, modifiers);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code: p.code, key: p.key, modifiers, windowsVirtualKeyCode: vkOf(p) });
}
async function hold(p) { heldMods |= MODKEY[p.key] || 0; await keyDown(p, heldMods); }
async function release(p) { heldMods &= ~(MODKEY[p.key] || 0); await send('Input.dispatchKeyEvent', { type: 'keyUp', code: p.code, key: p.key, modifiers: heldMods, windowsVirtualKeyCode: vkOf(p) }); }

// One moment of the take, at t seconds: run what's due, move the pointer and camera, advance the clock.
let next = 0;
async function step(t) {
  await evaluate(`__time(${(WARM + t) * 1000})`);
  while (next < ACTIONS.length && ACTIONS[next].at <= t + 1e-9) {
    const a = ACTIONS[next++];
    if (a.keys) { keys = a.keys; keysAt = a.at; }
    if (a.to) {
      const to = typeof a.to === 'string' ? await evaluate(a.to) : a.to;
      if (process.env.DEBUG) console.error(a.at, JSON.stringify(to));
      if (!a.dur) Object.assign(ptr, to); else tween = { from: { ...ptr }, to, at: a.at, dur: a.dur };
    }
    if (a.focus !== undefined) await evaluate(`__take.focus = ${JSON.stringify(a.focus)}`);
    if (a.cross !== undefined) await evaluate(`__take.cross = ${!!a.cross}`);
    if (a.call) await evaluate(a.call);
    if (a.keydown) await hold(a.keydown);
    if (a.press) await key(a.press);
    if (a.keyup) await release(a.keyup);
    if (a.click) { mods = (a.click.meta ? MOD.meta : 0) | (a.click.shift ? MOD.shift : 0) | (a.click.alt ? MOD.alt : 0); held = true; await mouse('mousePressed', { clickCount: 1 }); held = false; await mouse('mouseReleased', { clickCount: 1 }); mods = 0; }
    if (a.down) { held = true; await mouse('mousePressed', { clickCount: 1 }); }
    if (a.up) { held = false; await mouse('mouseReleased', { clickCount: 1 }); }
  }
  if (tween) {
    const p = Math.min(1, (t - tween.at) / tween.dur), e = ease(p);
    // a slight arc, as a hand moves
    const arc = Math.sin(Math.PI * e) * Math.hypot(tween.to.x - tween.from.x, tween.to.y - tween.from.y) * 0.06;
    ptr.x = tween.from.x + (tween.to.x - tween.from.x) * e;
    ptr.y = tween.from.y + (tween.to.y - tween.from.y) * e - arc;
    if (p >= 1) tween = null;
  }
  // The camera eases toward what's happening, never past the stage (or its extension).
  const f = (await evaluate('__take.focus || (__take.focusOf && __take.focusOf())')) || { x: SW / 2, y: SH / 2, k: fill };
  if (!cam) cam = { ...f };
  const a = 1 - Math.exp(-4.2 / FPS), b = 1 - Math.exp(-3 / FPS);
  cam.x += (f.x - cam.x) * a; cam.y += (f.y - cam.y) * a; cam.k += (f.k - cam.k) * b;
  const k = Math.max(cam.k, fill), hw = FW / 2 / k, hh = FH / 2 / k;
  const cx = Math.min(Math.max(cam.x, hw - EXT), SW + EXT - hw), cy = Math.min(Math.max(cam.y, hh), SH - hh);
  await evaluate(`__take.camera(${cx}, ${cy}, ${k})`);
  await mouse('mouseMoved');
  await evaluate(`__take.moving = ${!!tween}`);
  await evaluate('__tick()');
  const kd = t - keysAt, alpha = kd < 0 ? 0 : kd < 0.15 ? kd / 0.15 : kd < 0.6 ? 1 : Math.max(0, 1 - (kd - 0.6) / 0.25);
  await evaluate(`__take.overlay(${FW / 2 + (ptr.x - cx) * k}, ${FH / 2 + (ptr.y - cy) * k}, ${k}, ${held}, ${JSON.stringify(keys)}, ${alpha})`);
}
const shot = async (format) => Buffer.from((await send('Page.captureScreenshot', { format, quality: 94 })).result.data, 'base64');

try {
  // The page settles first (fonts, pictures, opening animations), off camera.
  for (let w = 0; w <= WARM * 1000; w += 1000 / FPS) { await evaluate(`__time(${w})`); await evaluate('__tick()'); }
  const frames = Math.round(DURATION * FPS);
  if (stills.length) {
    let s = 0;
    for (let i = 0; i < frames && s < stills.length; i++) {
      await step(i / FPS);
      if (i / FPS >= stills[s] - 1e-9) { const file = out.replace(/\.mp4$/, '') + `-${stills[s]}.png`; writeFileSync(file, await shot('png')); console.log(file); s++; }
    }
  } else {
    const silent = opt('music', '') ? out.replace(/\.mp4$/, '.silent.mp4') : out;
    const ffmpeg = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
      '-vf', `scale=${FW}:${FH}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(silent)],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    const started = Date.now();
    for (let i = 0; i < frames; i++) {
      await step(i / FPS);
      const buf = await shot('jpeg');
      if (!ffmpeg.stdin.write(buf)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
      if (i % FPS === 0) process.stderr.write(`\r${(i / FPS).toFixed(0)}s / ${DURATION}s  (${((Date.now() - started) / 1000).toFixed(0)}s elapsed)`);
    }
    ffmpeg.stdin.end();
    await new Promise((r) => ffmpeg.on('close', r));
    process.stderr.write('\n');
    if (opt('music', '')) {
      // The cut posted on its own: a track under it, from --music-start, faded, levelled (two passes).
      const lufs = Number(opt('lufs', -16)), ms = Number(opt('music-start', 0));
      const shape = `atrim=start=${ms}:duration=${DURATION},asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st=${Math.max(0, DURATION - 1.2)}:d=1.2`;
      const meas = spawnSync('ffmpeg', ['-hide_banner', '-i', opt('music'), '-af', `${shape},loudnorm=I=${lufs}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
      const m = JSON.parse(meas.match(/\{[^{}]*\}/g).pop());
      const norm = `loudnorm=I=${lufs}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
      const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', resolve(silent), '-i', opt('music'), '-filter_complex', `[1:a]${shape},${norm}[a]`,
        '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', resolve(out)], { stdio: 'inherit' });
      if (r.status) throw new Error('ffmpeg failed adding the music');
      rmSync(resolve(silent), { force: true });
    }
    console.log(out);
  }
} finally {
  ws.close();
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
