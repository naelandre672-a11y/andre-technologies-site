/**
 * Version 2D de secours.
 *
 * Si WebGL manque (vieux pilote, GPU désactivé sur le poste du lycée), on ne
 * montre pas un écran d’erreur : on montre la même présentation, en plat, avec
 * la même navigation au clavier. Le contenu reste intégralement lisible.
 */
import { ETAPES, CARTES, PARCOURS, QUIZ, SLOGAN } from './contenu.js';

export function monterRepli(actif) {
  const hote = document.getElementById('repli');
  if (!hote) return;

  const diapos = [];

  diapos.push(`
    <section class="slide">
      <div class="num">Élection des délégués — Terminale 4</div>
      <h1>NAEL</h1>
      <h2 style="color:var(--jaune);margin-top:.6rem">${SLOGAN}</h2>
      <p>Un délégué qui parle pour vous, pas à votre place.</p>
    </section>`);

  for (const e of ETAPES) {
    if (!e.panneau) continue;
    const p = e.panneau;
    diapos.push(`
      <section class="slide">
        ${p.surtitre ? `<div class="num">${p.surtitre}</div>` : ''}
        ${p.titre ? `<h2>${p.titre}</h2>` : ''}
        ${p.texte ? `<p>${p.texte}</p>` : ''}
        ${p.clin ? `<p class="clin">${p.clin}</p>` : ''}
      </section>`);
  }

  diapos.push(`
    <section class="slide">
      <div class="num">Parcoursup — les 4 étapes</div>
      <h2>Personne à la traîne</h2>
      <p>${PARCOURS.map((s) => `${s.num} ${s.titre}`).join(' · ')}</p>
    </section>`);

  diapos.push(`
    <section class="slide">
      <div class="num">Le quiz</div>
      <h2>${QUIZ.question}</h2>
      ${QUIZ.reponses.map((r) => `<p><strong style="color:${r.cle === QUIZ.bonne ? 'var(--jaune)' : 'inherit'}">${r.cle}.</strong> ${r.texte}</p>`).join('')}
      <p class="clin">${QUIZ.verdict}</p>
    </section>`);

  diapos.push(`
    <section class="slide" style="border:0">
      <div class="num">Au vote</div>
      <h1>NAEL<br><em>${SLOGAN}</em></h1>
      <p>Merci !</p>
    </section>`);

  hote.innerHTML = diapos.join('');

  if (!actif) return;
  hote.classList.add('actif');
  document.body.classList.add('souris');
  document.getElementById('compte')?.remove();

  // Même navigation qu’en 3D : flèches, espace, télécommande.
  const sections = [...hote.querySelectorAll('.slide')];
  let i = 0;
  const aller = (n) => {
    i = Math.max(0, Math.min(sections.length - 1, n));
    sections[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  window.addEventListener('keydown', (e) => {
    if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); aller(i + 1); }
    if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); aller(i - 1); }
    if (e.key === 'f' || e.key === 'F') document.documentElement.requestFullscreen?.().catch(() => {});
  });
  hote.addEventListener('click', () => aller(i + 1));
}
