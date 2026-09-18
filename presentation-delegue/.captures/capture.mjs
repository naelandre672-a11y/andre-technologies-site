/**
 * Captures de contrôle : ouvre le livrable en file:// et photographie chaque
 * étape. En environnement sans GPU on force le mode performance, sinon le
 * rendu logiciel met une minute par image.
 *
 *   node .captures/capture.mjs intro|etapes [largeur] [hauteur] [perf 0|1] [etapes,a,b]
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const ici = dirname(fileURLToPath(import.meta.url));
const fichier = 'file://' + join(ici, '..', 'index.html');
const dossier = join(ici, 'img');
await mkdir(dossier, { recursive: true });

const mode = process.argv[2] || 'etapes';
const largeur = parseInt(process.argv[3] || '1280', 10);
const hauteur = parseInt(process.argv[4] || '720', 10);
const perf = (process.argv[5] ?? '1') === '1' ? '&perf=1' : '';
const seules = process.argv[6] ? process.argv[6].split(',').map(Number) : null;

const navigateur = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur } });
const page = await ctx.newPage();
const journal = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') journal.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => journal.push(`[pageerror] ${e.message}`));

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const photo = (nom) => page.screenshot({ path: join(dossier, nom + '.jpg'), type: 'jpeg', quality: 76, timeout: 180000 });

if (mode === 'intro') {
  await page.goto(fichier + (perf ? '?perf=1' : ''));
  await pause(1500);
  await photo('intro-00-accueil');
  await page.click('#lancer');
  const jalons = [600, 1500, 2400, 3400, 4400, 5400, 6200, 6900, 7600, 8600, 10500];
  let precedent = 0;
  for (const t of jalons) {
    await pause(Math.max(0, t - precedent)); precedent = t;
    await photo(`intro-${String(t).padStart(5, '0')}ms`);
  }
} else {
  const n = parseInt(process.env.ETAPES || '11', 10);
  for (let i = 0; i < n; i++) {
    if (seules && !seules.includes(i)) continue;
    await page.goto(`${fichier}?etape=${i}${perf}`);
    await pause(i === 0 ? 2200 : 3600);
    await photo(`etape-${String(i).padStart(2, '0')}`);
  }
}

console.log(journal.length ? '--- console ---\n' + journal.join('\n') : '--- console : rien ---');
await navigateur.close();
