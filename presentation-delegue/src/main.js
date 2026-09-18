/**
 * Le chef d'orchestre : enchaînement des étapes, clavier, HUD, notes.
 *
 * Règle de base : une étape = une pression sur la flèche droite. Si une
 * animation est encore en cours au moment où l'on avance, on la termine
 * instantanément (`progress(1)`) avant de passer à la suivante — jamais d'état
 * intermédiaire figé, c'est la panne classique des présentations animées.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { Monde } from './monde.js';
import { sono } from './sono.js';
import { ETAPES } from './contenu.js';
import { creerScenes } from './scenes/index.js';
import { monterRepli } from './repli.js';
import { creerCiel } from './ciel.js';

const REDUIT = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** WebGL disponible ? Sinon on bascule sur la version 2D, jamais sur une erreur. */
function webglDispo() {
  try {
    const cv = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (cv.getContext('webgl2') || cv.getContext('webgl') || cv.getContext('experimental-webgl')));
  } catch { return false; }
}

const $ = (s) => document.querySelector(s);

// --------------------------------------------------------------- les panneaux
/** Construit un panneau DOM par étape, à partir du contenu. */
function monterPanneaux() {
  const hote = $('#panneaux');
  return ETAPES.map((etape, i) => {
    if (!etape.panneau) return null;
    const p = etape.panneau;
    const el = document.createElement('div');
    el.className = 'panneau' + (p.centre ? ' centre' : '') + (p.haut ? ' haut' : '');
    el.dataset.etape = String(i);
    el.innerHTML = [
      p.surtitre ? `<div class="surtitre${p.rouge ? ' rouge' : ''}">${p.surtitre}</div>` : '',
      p.titre ? `<h2>${p.titre}</h2>` : '',
      p.texte ? `<p>${p.texte}</p>` : '',
      p.clin ? `<div class="clin">${p.clin}</div>` : '',
    ].join('');
    hote.appendChild(el);
    return el;
  });
}

