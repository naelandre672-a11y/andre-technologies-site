/**
 * Scène 6 — le final.
 *
 * Un bulletin de vote géant tombe en tournoyant, la coche rouge se dessine en
 * face de NAEL, « Quelqu'un au hasard » se fait barrer, puis confettis, feux
 * d'artifice et fanfare. La scène tourne ensuite en boucle légère : c'est
 * l'image qui reste à l'écran pendant les applaudissements.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { P, CSS } from '../palette.js';
import { alea } from '../outils.js';
import { SLOGAN } from '../contenu.js';

const CENTRE = new THREE.Vector3(0, 0, -1520);
const LB = 48, HB = 62;          // dimensions du bulletin

/** Le bulletin, dessiné dans un canvas. */
function textureBulletin() {
  const lg = 800, ht = 1030;
  const cv = document.createElement('canvas');
  cv.width = lg; cv.height = ht;
  const c = cv.getContext('2d');

  c.fillStyle = CSS.blanc;
  c.fillRect(0, 0, lg, ht);
  c.strokeStyle = CSS.encre;
  c.lineWidth = 8;
  c.strokeRect(22, 22, lg - 44, ht - 44);

  c.fillStyle = CSS.encre;
  c.textAlign = 'center';
  c.font = '400 76px Anton, sans-serif';
  c.fillText('BULLETIN DE VOTE', lg / 2, 140);
  c.font = '500 34px Rubik, sans-serif';
  c.fillStyle = 'rgba(13,16,48,.6)';
  c.fillText('Délégué·e — Terminale 4', lg / 2, 196);

  c.beginPath(); c.moveTo(70, 240); c.lineTo(lg - 70, 240);
  c.strokeStyle = 'rgba(13,16,48,.25)'; c.lineWidth = 4; c.stroke();

  // Ligne 1 — NAEL
  c.strokeStyle = CSS.encre; c.lineWidth = 7;
  c.strokeRect(86, 330, 86, 86);
  c.textAlign = 'left';
  c.fillStyle = CSS.encre;
  c.font = '400 92px Anton, sans-serif';
  c.fillText('NAEL', 206, 404);
  c.font = '500 34px Rubik, sans-serif';
  c.fillStyle = 'rgba(13,16,48,.66)';
  c.fillText(SLOGAN, 208, 452);

  // Ligne 2 — l'autre option
  c.strokeStyle = 'rgba(13,16,48,.55)'; c.lineWidth = 7;
  c.strokeRect(86, 620, 86, 86);
  c.fillStyle = 'rgba(13,16,48,.62)';
  c.font = '400 66px Anton, sans-serif';
  c.fillText('QUELQU’UN AU HASARD', 206, 686);

  c.textAlign = 'center';
  c.font = '500 28px Rubik, sans-serif';
  c.fillStyle = 'rgba(13,16,48,.42)';
  c.fillText('Une seule case à cocher.', lg / 2, ht - 92);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function creerFinal({ monde, sono }) {
  const groupe = new THREE.Group();
  const rnd = alea(2027);
  let bulletin, coche1, coche2, barre, confettis, feux;
  const NB_CONF = 700;
  let confPos, confVit, confRot, confVitRot, confActif = false;
  const NB_FEU = 700;
  let feuPos, feuVit, feuVie, feuActif = false;
  const mTemp = new THREE.Matrix4();
  const eTemp = new THREE.Euler();
  const vTemp = new THREE.Vector3();

  function charger() {
    // --- sol + halo, pour asseoir la scène
    const sol = new THREE.Mesh(
      new THREE.CircleGeometry(160, 56),
      new THREE.MeshStandardMaterial({ color: 0x0a0e30, roughness: 0.3, metalness: 0.55 }),
    );
    sol.rotation.x = -Math.PI / 2;
    sol.position.copy(CENTRE).setY(CENTRE.y - 44);
    groupe.add(sol);

    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(78, 48),
      new THREE.MeshBasicMaterial({ color: P.bleuClair, transparent: true, opacity: 0.16,
        blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.copy(CENTRE).setY(CENTRE.y - 43.5);
    groupe.add(halo);

    // --- le bulletin
    bulletin = new THREE.Group();
    const papier = new THREE.Mesh(
      new THREE.BoxGeometry(LB, HB, 0.7),
      new THREE.MeshStandardMaterial({ color: P.blanc, roughness: 0.62, metalness: 0.02 }),
    );
    const impression = new THREE.Mesh(
      new THREE.PlaneGeometry(LB, HB),
      new THREE.MeshBasicMaterial({ map: textureBulletin(), transparent: true }),
    );
    impression.position.z = 0.38;
    bulletin.add(papier, impression);

    // Conversion des repères du canvas (800 × 1030) vers le plan du bulletin :
    // c'est la seule façon fiable de poser la coche exactement dans sa case.
    const X = (px) => (px / 800 - 0.5) * LB;
    const Y = (py) => (0.5 - py / 1030) * HB;

    // La coche rouge : deux barres qui se dessinent l'une après l'autre,
    // débordant volontairement de la case, comme une vraie coche à la main.
    const matRouge = new THREE.MeshBasicMaterial({ color: P.rouge });
    coche1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.6, 0.6), matRouge);
    coche1.position.set(X(112), Y(392), 0.8);
    coche1.rotation.z = 0.72;
    coche2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 9.4, 0.6), matRouge);
    coche2.position.set(X(150), Y(352), 0.8);
    coche2.rotation.z = -0.52;
    coche1.scale.y = 0; coche2.scale.y = 0;
    bulletin.add(coche1, coche2);

    // La rature sur l'autre option, à hauteur de la ligne de texte.
    barre = new THREE.Mesh(new THREE.BoxGeometry(36, 1.3, 0.6), matRouge);
    barre.position.set(X(510), Y(668), 0.8);
    barre.rotation.z = -0.025;
    barre.scale.x = 0;
    bulletin.add(barre);

    bulletin.position.copy(CENTRE);
    groupe.add(bulletin);

    // --- confettis
    confettis = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1.5, 2.4, 0.18),
      new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.15, side: THREE.DoubleSide }),
      NB_CONF,
    );
    confettis.frustumCulled = false;
    confettis.count = 0;
    const c = new THREE.Color();
    const teintes = [P.jaune, P.rouge, P.bleuClair, P.blanc];
    for (let i = 0; i < NB_CONF; i++) {
      c.set(teintes[(rnd() * teintes.length) | 0]);
      confettis.setColorAt(i, c);
    }
    confettis.instanceColor.needsUpdate = true;
    groupe.add(confettis);
    confPos = new Float32Array(NB_CONF * 3);
    confVit = new Float32Array(NB_CONF * 3);
    confRot = new Float32Array(NB_CONF * 3);
    confVitRot = new Float32Array(NB_CONF * 3);

    // --- feux d'artifice : un nuage de points relancé en boucle
    const gFeu = new THREE.BufferGeometry();
    feuPos = new Float32Array(NB_FEU * 3);
    feuVit = new Float32Array(NB_FEU * 3);
    feuVie = new Float32Array(NB_FEU);
    const couleursFeu = new Float32Array(NB_FEU * 3);
    gFeu.setAttribute('position', new THREE.BufferAttribute(feuPos, 3));
    gFeu.setAttribute('color', new THREE.BufferAttribute(couleursFeu, 3));
    gFeu.setAttribute('aVie', new THREE.BufferAttribute(feuVie, 1));
    gFeu.boundingSphere = new THREE.Sphere(CENTRE.clone(), 400);
    feux = new THREE.Points(gFeu, new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float aVie; varying vec3 vC; varying float vV;
        void main(){ vC = color; vV = aVie;
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_PointSize = min(aVie * 5.0 * (300.0 / -mv.z), 14.0);
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `
        varying vec3 vC; varying float vV;
        void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
          gl_FragColor = vec4(vC, smoothstep(0.5, 0.0, d) * clamp(vV, 0.0, 1.0)); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true,
    }));
    feux.frustumCulled = false;
    groupe.add(feux);
  }

  /** Relance les deux canons de confettis. */
  function tirerConfettis() {
    confettis.count = NB_CONF;
    confActif = true;
    for (let i = 0; i < NB_CONF; i++) {
      const gauche = i % 2 === 0;
      const x = CENTRE.x + (gauche ? -76 : 76);
      confPos[i * 3] = x + (rnd() - 0.5) * 8;
      confPos[i * 3 + 1] = CENTRE.y - 34 + (rnd() - 0.5) * 8;
      confPos[i * 3 + 2] = CENTRE.z + 30 + (rnd() - 0.5) * 24;
      const force = 52 + rnd() * 46;
      confVit[i * 3] = (gauche ? 1 : -1) * force * (0.5 + rnd() * 0.5);
      confVit[i * 3 + 1] = force * (0.85 + rnd() * 0.6);
      confVit[i * 3 + 2] = (rnd() - 0.5) * 34;
      for (let k = 0; k < 3; k++) {
        confRot[i * 3 + k] = rnd() * 6.3;
        confVitRot[i * 3 + k] = (rnd() - 0.5) * 9;
      }
    }
  }

  /** Une gerbe de feu d'artifice à un endroit donné. */
  function tirerFeu(centre) {
    feuActif = true;
    const couleurs = feux.geometry.attributes.color.array;
    const teintes = [new THREE.Color(P.jaune), new THREE.Color(P.rouge), new THREE.Color(P.blanc), new THREE.Color(P.bleuClair)];
    const t = teintes[(rnd() * teintes.length) | 0];
    for (let i = 0; i < NB_FEU; i++) {
      const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), v = 22 + rnd() * 34;
      feuPos[i * 3] = centre.x; feuPos[i * 3 + 1] = centre.y; feuPos[i * 3 + 2] = centre.z;
      feuVit[i * 3] = Math.sin(ph) * Math.cos(th) * v;
      feuVit[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * v;
      feuVit[i * 3 + 2] = Math.cos(ph) * v;
      feuVie[i] = 1 + rnd() * 0.5;
      const c = t.clone().multiplyScalar(0.7 + rnd() * 0.6);
      couleurs[i * 3] = c.r; couleurs[i * 3 + 1] = c.g; couleurs[i * 3 + 2] = c.b;
    }
    feux.geometry.attributes.color.needsUpdate = true;
  }

  function poseDe() {
    return { pos: [CENTRE.x, CENTRE.y + 5, CENTRE.z + 96], cible: [CENTRE.x, CENTRE.y + 2, CENTRE.z], fov: 58, duree: 2.6, arc: 0.24 };
  }

  let boucleFeux = null;

  function entrer(beat, { instant, reduit } = {}) {
    const tl = gsap.timeline();
    clearInterval(boucleFeux);
    document.body.classList.add('final');

    const finalise = () => {
      bulletin.position.copy(CENTRE);
      bulletin.rotation.set(-0.06, 0, 0.04);
      coche1.scale.y = 1; coche2.scale.y = 1; barre.scale.x = 1;
      document.body.classList.add('slogan-visible');
    };

    if (instant || reduit) {
      finalise();
      tirerConfettis();
      return tl;
    }

    // Départ : le bulletin est très haut, de dos, et tourne.
    bulletin.position.set(CENTRE.x, CENTRE.y + 230, CENTRE.z - 40);
    bulletin.rotation.set(1.5, 0.9, 2.6);
    coche1.scale.y = 0; coche2.scale.y = 0; barre.scale.x = 0;
    document.body.classList.remove('slogan-visible');

    tl.call(() => sono.whoosh(1.2), null, 0.2)
      .to(bulletin.position, { y: CENTRE.y, z: CENTRE.z, duration: 1.6, ease: 'power3.in' }, 0.3)
      .to(bulletin.rotation, { x: -0.06, y: 0, z: 0.04, duration: 1.75, ease: 'power2.out' }, 0.3)
      .call(() => { sono.impact(); monde.secousse(1.3, 0.6); monde.flash('#FFFBF2', 0.3); }, null, 1.9)
      .to(bulletin.position, { y: CENTRE.y + 3, duration: 0.5, ease: 'power2.out' }, 1.9)
      .to(bulletin.position, { y: CENTRE.y, duration: 1.4, ease: 'elastic.out(1,0.5)' }, 2.4);

    // La coche se dessine en deux traits.
    tl.to(coche1.scale, { y: 1, duration: 0.16, ease: 'power2.in' }, 2.5)
      .call(() => sono.clic(), null, 2.5)
      .to(coche2.scale, { y: 1, duration: 0.26, ease: 'power2.out' }, 2.64)
      .call(() => sono.pop(1.4), null, 2.64);

    // Puis la rature.
    tl.to(barre.scale, { x: 1, duration: 0.3, ease: 'power3.out' }, 3.1)
      .call(() => sono.eclat(), null, 3.1);

    // Et la fête.
    tl.call(() => {
      sono.fanfare();
      sono.confettis();
      sono.nappe(true, 0.12);
      tirerConfettis();
      tirerFeu(new THREE.Vector3(CENTRE.x - 60, CENTRE.y + 60, CENTRE.z - 40));
      monde.flash('#FFD23F', 0.5);
      document.body.classList.add('slogan-visible');
    }, null, 3.5);

    // Recul lent et continu : l'image de fin respire pendant les applaudissements.
    tl.to(monde.pose.pos, { z: CENTRE.z + 132, y: CENTRE.y + 10, duration: 14, ease: 'power1.out' }, 3.6);

    // Une gerbe toutes les 3,5 s, et des confettis relancés régulièrement.
    boucleFeux = setInterval(() => {
      if (!groupe.visible) return;
      tirerFeu(new THREE.Vector3(
        CENTRE.x + (rnd() - 0.5) * 190,
        CENTRE.y + 30 + rnd() * 80,
        CENTRE.z - 30 - rnd() * 90,
      ));
      if (rnd() > 0.55) { tirerConfettis(); sono.confettis(); }
    }, 3500);

    return tl;
  }

  function sortir() {
    clearInterval(boucleFeux);
    document.body.classList.remove('final', 'slogan-visible');
  }

  function maj(dt, t) {
    if (bulletin) {
      // Léger balancement, pour que l'écran de fin ne soit jamais figé.
      bulletin.rotation.y = Math.sin(t * 0.32) * 0.09;
      bulletin.rotation.z = 0.04 + Math.sin(t * 0.25) * 0.02;
    }

    if (confActif) {
      let vivants = 0;
      for (let i = 0; i < NB_CONF; i++) {
        confVit[i * 3 + 1] -= 46 * dt;
        confVit[i * 3] *= 1 - 0.7 * dt;          // frottement de l'air
        confVit[i * 3 + 2] *= 1 - 0.7 * dt;
        confPos[i * 3] += confVit[i * 3] * dt;
        confPos[i * 3 + 1] += confVit[i * 3 + 1] * dt;
        confPos[i * 3 + 2] += confVit[i * 3 + 2] * dt;
        for (let k = 0; k < 3; k++) confRot[i * 3 + k] += confVitRot[i * 3 + k] * dt;
        eTemp.set(confRot[i * 3], confRot[i * 3 + 1], confRot[i * 3 + 2]);
        vTemp.set(confPos[i * 3], confPos[i * 3 + 1], confPos[i * 3 + 2]);
        mTemp.makeRotationFromEuler(eTemp);
        mTemp.setPosition(vTemp);
        confettis.setMatrixAt(i, mTemp);
        if (confPos[i * 3 + 1] > CENTRE.y - 48) vivants++;
      }
      confettis.instanceMatrix.needsUpdate = true;
      if (!vivants) { confActif = false; confettis.count = 0; }
    }

    if (feuActif) {
      let vivants = 0;
      for (let i = 0; i < NB_FEU; i++) {
        if (feuVie[i] <= 0) continue;
        feuVie[i] -= dt * 0.62;
        feuVit[i * 3 + 1] -= 16 * dt;
        for (let k = 0; k < 3; k++) {
          feuVit[i * 3 + k] *= 1 - 1.1 * dt;
          feuPos[i * 3 + k] += feuVit[i * 3 + k] * dt;
        }
        if (feuVie[i] > 0) vivants++;
      }
      feux.geometry.attributes.position.needsUpdate = true;
      feux.geometry.attributes.aVie.needsUpdate = true;
      feuActif = vivants > 0;
    }
  }

  function perf(actif) {
    if (confettis) confettis.count = Math.min(confettis.count, actif ? 260 : NB_CONF);
  }

  return { id: 'final', groupe, charger, poseDe, entrer, sortir, maj, perf };
}
