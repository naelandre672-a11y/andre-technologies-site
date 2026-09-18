/** Captures figées de l'intro : la timeline est mise en pause puis parcourue. */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const ici = dirname(fileURLToPath(import.meta.url));
const fichier = 'file://' + join(ici, '..', 'index.html');
const dossier = join(ici, 'img');
await mkdir(dossier, { recursive: true });

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'],
});
const page = await (await b.newContext({ viewport: { width: 640, height: 360 } })).newPage();
const journal = [];
page.on('console', (m) => { if (m.type() === 'error') journal.push(`[error] ${m.text()}`); });
page.on('pageerror', (e) => journal.push(`[pageerror] ${e.message}`));

await page.goto(fichier + '?etape=0&perf=1');
await page.waitForFunction(() => !!window.__presentation, null, { timeout: 30000 });

for (const t of process.argv.slice(2).map(Number)) {
  await page.evaluate((s) => {
    const p = window.__presentation;
    if (!p._rejoue) { p.allerA(0, { rejouer: true }); p._rejoue = true; }
    p.figer(s);
  }, t);
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: join(dossier, `intro-t${String(t).replace('.', '_')}.jpg`),
    type: 'jpeg', quality: 74, timeout: 120000 });
  console.log('t =', t, 'ok');
}
console.log(journal.length ? journal.join('\n') : 'console : rien');
await b.close();
