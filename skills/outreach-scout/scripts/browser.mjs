#!/usr/bin/env node
// Drives a research browser: a separate Chrome profile with remote debugging, where the person
// signs in to sites themselves. Reads pages, lists and fills forms, uploads files, takes
// screenshots. Never submits, signs in, signs up, pays, posts or deletes: buttons that would are
// refused, and password fields are never filled.
//
//   node scripts/browser.mjs start [url]                 start Chrome with its own profile (~/.outreach-browser)
//   node scripts/browser.mjs tabs                        list open tabs
//   node scripts/browser.mjs open <url>                  open a new tab (or navigate --tab)
//   node scripts/browser.mjs text  --tab <match>         the page's visible text
//   node scripts/browser.mjs fields --tab <match>        every form field: label, name, id, type, value, options
//   node scripts/browser.mjs fill <values.json> --tab <match>    set fields (see below)
//   node scripts/browser.mjs check <values.json> --tab <match>   which fields don't hold those values
//   node scripts/browser.mjs upload <file-input index> <file…> --tab <match>
//   node scripts/browser.mjs click "<button text>" --tab <match> safe buttons only ("Use this icon", "Save", "More details")
//   node scripts/browser.mjs shot <out.png> [--full] --tab <match>
//
// --tab picks the tab whose URL or title contains <match>. --port (default 9333, or
// $OUTREACH_BROWSER_PORT) picks the browser. Needs Node 22+ (built-in WebSocket).
//
// values.json maps a field to its value. A key is "#id", a field's name, or its label (exact,
// case-insensitive). Text, textarea and select: a string. Checkbox: true or false. Radio: the
// key is the group's name and the value the option's value (or label).
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const opt = (name, fallback) => { const i = argv.indexOf(`--${name}`); if (i < 0) return fallback; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (name) => { const i = argv.indexOf(`--${name}`); if (i < 0) return false; argv.splice(i, 1); return true; };
const port = Number(opt('port', process.env.OUTREACH_BROWSER_PORT || 9333));
const tabMatch = opt('tab');
const full = flag('full');
const [cmd, ...rest] = argv;
const base = `http://127.0.0.1:${port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = (v) => console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2));
const fail = (msg) => { console.error(msg); process.exit(1); };

// Buttons the person presses, never this script.
const REFUSE = /\b(submit|send|publish|post|launch now|pay|checkout|buy|purchase|order|sign ?in|log ?in|sign ?up|register|create account|delete|remove account|confirm|subscribe|reserve)\b/i;

if (typeof WebSocket === 'undefined') fail('Needs Node 22 or later (for the built-in WebSocket).');

function chromePath() {
  const candidates = {
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'],
    linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
    win32: ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],
  }[platform()] || [];
  return process.env.CHROME_PATH || candidates.find(existsSync);
}

async function list() {
  try { return (await (await fetch(`${base}/json`)).json()).filter((t) => t.type === 'page'); }
  catch { fail(`No research browser on port ${port}. Start one: node scripts/browser.mjs start`); }
}

async function connect() {
  const tabs = await list();
  const t = tabMatch ? tabs.find((x) => x.url.includes(tabMatch) || x.title.includes(tabMatch)) : tabs[0];
  if (!t) fail(`No tab matching "${tabMatch}". Open tabs:\n${tabs.map((x) => `  ${x.title} | ${x.url}`).join('\n')}`);
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'page error');
    return r.result?.result?.value;
  };
  return { tab: t, send, evaluate, close: () => ws.close() };
}

// Page-side helpers, injected with each call: find fields by key, read and set them the way a
// person typing would (focus, the element's own value setter, input/change, blur), so
// framework-managed forms keep the values.
const PAGE = String.raw`
const labelOf = (e) => {
  const l = (e.id && document.querySelector('label[for="' + CSS.escape(e.id) + '"]')) || e.closest('label') || (e.labels && e.labels[0]);
  let t = (l?.innerText || e.getAttribute('aria-label') || '').trim();
  if (!t) { let n = e.parentElement; for (let i = 0; i < 4 && n && !t; i++, n = n.parentElement) { const h = n.querySelector('label,legend'); if (h && !h.contains(e)) t = h.innerText.trim(); } }
  return t.replace(/\s+/g, ' ').slice(0, 100);
};
const controls = () => [...document.querySelectorAll('input,textarea,select')].filter((e) => e.type !== 'hidden');
const find = (key) => {
  const all = controls(); const k = String(key).toLowerCase();
  if (key.startsWith('#')) return all.filter((e) => '#' + e.id === key);
  const byName = all.filter((e) => e.name === key);
  if (byName.length) return byName;
  return all.filter((e) => labelOf(e).toLowerCase() === k || labelOf(e).toLowerCase().replace(/\s*\*$/, '') === k);
};
const setValue = (e, v) => {
  const proto = e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : e.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  e.focus(); Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, v);
  e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); e.blur();
};
const holds = (els, v) => {
  const e = els[0];
  if (e.type === 'radio') { const on = els.find((x) => x.checked); return !!on && (on.value === String(v) || labelOf(on).toLowerCase() === String(v).toLowerCase()); }
  if (e.type === 'checkbox') return e.checked === !!v;
  return e.value === String(v);
};
`;

async function main() {
  if (cmd === 'start') {
    const chrome = chromePath();
    if (!chrome) fail('Chrome not found: set CHROME_PATH.');
    const profile = process.env.OUTREACH_BROWSER_PROFILE || join(homedir(), '.outreach-browser');
    const child = spawn(chrome, [`--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, '--no-first-run', '--no-default-browser-check', rest[0] || 'about:blank'], { detached: true, stdio: 'ignore' });
    child.unref();
    for (let i = 0; i < 20; i++) { await sleep(500); try { await fetch(`${base}/json/version`); console.error(`Research browser on port ${port}, profile ${profile}. Sign in to sites there yourself when asked.`); return out({ port, profile }); } catch {} }
    return fail('Chrome started but its debugging port did not answer.');
  }
  if (cmd === 'tabs') return out((await list()).map((t) => ({ title: t.title, url: t.url })));
  if (cmd === 'open' && !tabMatch) {
    if (!rest[0]) fail('Usage: open <url>');
    const t = await (await fetch(`${base}/json/new?${encodeURI(rest[0])}`, { method: 'PUT' })).json();
    await sleep(3000);
    return out({ opened: rest[0], id: t.id });
  }

  const b = await connect();
  try {
    if (cmd === 'open') { await b.send('Page.navigate', { url: rest[0] }); await sleep(4000); return out({ opened: rest[0] }); }
    if (cmd === 'text') return out(await b.evaluate(`document.body.innerText.slice(0, ${Number(rest[0]) || 20000})`));
    if (cmd === 'fields') {
      return out(await b.evaluate(`(() => { ${PAGE}
        document.querySelectorAll('details').forEach((d) => d.open = true);
        return controls().map((e, i) => ({ i, tag: e.tagName.toLowerCase(), type: e.type, name: e.name || undefined, id: e.id || undefined,
          label: labelOf(e) || undefined, placeholder: e.placeholder || undefined, required: e.required || undefined,
          max: e.maxLength > 0 ? e.maxLength : undefined,
          value: e.type === 'file' || e.type === 'password' ? undefined : (e.type === 'checkbox' || e.type === 'radio') ? (e.checked ? (e.type === 'radio' ? e.value : true) : false) : (e.value || '').slice(0, 120) || undefined,
          options: e.tagName === 'SELECT' ? [...e.options].map((o) => o.value + (o.text !== o.value ? ' (' + o.text + ')' : '')) : undefined,
          file: e.type === 'file' ? { accept: e.accept, multiple: e.multiple, index: [...document.querySelectorAll('input[type=file]')].indexOf(e) } : undefined }));
      })()`));
    }
    if (cmd === 'fill' || cmd === 'check') {
      if (!rest[0]) fail(`Usage: ${cmd} <values.json> --tab <match>`);
      const values = JSON.parse(readFileSync(rest[0], 'utf8'));
      return out(await b.evaluate(`(async () => { ${PAGE}
        const values = ${JSON.stringify(values)}; const report = { set: [], missing: [], mismatched: [], skipped: [] };
        for (const [key, v] of Object.entries(values)) {
          const els = find(key);
          if (!els.length) { report.missing.push(key); continue; }
          if (els[0].type === 'password' || els[0].type === 'file') { report.skipped.push(key); continue; }
          if (${cmd === 'check'}) { if (!holds(els, v)) report.mismatched.push(key); continue; }
          const e = els[0];
          if (e.type === 'radio') { const o = els.find((x) => x.value === String(v) || labelOf(x).toLowerCase() === String(v).toLowerCase()); if (!o) { report.missing.push(key + '=' + v); continue; } if (!o.checked) o.click(); }
          else if (e.type === 'checkbox') { if (e.checked !== !!v) e.click(); }
          else setValue(e, String(v));
          await new Promise((r) => setTimeout(r, 120));
          report.set.push(key);
        }
        if (${cmd === 'fill'}) { await new Promise((r) => setTimeout(r, 600)); for (const [key, v] of Object.entries(values)) { const els = find(key); if (els.length && !['password','file'].includes(els[0].type) && !holds(els, v)) report.mismatched.push(key); } }
        return report; })()`));
    }
    if (cmd === 'upload') {
      const [index, ...files] = rest;
      if (index === undefined || !files.length) fail('Usage: upload <file-input index> <file…> --tab <match>');
      await b.send('DOM.enable');
      const doc = await b.send('DOM.getDocument', { depth: -1 });
      const found = await b.send('DOM.querySelectorAll', { nodeId: doc.result.root.nodeId, selector: 'input[type=file]' });
      const nodeId = found.result.nodeIds[Number(index)];
      if (!nodeId) fail(`No file input #${index} (there are ${found.result.nodeIds.length}).`);
      const r = await b.send('DOM.setFileInputFiles', { nodeId, files: files.map((f) => resolve(f)) });
      if (r.error) fail(r.error.message);
      console.error('Files set; the page may take a while to upload them. Check with: fields, text or shot.');
      return out({ input: Number(index), files: files.length });
    }
    if (cmd === 'click') {
      const label = rest.join(' ').trim();
      if (!label) fail('Usage: click "<button text>" --tab <match>');
      if (REFUSE.test(label)) fail(`Refused: "${label}" is for the person to press.`);
      return out(await b.evaluate(`(() => {
        const want = ${JSON.stringify(label.toLowerCase())};
        const all = [...document.querySelectorAll('button, [role=button], summary, a')];
        const el = all.find((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().toLowerCase() === want)
          || all.find((e) => (e.getAttribute('aria-label') || '').trim().toLowerCase() === want);
        if (!el) return { clicked: false, reason: 'not found' };
        if (el.type === 'submit' || el.closest('form') && el.tagName === 'BUTTON' && !el.type) return { clicked: false, reason: 'a submit button: for the person to press' };
        el.click(); return { clicked: true };
      })()`));
    }
    if (cmd === 'shot') {
      if (!rest[0]) fail('Usage: shot <out.png> [--full] --tab <match>');
      const r = await b.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
      writeFileSync(rest[0], Buffer.from(r.result.data, 'base64'));
      return out({ screenshot: resolve(rest[0]) });
    }
    fail(`Unknown command "${cmd}". Run without arguments for help.`);
  } finally { b.close(); }
}

if (!cmd) { console.error(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n')); process.exit(2); }
main().catch((e) => fail(e.message));