// ------------------------------------------------------------------ démarrage
async function principal() {
  const accueil = $('#accueil');

  if (!webglDispo()) {
    monterRepli(true);
    accueil.remove();
    return;
  }
  monterRepli(false);

  const monde = new Monde($('#scene'), { reduit: REDUIT });

  // Lumières communes à toutes les scènes. Réglage volontairement généreux :
  // l'image doit rester lisible une fois projetée dans une salle allumée, où
  // un vidéoprojecteur écrase systématiquement les noirs.
  monde.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  monde.scene.add(new THREE.HemisphereLight(0x9fb0ff, 0x1a1030, 0.85));
  const cle = new THREE.DirectionalLight(0xfff4e0, 1.7);
  cle.position.set(22, 34, 26);
  monde.scene.add(cle);
  const appoint = new THREE.DirectionalLight(0x7d8cff, 1.0);
  appoint.position.set(-28, -6, 14);
  monde.scene.add(appoint);
  const contre = new THREE.DirectionalLight(0xffd23f, 0.45);
  contre.position.set(0, 12, -40);
  monde.scene.add(contre);

  // Fond permanent, recentré sur la caméra à chaque image.
  const ciel = creerCiel();
  monde.scene.add(ciel.groupe);

  const panneaux = monterPanneaux();
  const scenes = creerScenes({ monde, sono, reduit: REDUIT });
  for (const s of Object.values(scenes)) {
    s.charger();
    s.groupe.visible = false;
    monde.scene.add(s.groupe);
    monde.auRendu.add(s);
  }

  let indexEtape = -1;
  let tlCourante = null;
  let sceneActive = null;
  let enTransition = false;

  const hud = {
    compteur: $('#compteur'),
    progression: $('#progression'),
    etat: $('#etat'),
    notes: $('#notes-texte'),
    suite: $('#notes-suite'),
    tampon: $('#tampon'),
  };

  function messageEtat(texte) {
    hud.etat.textContent = texte;
    hud.etat.classList.add('vu');
    clearTimeout(messageEtat._t);
    messageEtat._t = setTimeout(() => hud.etat.classList.remove('vu'), 1800);
  }

  function majHud() {
    const n = ETAPES.length;
    hud.compteur.textContent =
      `${String(indexEtape).padStart(2, '0')} / ${String(n - 1).padStart(2, '0')}`;
    hud.progression.style.width = `${(indexEtape / (n - 1)) * 100}%`;
    const e = ETAPES[indexEtape];
    hud.notes.textContent = e?.notes ?? '';
    const suivante = ETAPES[indexEtape + 1];
    hud.suite.textContent = suivante
      ? `Ensuite → ${suivante.titre ?? 'suite'}`
      : 'Dernière scène — laisser tourner pendant les applaudissements.';
    document.body.classList.toggle('hud', indexEtape >= 1);
  }

  function montrerPanneau(i) {
    panneaux.forEach((el, j) => {
      if (!el) return;
      if (j === i) {
        el.style.visibility = 'visible';
        gsap.fromTo(el, { opacity: 0, y: 34 },
          { opacity: 1, y: 0, duration: REDUIT ? 0.2 : 0.75, ease: 'power3.out', delay: REDUIT ? 0 : 0.25 });
      } else if (el.style.visibility === 'visible') {
        gsap.to(el, {
          opacity: 0, y: -18, duration: REDUIT ? 0.12 : 0.35, ease: 'power2.in',
          onComplete: () => { el.style.visibility = 'hidden'; },
        });
      }
    });
  }

  /** Le tampon plein écran, réutilisé par plusieurs scènes. */
  function tamponner(texte, { vert = false, rotation = -9 } = {}) {
    const el = hud.tampon;
    el.classList.toggle('vert', vert);
    el.querySelector('.encadre').textContent = texte;
    el.querySelector('.encadre').style.transform = `rotate(${rotation}deg)`;
    const tl = gsap.timeline();
    if (REDUIT) {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      return tl;
    }
    tl.fromTo(el, { opacity: 0, scale: 3.4, rotation: 8 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.34, ease: 'power4.in' })
      .call(() => { sono.tampon(); monde.secousse(1.15, 0.5); monde.flash(vert ? '#FFD23F' : '#EE3526', 0.22); })
      .to(el, { scale: 1.06, duration: 0.12, ease: 'power2.out' })
      .to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.45)' });
    return tl;
  }

  const outils = { tamponner, montrerPanneau, messageEtat, REDUIT };

  /** Va à l'étape `i`. `instant` saute toutes les animations. */
  function allerA(i, { instant = false, rejouer = false } = {}) {
    i = Math.max(0, Math.min(ETAPES.length - 1, i));
    if (i === indexEtape && !rejouer) return;

    // Terminer proprement ce qui tourne encore.
    if (tlCourante && tlCourante.isActive()) tlCourante.progress(1, false).kill();
    gsap.killTweensOf(hud.tampon);
    gsap.set(hud.tampon, { opacity: 0 });

    const precedente = ETAPES[indexEtape];
    const etape = ETAPES[i];
    const nouvelleScene = scenes[etape.scene];
    const changementDeScene = !precedente || precedente.scene !== etape.scene || rejouer;

    indexEtape = i;
    majHud();
    montrerPanneau(i);

    if (changementDeScene && sceneActive && sceneActive !== nouvelleScene) sceneActive.sortir?.();

    nouvelleScene.groupe.visible = true;
    const tl = gsap.timeline();

    // Le voyage de caméra, quand la scène en propose un.
    const pose = nouvelleScene.poseDe?.(etape.beat, { depuis: sceneActive?.id });
    if (pose) {
      const duree = instant || REDUIT ? 0 : (changementDeScene ? (pose.duree ?? 2.1) : (pose.duree ?? 1.1));
      if (duree > 0 && changementDeScene) sono.whoosh(Math.min(1, duree / 2));
      tl.add(monde.voyager(pose, { duree, arc: pose.arc ?? 0.16, instant: duree === 0 }), 0);
    }

    tl.add(nouvelleScene.entrer(etape.beat, {
      instant, reduit: REDUIT, changementDeScene, outils,
    }) || gsap.timeline(), pose && changementDeScene && !instant ? '-=1.15' : 0);

    // Une fois arrivé, on masque les autres scènes : rien ne consomme pour rien.
    tl.call(() => {
      for (const s of Object.values(scenes)) {
        if (s !== nouvelleScene) s.groupe.visible = false;
      }
      enTransition = false;
    });

    sceneActive = nouvelleScene;
    tlCourante = tl;
    if (instant) tl.progress(1, false);
    return tl;
  }

  // ------------------------------------------------------------------ clavier
  function suivant() {
    if (indexEtape >= ETAPES.length - 1) return;
    allerA(indexEtape + 1);
  }
  function precedent() {
    if (indexEtape <= 0) return;
    allerA(indexEtape - 1, { instant: true });
  }

  window.addEventListener('keydown', (e) => {
    if (accueil.isConnected && e.key !== 'Enter' && e.key !== ' ') return;
    const k = e.key;
    // La scène active peut intercepter (A/B/C du quiz).
    if (sceneActive?.touche?.(k, outils)) { e.preventDefault(); return; }
    switch (k) {
      case 'ArrowRight': case ' ': case 'PageDown': case 'Enter': case 'Spacebar':
        e.preventDefault();
        if (accueil.isConnected) lancer(); else suivant();
        break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace':
        e.preventDefault(); precedent(); break;
      case 'n': case 'N':
        document.body.classList.toggle('notes'); break;
      case 'm': case 'M':
        messageEtat(sono.basculerMuet() ? 'Son coupé' : 'Son rétabli'); break;
      case 'f': case 'F':
        pleinEcran(); break;
      case 'r': case 'R':
        allerA(indexEtape, { rejouer: true }); messageEtat('Scène rejouée'); break;
      case 'p': case 'P':
        messageEtat(monde.basculerPerf() ? 'Mode performance' : 'Qualité maximale'); break;
      case 'h': case 'H': case '?':
        document.body.classList.toggle('aide'); break;
      case 'Home':
        allerA(0, { instant: true }); break;
      case 'End':
        allerA(ETAPES.length - 1, { instant: true }); break;
      // Échap : on ne fait rien du tout. Le navigateur sort du plein écran,
      // la présentation, elle, continue exactement où elle en était.
      default: break;
    }
  });

  window.addEventListener('pointerdown', (e) => {
    if (accueil.isConnected) return;
    if (sceneActive?.clic?.(e, outils, monde)) return;
    if (e.button === 0) suivant();
  });

  // Le curseur ne sert à rien pendant la présentation : on le masque au repos.
  let minuteurSouris;
  window.addEventListener('pointermove', () => {
    document.body.classList.add('souris');
    clearTimeout(minuteurSouris);
    minuteurSouris = setTimeout(() => document.body.classList.remove('souris'), 2200);
  });

  function pleinEcran() {
    const d = document;
    if (!d.fullscreenElement) d.documentElement.requestFullscreen?.().catch(() => {});
    else d.exitFullscreen?.().catch(() => {});
  }

  // -------------------------------------------------------- boucle de rendu
  monde.demarrerBoucle((dt, t) => {
    ciel.groupe.position.copy(monde.pose.pos);
    ciel.etoiles.rotation.y = t * 0.004;
    for (const s of Object.values(scenes)) {
      if (s.groupe.visible) s.maj?.(dt, t);
    }
  });

  // -------------------------------------------------------- lancement du show
  async function lancer() {
    if (!accueil.isConnected) return;
    await sono.demarrer();
    // Sans `await` : si le navigateur refuse ou tarde à répondre sur le plein
    // écran, le show doit démarrer quand même. Une présentation qui ne se lance
    // pas devant la classe, c'est le pire scénario possible.
    if (!REDUIT) { try { document.documentElement.requestFullscreen?.()?.catch(() => {}); } catch { /* ignoré */ } }
    gsap.to(accueil, {
      opacity: 0, duration: 0.5, ease: 'power2.in',
      onComplete: () => { accueil.remove(); allerA(0); },
    });
  }
  $('#lancer').addEventListener('click', lancer);

  // Pour la mise au point et les captures automatisées : ?etape=3 ou #etape=3
  // (`?perf=1` force le rendu allégé, utile sur une machine sans GPU.)
  const params = new URLSearchParams(location.search);
  if (params.get('perf') === '1') monde.passerEnPerf(true);
  const demande = params.get('etape')
    ?? (location.hash.match(/etape=(\d+)/)?.[1]);
  if (demande !== null && demande !== undefined) {
    await sono.demarrer().catch(() => {});
    accueil.remove();
    allerA(parseInt(demande, 10), { instant: true });
  }

  // Utilitaire de mise au point : fige l'animation en cours et se place à un
  // instant précis. Sert aux captures de contrôle, qui doivent être
  // reproductibles au lieu de dépendre de la vitesse de la machine.
  window.__presentation = {
    allerA, monde, scenes, sono, ETAPES,
    figer: (secondes) => {
      if (!tlCourante) return null;
      tlCourante.pause();
      tlCourante.time(secondes);
      return tlCourante.duration();
    },
  };
}

// Les polices doivent être chargées avant d'échantillonner « NAEL » en points.
(async () => {
  try {
    await Promise.all([
      document.fonts.load('400 260px Anton'),
      document.fonts.load('500 40px Rubik'),
      document.fonts.load('700 40px Rubik'),
    ]);
    await document.fonts.ready;
  } catch { /* police système en secours */ }
  principal();
})();
