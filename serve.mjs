// Petit serveur local pour développer le site.
//   node serve.mjs      puis  http://localhost:4321
//
// Pourquoi un serveur plutôt qu'un double-clic sur index.html : les scripts de
// la scène 3D sont chargés en `type="module"`, et les navigateurs refusent de
// charger un module depuis file:// (règle CORS). Aucune dépendance à installer,
// juste Node.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = import.meta.dirname;
const PORT = Number(process.env.PORT) || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.pdf': 'application/pdf',
};

createServer(async (req, res) => {
  let chemin = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  if (chemin.endsWith('/')) chemin += 'index.html';
  // pas d'extension : on tolère /contact comme /contact.html, comme Netlify
  if (!extname(chemin)) chemin += '.html';

  let relatif = normalize(chemin);
  while (relatif.startsWith('..')) relatif = relatif.slice(3);

  const fichier = join(ROOT, relatif);
  try {
    const contenu = await readFile(fichier);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(fichier).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(contenu);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 — introuvable : ' + chemin);
  }
}).listen(PORT, () => {
  console.log('Site servi sur http://localhost:' + PORT);
  console.log('Ctrl+C pour arrêter.');
});
