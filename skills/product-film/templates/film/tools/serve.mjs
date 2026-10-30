#!/usr/bin/env node
/**
 * Serves the film's folder over HTTP: Chrome loads ES modules (three.js) only from a server,
 * never from file://. Byte ranges, so the preview can seek in the soundtrack.
 *
 *   node tools/serve.mjs [--port 8794]      then open http://localhost:8794/  (?theme=light, ?t=6)
 *
 * Also imported by the exporters, which start one on a free port.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4',
};

export function serve(port = 0, root = ROOT) {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    const file = path.endsWith('/') ? `${path}index.html` : path;
    try {
      const body = await readFile(join(root, file));
      // the type comes from the file served, not the URL (`/` must open as a page, not download)
      const head = { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store', 'accept-ranges': 'bytes' };
      const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
      if (range) {
        const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Number(range[2]) : body.length - 1;
        res.writeHead(206, { ...head, 'content-range': `bytes ${start}-${end}/${body.length}`, 'content-length': end - start + 1 });
        return res.end(body.subarray(start, end + 1));
      }
      res.writeHead(200, { ...head, 'content-length': body.length });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--port');
  const port = i > 0 ? Number(process.argv[i + 1]) : 8794;
  try {
    const server = await serve(port);
    console.log(`http://localhost:${server.address().port}/`);
  } catch (e) {
    if (e.code !== 'EADDRINUSE') throw e;
    console.log(`Something is already serving port ${port}: probably the film. Open http://localhost:${port}/ (or pass --port for another).`);
  }
}
