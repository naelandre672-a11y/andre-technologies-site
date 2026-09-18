/**
 * Scène 5 — le quiz.
 *
 * Trois réponses en volume. La classe répond à voix haute ; Nael valide avec
 * la touche A, B ou C (ou en cliquant). A et B explosent en morceaux avec un
 * buzzer, C s'illumine et le tampon « Réponse C : Nael ! » tombe dessus.
 *
 * Les éclats sont un `InstancedMesh` préparé à l'avance : au moment de
 * l'explosion, on n'alloue plus rien, donc aucun à-coup.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { P, CSS } from '../palette.js';
import { alea } from '../outils.js';
import { QUIZ } from '../contenu.js';

const CENTRE = new THREE.Vector3(0, 0, -1240);
const L = 68, H = 15;
const COLS = 14, RANGS = 4;

/** La texture d'une réponse : pastille de lettre + texte à la ligne. */
function textureReponse(cle, texte, { encre = CSS.blanc, pastille = CSS.jaune, encrePastille = CSS.encre } = {}) {
  const lg = 1400, ht = 300;
  const cv = document.createElement('canvas');
  cv.width = lg; cv.height = ht;
  const c = cv.getContext('2d');

  // Pastille de la lettre
  c.fillStyle = pastille;
  c.beginPath();
  c.roundRect(40, 74, 152, 152, 24);
  c.fill();
  c.fillStyle = encrePastille;
  c.font = '400 118px Anton, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(cle, 116, 158);

  // Texte, coupé aux mots
  c.fillStyle = encre;
  c.font = '500 64px Rubik, sans-serif';
  c.textAlign = 'left';
  const max = lg - 260;
  const mots = texte.split(' ');
  const lignes = [];
  let ligne = '';
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (c.measureText(essai).width > max && ligne) { lignes.push(ligne); ligne = mot; }
    else ligne = essai;
  }
  if (ligne) lignes.push(ligne);
  const y0 = ht / 2 - ((lignes.length - 1) * 78) / 2;
  lignes.forEach((l, i) => c.fillText(l, 232, y0 + i * 78));

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function creerQuiz({ monde, sono }) {
  const groupe = new THREE.Group();
  const rnd = alea(909);
  const cartes = [];
  let revele = false;
  let eclats, vitesses, rotations, actifsEclats = 0, animeEclats = false;
  const matriceTemp = new THREE.Matrix4();
  const posEclat = [];
  const rotEclat = [];

  function charger() {
    QUIZ.reponses.forEach((r, i) => {
      const y = 4 - i * 19;
      const g = new THREE.Group();
      g.position.set(CENTRE.x, CENTRE.y + y, CENTRE.z);

      const bonne = r.cle === QUIZ.bonne;
      const fond = new THREE.Mesh(
        new THREE.BoxGeometry(L, H, 2),
        new THREE.MeshStandardMaterial({
          color: 0x141b52, roughness: 0.38, metalness: 0.35,
          emissive: new THREE.Color(P.bleu), emissiveIntensity: 0.08,
        }),
      );
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(L - 2, H - 1),
        new THREE.MeshBasicMaterial({
          map: textureReponse(r.cle, r.texte, {
            pastille: bonne ? CSS.jaune : CSS.blanc,
            encrePastille: CSS.encre,
          }),
          transparent: true,
        }),
      );
      face.position.z = 1.05;
      const contour = new THREE.Mesh(
        new THREE.BoxGeometry(L + 1.4, H + 1.4, 1),
        new THREE.MeshBasicMaterial({ color: P.bleuClair, transparent: true, opacity: 0.22 }),
      );
      contour.position.z = -0.7;
      const lueur = new THREE.PointLight(P.jaune, 0, 90, 2);
      lueur.position.z = 14;

      g.add(contour, fond, face, lueur);
      g.userData = { fond, face, contour, lueur, cle: r.cle, bonne, index: i, phase: i * 1.3 };
      groupe.add(g);
      cartes.push(g);
    });

    // Réserve d'éclats : deux cartes × la grille.
    const n = COLS * RANGS * 2;
    eclats = new THREE.InstancedMesh(
      new THREE.BoxGeometry(L / COLS * 0.92, H / RANGS * 0.92, 2),
      new THREE.MeshStandardMaterial({ color: 0x4654c4, roughness: 0.4, metalness: 0.25,
        emissive: new THREE.Color(0x1a2bc4), emissiveIntensity: 0.4 }),
      n,
    );
    eclats.count = 0;
    eclats.frustumCulled = false;
    groupe.add(eclats);
    vitesses = new Float32Array(n * 3);
    rotations = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { posEclat.push(new THREE.Vector3()); rotEclat.push(new THREE.Euler()); }

    // Un décor minimal derrière : quelques colonnes lumineuses.
    for (let i = 0; i < 10; i++) {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 130, 1.2),
        new THREE.MeshBasicMaterial({ color: 0x2b36a0, transparent: true, opacity: 0.3 }),
      );
      b.position.set(CENTRE.x - 120 + i * 27, CENTRE.y, CENTRE.z - 70 - rnd() * 60);
      groupe.add(b);
    }
  }

  function poseDe() {
    // Cadrage centré sur le bloc des trois réponses, qui vit sous la question.
    return {
      pos: [CENTRE.x, CENTRE.y - 13, CENTRE.z + 88],
      cible: [CENTRE.x, CENTRE.y - 15, CENTRE.z],
      fov: 56, duree: 2.4, arc: 0.22,
    };
  }

  /** Fait exploser une carte : la dalle disparaît, la grille d'éclats part. */
  function exploser(carte) {
    const base = actifsEclats;
    const larg = L / COLS, haut = H / RANGS;
    for (let cx = 0; cx < COLS; cx++) {
      for (let cy = 0; cy < RANGS; cy++) {
        const k = base + cx * RANGS + cy;
        posEclat[k].set(
          carte.position.x - L / 2 + larg * (cx + 0.5),
          carte.position.y - H / 2 + haut * (cy + 0.5),
          carte.position.z,
        );
        rotEclat[k].set(0, 0, 0);
        const dx = (cx / COLS - 0.5) * 2;
        const dy = (cy / RANGS - 0.5) * 2;
        vitesses[k * 3] = dx * 26 + (rnd() - 0.5) * 12;
        vitesses[k * 3 + 1] = dy * 14 + 14 + rnd() * 10;
        vitesses[k * 3 + 2] = 8 + rnd() * 26;
        rotations[k * 3] = (rnd() - 0.5) * 9;
        rotations[k * 3 + 1] = (rnd() - 0.5) * 9;
        rotations[k * 3 + 2] = (rnd() - 0.5) * 9;
      }
    }
    actifsEclats += COLS * RANGS;
    eclats.count = actifsEclats;
    animeEclats = true;
    carte.userData.fond.visible = false;
    carte.userData.face.visible = false;
    carte.userData.contour.visible = false;
  }

  /** Le dénouement : A et B explosent, C s'illumine, le tampon tombe. */
  function reveler(outils, { instant = false } = {}) {
    if (revele) return;
    revele = true;
    const tl = gsap.timeline();
    const mauvaises = cartes.filter((c) => !c.userData.bonne);
    const bonne = cartes.find((c) => c.userData.bonne);

    if (instant) {
      mauvaises.forEach(exploser);
      bonne.userData.fond.material.emissiveIntensity = 0.5;
      bonne.userData.fond.material.emissive.set(P.jaune);
      bonne.userData.contour.material.color.set(P.jaune);
      bonne.userData.contour.material.opacity = 0.9;
      bonne.userData.lueur.intensity = 90;
      bonne.scale.setScalar(1.08);
      bonne.position.y = CENTRE.y - 4;
      const el = document.getElementById('tampon');
      el.classList.add('vert');
      el.querySelector('.encadre').textContent = QUIZ.verdict;
      gsap.set(el, { opacity: 1, scale: 1, rotation: 0 });
      return tl;
    }

    mauvaises.forEach((c, i) => {
      tl.call(() => { sono.buzzer(); sono.eclat(); exploser(c); monde.secousse(0.7, 0.4); }, null, i * 0.45);
    });

    // La bonne réponse remonte au centre, s'illumine, et prend le tampon.
    const d = mauvaises.length * 0.45 + 0.25;
    tl.call(() => sono.victoire(), null, d)
      .to(bonne.userData.fond.material, { emissiveIntensity: 0.5, duration: 0.6 }, d)
      .to(bonne.userData.fond.material.emissive, { r: 1, g: 0.82, b: 0.25, duration: 0.6 }, d)
      .to(bonne.userData.contour.material, { opacity: 0.9, duration: 0.5 }, d)
      .to(bonne.userData.lueur, { intensity: 90, duration: 0.6 }, d)
      .to(bonne.position, { y: CENTRE.y - 4, duration: 0.9, ease: 'power3.out' }, d)
      .to(bonne.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.8, ease: 'back.out(2.2)' }, d)
      .call(() => { monde.flash('#FFD23F', 0.4); }, null, d)
      .call(() => outils?.tamponner(QUIZ.verdict, { vert: true, rotation: -5 }), null, d + 0.85);
    return tl;
  }

  function reinitialiser() {
    revele = false;
    actifsEclats = 0;
    if (eclats) eclats.count = 0;
    animeEclats = false;
    cartes.forEach((c, i) => {
      c.userData.fond.visible = true;
      c.userData.face.visible = true;
      c.userData.contour.visible = true;
      c.userData.fond.material.emissiveIntensity = 0.08;
      c.userData.fond.material.emissive.set(P.bleu);
      c.userData.contour.material.color.set(P.bleuClair);
      c.userData.contour.material.opacity = 0.22;
      c.userData.lueur.intensity = 0;
      c.scale.setScalar(1);
      c.position.y = CENTRE.y + 4 - i * 19;
    });
  }

  function entrer(beat, { instant, outils, changementDeScene } = {}) {
    const tl = gsap.timeline();
    if (beat === 0) {
      reinitialiser();
      if (!instant) {
        cartes.forEach((c, i) => {
          tl.fromTo(c.position, { x: CENTRE.x - 90 }, { x: CENTRE.x, duration: 0.85, ease: 'power3.out' }, 0.45 + i * 0.14)
            .call(() => sono.pop(1 - i * 0.12), null, 0.45 + i * 0.14);
        });
      }
      return tl;
    }
    // beat 1 : le verdict (sauf s'il a déjà été déclenché par la touche C)
    tl.add(reveler(outils, { instant }));
    return tl;
  }

  /** Touches A / B / C pendant le quiz. */
  function touche(k, outils) {
    if (!groupe.visible || revele) return false;
    const key = String(k).toUpperCase();
    if (!['A', 'B', 'C'].includes(key)) return false;
    reveler(outils);
    return true;
  }

  const rayon = new THREE.Raycaster();
  const pointeur = new THREE.Vector2();
  function clic(e, outils) {
    if (!groupe.visible || revele) return false;
    pointeur.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    rayon.setFromCamera(pointeur, monde.camera);
    const touches = rayon.intersectObjects(cartes.map((c) => c.userData.fond), false);
    if (!touches.length) return false;
    reveler(outils);
    return true;
  }

  function sortir() {
    const el = document.getElementById('tampon');
    gsap.to(el, { opacity: 0, duration: 0.3 });
  }

  function maj(dt, t) {
    for (const c of cartes) {
      if (!c.userData.fond.visible) continue;
      c.userData.fond.position.z = Math.sin(t * 0.9 + c.userData.phase) * 0.7;
      c.userData.face.position.z = 1.05 + Math.sin(t * 0.9 + c.userData.phase) * 0.7;
    }
    if (!animeEclats) return;
    let encore = false;
    for (let i = 0; i < actifsEclats; i++) {
      vitesses[i * 3 + 1] -= 42 * dt;                 // gravité
      posEclat[i].x += vitesses[i * 3] * dt;
      posEclat[i].y += vitesses[i * 3 + 1] * dt;
      posEclat[i].z += vitesses[i * 3 + 2] * dt;
      rotEclat[i].x += rotations[i * 3] * dt;
      rotEclat[i].y += rotations[i * 3 + 1] * dt;
      rotEclat[i].z += rotations[i * 3 + 2] * dt;
      matriceTemp.makeRotationFromEuler(rotEclat[i]);
      matriceTemp.setPosition(posEclat[i]);
      eclats.setMatrixAt(i, matriceTemp);
      if (posEclat[i].y > CENTRE.y - 90) encore = true;
    }
    eclats.instanceMatrix.needsUpdate = true;
    animeEclats = encore;
  }

  return { id: 'quiz', groupe, charger, poseDe, entrer, sortir, maj, touche, clic };
}
