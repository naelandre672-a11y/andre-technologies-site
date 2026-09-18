/**
 * Test de bout en bout : on parcourt toutes les étapes au clavier, on
 * interrompt volontairement les animations (flèche droite pendant un vol de
 * caméra), on revient en arrière, on rejoue, puis on vérifie la console.
 */
import { chromium } from 'playwright';
const FICHIER = 'file:///home/user/andre-technologies-site/presentation-delegue/index.html';
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'],
});
const page = await (await b.newContext({ viewport: { width: 640, height: 360 } })).newPage();
const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push('pageerror: ' + e.message));
page.on('crash', () => erreurs.push('LA PAGE A PLANTÉ'));

// On démarre à l'étape 1 : la plongée de l'intro sature le rendu logiciel de
// l'environnement de test (pas le GPU d'un vrai poste), et ce n'est pas elle
// qu'on cherche à valider ici.
await page.goto(FICHIER + '?etape=1&perf=1');
await page.waitForFunction(() => !!window.__presentation, null, { timeout: 30000 });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
await pause(1200);

const etat = async () => page.evaluate(() => ({
  etape: document.getElementById('compteur').textContent,
  largeur: document.getElementById('progression').style.width,
  hud: document.body.classList.contains('hud'),
}));

// Enchaînement rapide : on n'attend PAS la fin des animations, exprès.
for (let i = 0; i < 9; i++) {
  await page.keyboard.press('ArrowRight');
  await pause(350);
}
console.log('après enchaînement rapide :', JSON.stringify(await etat()));

// Retours en arrière, télécommande (PageUp/PageDown), rejeu, bascules.
await page.keyboard.press('ArrowLeft');
await page.keyboard.press('ArrowLeft');
await pause(500);
console.log('après deux retours :', JSON.stringify(await etat()));
await page.keyboard.press('PageDown');
await pause(400);
await page.keyboard.press('PageUp');
await pause(400);
console.log('après télécommande :', JSON.stringify(await etat()));

for (const t of ['n', 'm', 'r', 'p', 'Escape', 'h']) { await page.keyboard.press(t); await pause(250); }
console.log('touches N/M/R/P/Échap/H :', JSON.stringify(await page.evaluate(() => ({
  notes: document.body.classList.contains('notes'),
  aide: document.body.classList.contains('aide'),
  muet: window.__presentation.sono.muet,
  perf: window.__presentation.monde.modePerf,
}))));

// Le quiz : on vérifie que la touche C déclenche bien le verdict.
await page.evaluate(() => window.__presentation.allerA(8));
await pause(2500);
await page.keyboard.press('c');
await pause(4000);
console.log('quiz après touche C, tampon visible :', await page.evaluate(() =>
  parseFloat(getComputedStyle(document.getElementById('tampon')).opacity) > 0.5));

// Fin de course : la flèche droite ne doit pas sortir de la présentation.
await page.evaluate(() => window.__presentation.allerA(10));
await pause(2000);
await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowRight');
await pause(600);
console.log('fin de course :', JSON.stringify(await etat()));
console.log('fps final :', await page.evaluate(() => Math.round(window.__presentation.monde.fps)));

console.log(erreurs.length ? 'ERREURS :\n' + erreurs.join('\n') : '✓ console : aucune erreur');
await b.close();
