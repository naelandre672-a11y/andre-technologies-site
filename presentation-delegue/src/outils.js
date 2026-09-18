/** Petites fonctions partagées par toutes les scènes. */
import * as THREE from 'three';

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Générateur pseudo-aléatoire déterministe : la présentation est identique à
 *  chaque répétition, ce qui compte quand on répète son texte dessus. */
export function alea(graine = 1) {
  let s = graine >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Convertit un texte en nuage de points, en le dessinant dans un canvas 2D puis
 * en relevant les pixels opaques.
 *
 * C'est ce qui permet d'avoir « NAEL » en vraies lettres 3D sans embarquer de
 * police au format typeface.json : on réutilise la police web déjà inlinée.
 * Renvoie des coordonnées centrées sur l'origine, en unités de scène.
 */
export function pointsDeTexte(texte, {
  police = '400 220px Anton, sans-serif',
  pas = 4,           // un point tous les N pixels
  hauteur = 20,      // hauteur visée de la capitale, en unités de scène
  interlettre = 0,
} = {}) {
  const mesure = document.createElement('canvas').getContext('2d');
  mesure.font = police;
  if (interlettre) mesure.letterSpacing = `${interlettre}px`;
  const m = mesure.measureText(texte);
  const largeurTexte = Math.ceil(m.width) + 40;
  const monte = Math.ceil(m.actualBoundingBoxAscent || 200);
  const descend = Math.ceil(m.actualBoundingBoxDescent || 40);
  const hauteurTexte = monte + descend + 40;

  const cv = document.createElement('canvas');
  cv.width = largeurTexte;
  cv.height = hauteurTexte;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.font = police;
  if (interlettre) ctx.letterSpacing = `${interlettre}px`;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(texte, 20, monte + 20);

  const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const pts = [];
  for (let y = 0; y < cv.height; y += pas) {
    for (let x = 0; x < cv.width; x += pas) {
      if (data[(y * cv.width + x) * 4 + 3] > 128) pts.push(x, y);
    }
  }

  // Mise à l'échelle : la hauteur de capitale devient `hauteur` unités.
  const echelle = hauteur / monte;
  const cx = cv.width / 2;
  const cy = monte / 2 + 20;
  const out = new Float32Array(pts.length / 2 * 3);
  for (let i = 0, j = 0; i < pts.length; i += 2, j += 3) {
    out[j] = (pts[i] - cx) * echelle;
    out[j + 1] = -(pts[i + 1] - cy) * echelle;
    out[j + 2] = 0;
  }
  return { positions: out, nombre: out.length / 3, largeur: cv.width * echelle };
}

/**
 * Fabrique une texture à partir d'un texte : sert pour les panneaux du couloir
 * et les étiquettes posées dans la scène (net, léger, et lisible de loin).
 */
export function textureTexte(lignes, {
  largeur = 1024, hauteur = 512, fond = 'transparent',
  couleur = '#FFFBF2', police = '400 150px Anton, sans-serif',
  aligne = 'center', interligne = 1.05, majuscules = true,
} = {}) {
  const cv = document.createElement('canvas');
  cv.width = largeur; cv.height = hauteur;
  const ctx = cv.getContext('2d');
  if (fond !== 'transparent') { ctx.fillStyle = fond; ctx.fillRect(0, 0, largeur, hauteur); }
  ctx.fillStyle = couleur;
  ctx.textAlign = aligne;
  ctx.textBaseline = 'middle';
  const tab = Array.isArray(lignes) ? lignes : [lignes];
  let tailleApprox = parseInt(police.match(/(\d+)px/)?.[1] || '150', 10);

  // Réduction automatique : un libellé trop long (« SOIGNER SON DOSSIER »)
  // sortait du canvas et se retrouvait tronqué en plein écran.
  const marge = largeur * 0.92;
  for (let essai = 0; essai < 12; essai++) {
    ctx.font = police.replace(/\d+px/, `${tailleApprox}px`);
    const large = Math.max(...tab.map((l) => ctx.measureText(majuscules ? l.toUpperCase() : l).width));
    if (large <= marge || tailleApprox <= 24) break;
    tailleApprox = Math.floor(tailleApprox * Math.min(0.94, marge / large));
  }
  ctx.font = police.replace(/\d+px/, `${tailleApprox}px`);
  const h = tailleApprox * interligne;
  const y0 = hauteur / 2 - ((tab.length - 1) * h) / 2;
  const x = aligne === 'center' ? largeur / 2 : aligne === 'right' ? largeur - 40 : 40;
  tab.forEach((l, i) => ctx.fillText(majuscules ? l.toUpperCase() : l, x, y0 + i * h));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Dispose proprement un objet et toute sa descendance. */
export function jeter(objet) {
  objet.traverse?.((o) => {
    o.geometry?.dispose?.();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) { m.map?.dispose?.(); m.dispose?.(); }
  });
}
