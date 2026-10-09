// Zero-dependency static server for e2e: directory index, 404.html with status 404.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const [dir, port] = process.argv.slice(2);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain', '.json': 'application/json' };
createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(dir, path);
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = file + '.html'; }
  try { const body = await readFile(file); res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); res.end(await readFile(join(dir, '404.html')).catch(() => 'not found')); }
}).listen(Number(port), '127.0.0.1');
