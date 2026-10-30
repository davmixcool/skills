/**
 * The browser the exporters draw in: Playwright driving the installed Chrome, on the GPU.
 * Playwright's own headless Chromium often falls back to software WebGL, which is slow and
 * can drop the bloom and depth of field; a real Chrome on the GPU draws what the preview shows.
 *
 * Chrome is found at its usual macOS, Linux and Windows paths, or set CHROME_PATH. Without one,
 * Playwright's bundled Chromium is used (`npx playwright install chromium`).
 */
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

export async function launch() {
  // Playwright from the film's own node_modules (npm install), wherever this script runs from.
  const require = createRequire(join(process.cwd(), 'package.json'));
  let chromium;
  try { ({ chromium } = require('playwright')); } catch {
    console.error('Playwright not found: run npm install in the film folder.');
    process.exit(1);
  }
  const executablePath = CANDIDATES.find((p) => p && existsSync(p));
  const gpu = process.platform === 'darwin' ? ['--use-angle=metal'] : ['--use-angle=default'];
  if (!executablePath) console.error('No installed Chrome found: using Playwright’s Chromium (set CHROME_PATH to use another).');
  return chromium.launch({ executablePath, headless: true, args: ['--force-device-scale-factor=1', ...gpu, '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
}

/** A 1920×1080 tab on the film, ready to draw (window.storyReady). */
export async function openFilm(browser, url) {
  const tab = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  tab.on('pageerror', (e) => console.error('page error:', e.message));
  tab.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && console.error('console:', m.text()));
  await tab.goto(url);
  await tab.waitForFunction(() => window.storyReady && window.storyReady(), null, { timeout: 60000 });
  return tab;
}

export const CLIP = { x: 0, y: 0, width: 1920, height: 1080 };
export const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
export const flag = (name) => process.argv.includes(`--${name}`);
