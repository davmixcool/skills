#!/usr/bin/env node
/**
 * A copy of the film for a web page: smaller, under a size cap (Cloudflare Workers and Pages
 * serve at most 25 MB a file), starting fast (faststart), and a poster to show before play.
 *
 *   node tools/web.mjs renders/film-dark.mp4 [--max-mb 24] [--out public/video/film-dark.mp4]
 *
 * Tries CRF 23, then steps up until the file fits. On the page: <video controls preload="none"
 * poster="…">, one source per theme (pick by prefers-color-scheme), served with byte ranges.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { arg } from './browser.mjs';

const input = process.argv[2];
if (!input || input.startsWith('--')) { console.error('usage: node tools/web.mjs <film.mp4> [--max-mb 24] [--out file.mp4]'); process.exit(1); }
const maxMb = Number(arg('max-mb', 24));
const out = arg('out', input.replace(/\.mp4$/, '-web.mp4'));
mkdirSync(dirname(out), { recursive: true });
for (let crf = 23; crf <= 32; crf++) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out], { encoding: 'utf8' });
  if (r.status) { process.stderr.write(r.stderr); process.exit(r.status); }
  const mb = statSync(out).size / 1e6;
  console.error(`CRF ${crf}: ${mb.toFixed(1)} MB`);
  if (mb <= maxMb) { console.log(out); process.exit(0); }
}
console.error(`Still over ${maxMb} MB at CRF 32: shorten the film or lower the resolution.`);
process.exit(1);
