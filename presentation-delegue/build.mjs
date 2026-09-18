/**
 * Fabrique le livrable : un unique `index.html` autonome.
 *
 * Contrainte du projet : la présentation doit s'ouvrir par un double-clic sur un
 * PC de lycée, sans serveur et sans Internet. Tout est donc inliné — le code
 * (three.js + GSAP compris), la feuille de style et les deux polices en base64.
 * Aucun son n'est embarqué : ils sont tous synthétisés en Web Audio à l'exécution.
 */
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ici = dirname(fileURLToPath(import.meta.url));
const src = (...p) => join(ici, 'src', ...p);

/** Les polices, encodées en data-URI woff2. */
const POLICES = {
  'ANTON_400': 'node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2',
  'RUBIK_400': 'node_modules/@fontsource/rubik/files/rubik-latin-400-normal.woff2',
  'RUBIK_500': 'node_modules/@fontsource/rubik/files/rubik-latin-500-normal.woff2',
  'RUBIK_700': 'node_modules/@fontsource/rubik/files/rubik-latin-700-normal.woff2',
};

async function polices(css) {
  for (const [jeton, chemin] of Object.entries(POLICES)) {
    const b64 = (await readFile(join(ici, chemin))).toString('base64');
    css = css.replaceAll(`__${jeton}__`, `data:font/woff2;base64,${b64}`);
  }
  return css;
}

const resultat = await build({
  entryPoints: [src('main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  legalComments: 'none',
  write: false,
  logLevel: 'info',
});

const js = resultat.outputFiles[0].text;
const css = await polices(await readFile(src('style.css'), 'utf8'));
const gabarit = await readFile(src('index.html'), 'utf8');

const html = gabarit
  .replace('/*__CSS__*/', () => css)
  .replace('/*__JS__*/', () => js);

const sortie = join(ici, 'index.html');
await writeFile(sortie, html, 'utf8');

const ko = (n) => (n / 1024).toFixed(0) + ' Ko';
console.log(`\n  ${sortie}`);
console.log(`  JS ${ko(js.length)} · CSS+polices ${ko(css.length)} · total ${ko(html.length)}\n`);
