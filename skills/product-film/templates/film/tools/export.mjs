#!/usr/bin/env node
/**
 * Renders the film to an MP4: every frame from window.renderFrame(t), screenshotted in Chrome on
 * the GPU and piped to ffmpeg, with the soundtrack muxed in.
 *
 *   node tools/export.mjs [--theme dark|light] [--fps 30] [--out renders/film-dark.mp4]
 *                         [--audio assets/soundtrack.m4a] [--poster 6.4] [--crf 20]
 *   node tools/export.mjs --theme light --stills 4,12.5,27 [--clean]     single PNG frames to frames/
 *
 * Audio: --audio, else assets/soundtrack.m4a if it exists, else the page's code score
 * (window.scoreWav, src/score.js), loudness-evened to -15 LUFS.
 *
 * Size: CRF 20 capped at 10 Mb/s: about 1 MB a second of film. There is no grain in the
 * look on purpose; grain (or noise of any kind) makes x264 spend its bits on it.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { serve } from './serve.mjs';
import { launch, openFilm, CLIP, arg, flag } from './browser.mjs';

const fps = Number(arg('fps', 30));
const theme = arg('theme', 'dark');
const out = resolve(arg('out', `renders/film-${theme}.mp4`));
const crf = arg('crf', '20');
const posterAt = arg('poster', null);
const stills = arg('stills', null);

const server = await serve(0);
const browser = await launch();
try {
  const query = `export&theme=${theme}${flag('clean') ? '&clean' : ''}`;
  const tab = await openFilm(browser, `http://127.0.0.1:${server.address().port}/index.html?${query}`);
  if (stills) {
    mkdirSync('frames', { recursive: true });
    for (const t of stills.split(',').map(Number)) {
      await tab.evaluate((t) => window.renderFrame(t), t);
      const file = `frames/${theme}${flag('clean') ? '-clean' : ''}-t${t.toFixed(2)}.png`;
      await tab.screenshot({ path: file, clip: CLIP });
      console.log(file);
    }
  } else {
    mkdirSync(dirname(out), { recursive: true });
    let audio = arg('audio', existsSync('assets/soundtrack.m4a') ? 'assets/soundtrack.m4a' : null);
    let audioArgs = ['-c:a', 'copy'];
    if (!audio) {
      audio = resolve(dirname(out), 'score.wav');
      writeFileSync(audio, Buffer.from(await tab.evaluate(() => window.scoreWav()), 'base64'));
      audioArgs = ['-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000'];
      console.error(`audio: the code score (${audio})`);
    } else console.error(`audio: ${audio}`);
    const duration = await tab.evaluate(() => window.FILM.DURATION);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-i', audio,
      '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', crf, '-maxrate', '10M', '-bufsize', '20M',
      ...audioArgs, '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const frames = Math.round(duration * fps);
    const started = Date.now();
    for (let f = 0; f < frames; f++) {
      await tab.evaluate((t) => window.renderFrame(t), f / fps);
      const jpg = await tab.screenshot({ type: 'jpeg', quality: 95, clip: CLIP });
      if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % (fps * 5) === 0) process.stderr.write(`\r${(f / fps).toFixed(0)}s / ${duration}s  (${((Date.now() - started) / 1000).toFixed(0)}s elapsed)`);
    }
    ff.stdin.end();
    const code = await new Promise((r) => ff.on('exit', r));
    process.stderr.write('\n');
    if (code) throw new Error(`ffmpeg exited ${code}`);
    if (posterAt !== null) {
      await tab.evaluate((t) => window.renderFrame(t), Number(posterAt));
      const poster = out.replace(/\.mp4$/, '-poster.jpg');
      await tab.screenshot({ path: poster, type: 'jpeg', quality: 88, clip: CLIP });
      console.log(poster);
    }
    console.log(out);
  }
} finally {
  await browser.close();
  server.close();
}
