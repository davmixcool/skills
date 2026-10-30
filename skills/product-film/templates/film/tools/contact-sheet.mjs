#!/usr/bin/env node
/**
 * One image of the whole film: a frame every few seconds, in a grid, to review the cut at a
 * glance (read left to right, top to bottom). Look at it before showing anyone the film.
 *
 *   node tools/contact-sheet.mjs renders/film-dark.mp4 [--every 2] [--cols 6] [--out renders/contact-dark.jpg]
 */
import { spawnSync } from 'node:child_process';
import { arg } from './browser.mjs';

const video = process.argv[2];
if (!video || video.startsWith('--')) { console.error('usage: node tools/contact-sheet.mjs <video.mp4> [--every 2] [--cols 6]'); process.exit(1); }
const every = Number(arg('every', 2)), cols = Number(arg('cols', 6));
const out = arg('out', video.replace(/\.mp4$/, '-contact.jpg'));
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], { encoding: 'utf8' });
const rows = Math.ceil(Number(probe.stdout) / every / cols);
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', `fps=1/${every},scale=480:-1,tile=${cols}x${rows}:padding=6:color=0x222222`, '-frames:v', '1', '-q:v', '3', out], { encoding: 'utf8' });
if (r.status) { process.stderr.write(r.stderr); process.exit(r.status); }
console.log(out);
