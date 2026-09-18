/**
 * Scène 2 — « Mon programme ».
 *
 * Quatre monolithes en orbite autour de la caméra. À chaque flèche droite, la
 * caméra pivote d'un quart de tour et le monolithe suivant s'allume : une carte
 * à la fois, jamais quatre blocs de texte d'un coup.
 *
 * Chaque monolithe porte une icône construite en primitives (cône, cylindre,
 * tore…) et animée : c'est ce qui distingue une carte 3D d'une image collée.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { P } from '../palette.js';
import { textureTexte } from '../outils.js';
import { CARTES } from '../contenu.js';

const CENTRE = new THREE.Vector3(0, 2, -420);
const RAYON = 30;
const RECUL = 7;      // recul derrière le centre de l'orbite
const DECALAGE = 13;  // pousse le monolithe vers la droite du cadre

/** Les quatre icônes, en primitives. Chacune expose une fonction d'animation. */
function creerIcone(cle) {
  const g = new THREE.Group();
  const matVif = (c, e = 0.45) => new THREE.MeshStandardMaterial({
    color: c, roughness: 0.3, metalness: 0.25,
    emissive: new THREE.Color(c), emissiveIntensity: e,
  });

  if (cle === 'megaphone') {
    const pavillon = new THREE.Mesh(new THREE.ConeGeometry(2.1, 3.6, 5, 1, true), matVif(P.jaune));
    pavillon.rotation.z = -Math.PI / 2;
    pavillon.position.x = 1.1;
    pavillon.material.side = THREE.DoubleSide;
    const corps = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.2, 6), matVif(P.rouge, 0.3));
    corps.rotation.z = -Math.PI / 2;
    corps.position.x = -1.5;
    const poignee = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), matVif(P.blanc, 0.15));
    poignee.position.set(-1.5, -1.2, 0);
    g.add(pavillon, corps, poignee);
    // Ondes sonores qui partent du pavillon.
    const ondes = [];
    for (let i = 0; i < 3; i++) {
      const o = new THREE.Mesh(
        new THREE.TorusGeometry(1.0 + i * 0.55, 0.085, 6, 24, Math.PI * 0.8),
        new THREE.MeshBasicMaterial({ color: P.blanc, transparent: true, opacity: 0.6 }),
      );
      o.rotation.y = Math.PI / 2;
      o.rotation.z = -Math.PI * 0.4;
      o.position.x = 2.9 + i * 0.28;
      g.add(o); ondes.push(o);
    }
    g.userData.anim = (t) => {
      ondes.forEach((o, i) => {
        const p = (t * 0.9 + i * 0.33) % 1;
        o.scale.setScalar(0.6 + p * 0.75);
        o.material.opacity = 0.75 * (1 - p);
      });
      g.rotation.z = Math.sin(t * 1.8) * 0.07;
    };
  }

  if (cle === 'enveloppe') {
    const corps = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.6, 0.5), matVif(P.blanc, 0.2));
    // Le rabat est un vrai triangle plat : un cône à quatre pans, même tourné,
    // se lisait comme un losange posé sur l'enveloppe.
    const forme = new THREE.Shape();
    forme.moveTo(-2.7, 1.8); forme.lineTo(2.7, 1.8); forme.lineTo(0, -0.7); forme.closePath();
    const rabat = new THREE.Mesh(new THREE.ShapeGeometry(forme), matVif(0xdfd8c8, 0.12));
    rabat.material.side = THREE.DoubleSide;
    rabat.position.set(0, 0, 0.3);
    const pastille = new THREE.Mesh(new THREE.SphereGeometry(0.92, 20, 14), matVif(P.rouge, 0.8));
    pastille.position.set(2.6, 1.7, 0.5);
    const chiffre = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshBasicMaterial({
        map: textureTexte('1', { largeur: 128, hauteur: 128, couleur: '#FFFBF2', police: '400 96px Anton, sans-serif' }),
        transparent: true,
      }),
    );
    chiffre.position.set(2.6, 1.7, 1.45);
    g.add(corps, rabat, pastille, chiffre);
    g.userData.pastille = pastille;
    g.userData.chiffre = chiffre;
    pastille.scale.setScalar(0.001);
    chiffre.scale.setScalar(0.001);
    g.userData.anim = (t) => { g.rotation.y = Math.sin(t * 0.8) * 0.18; };
  }

  if (cle === 'calendrier') {
    const corps = new THREE.Mesh(new THREE.BoxGeometry(5.2, 5.2, 0.45), matVif(P.blanc, 0.16));
    const bandeau = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.1, 0.5), matVif(P.rouge, 0.35));
    bandeau.position.y = 2.05;
    g.add(corps, bandeau);
    // Grille de jours.
    const geoJour = new THREE.BoxGeometry(0.72, 0.72, 0.12);
    const matJour = new THREE.MeshStandardMaterial({ color: 0x2a3170, roughness: 0.6 });
    const jours = new THREE.InstancedMesh(geoJour, matJour, 20);
    const m = new THREE.Matrix4();
    let k = 0;
    for (let l = 0; l < 4; l++) {
      for (let col = 0; col < 5; col++) {
        m.makeTranslation(-1.7 + col * 0.86, 0.9 - l * 0.86, 0.3);
        jours.setMatrixAt(k++, m);
      }
    }
    jours.instanceMatrix.needsUpdate = true;
    g.add(jours);
    // Le contrôle qu'on déplace : un carré rouge qui saute d'une case à l'autre.
    const controle = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.3), matVif(P.jaune, 0.7));
    controle.position.set(-0.84, 0.9, 0.46);
    g.add(controle);
    g.userData.controle = controle;
    g.userData.anim = (t) => {
      const p = (t * 0.45) % 1;
      const saut = Math.sin(Math.min(1, p * 2.4) * Math.PI);
      controle.position.x = -0.84 + Math.min(1, p * 2.4) * 1.72;
      controle.position.y = 0.9 - Math.min(1, p * 2.4) * 1.72;
      controle.position.z = 0.46 + saut * 1.1;
      controle.rotation.z = saut * 0.7;
    };
  }

  if (cle === 'poignee') {
    const matBleu = matVif(P.bleuClair, 0.32);
    const matRouge = matVif(P.rouge, 0.32);
    const brasG = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 3.2, 4, 10), matBleu);
    brasG.rotation.z = Math.PI / 2 + 0.34;
    brasG.position.set(-2.1, -0.75, 0);
    const brasD = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 3.2, 4, 10), matRouge);
    brasD.rotation.z = Math.PI / 2 - 0.34;
    brasD.position.set(2.1, -0.75, 0);
    const mainG = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 1.7), matBleu);
    mainG.rotation.set(0, 0, 0.42);
    mainG.position.set(-1.05, 0.55, 0.22);
    const mainD = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 1.7), matRouge);
    mainD.rotation.set(0, 0, 0.42);
    mainD.position.set(1.05, 0.55, -0.22);
    // Les pouces, qui font basculer la lecture de « deux blocs » à « une poignée ».
    const pouceG = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.1, 3, 7), matBleu);
    pouceG.rotation.set(0, 0, -0.5);
    pouceG.position.set(-0.55, 1.5, 0.9);
    const pouceD = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.1, 3, 7), matRouge);
    pouceD.rotation.set(0, 0, 0.5);
    pouceD.position.set(0.55, 1.5, -0.9);
    g.add(brasG, brasD, mainG, mainD, pouceG, pouceD);
    // Éclat au point de contact.
    const eclat = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 12),
      new THREE.MeshBasicMaterial({ color: P.jaune, transparent: true, opacity: 0.9 }),
    );
    eclat.position.set(0, 0.7, 1.0);
    g.add(eclat);
    g.userData.anim = (t) => {
      const s = Math.sin(t * 2.1);
      mainG.position.y = 0.55 + s * 0.16;
      mainD.position.y = 0.55 - s * 0.16;
      g.position.y = Math.sin(t * 2.1) * 0.16;
      eclat.scale.setScalar(0.8 + Math.abs(s) * 0.7);
      eclat.material.opacity = 0.35 + Math.abs(s) * 0.55;
    };
  }

  return g;
}

export function creerProgramme({ monde, sono }) {
  const groupe = new THREE.Group();
  const monolithes = [];

  function charger() {
    // Un sol réfléchissant discret, pour que les monolithes ne flottent pas dans le vide.
    const sol = new THREE.Mesh(
      new THREE.CircleGeometry(90, 48),
      new THREE.MeshStandardMaterial({ color: 0x0b0f30, roughness: 0.28, metalness: 0.6 }),
    );
    sol.rotation.x = -Math.PI / 2;
    sol.position.set(CENTRE.x, CENTRE.y - 16, CENTRE.z);
    groupe.add(sol);

    // Anneau lumineux au sol, qui marque l'orbite.
    const anneau = new THREE.Mesh(
      new THREE.RingGeometry(RAYON - 1.2, RAYON + 1.2, 96),
      new THREE.MeshBasicMaterial({ color: P.bleuClair, transparent: true, opacity: 0.28,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    anneau.rotation.x = -Math.PI / 2;
    anneau.position.set(CENTRE.x, CENTRE.y - 15.9, CENTRE.z);
    groupe.add(anneau);

    // Colonnes lumineuses entre les monolithes : elles donnent une profondeur
    // au fond et empêchent le grand vide noir derrière le sujet.
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + Math.PI / 8;
      const h = 30 + (i % 3) * 16;
      const barre = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, h, 0.9),
        new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? P.jaune : P.bleuClair,
          transparent: true, opacity: 0.22 }),
      );
      barre.position.set(
        CENTRE.x + Math.sin(a) * (RAYON + 26),
        CENTRE.y - 16 + h / 2,
        CENTRE.z - Math.cos(a) * (RAYON + 26),
      );
      groupe.add(barre);
    }

    CARTES.forEach((carte, i) => {
      const angle = -i * (Math.PI / 2);
      const mono = new THREE.Group();
      mono.position.set(
        CENTRE.x + Math.sin(angle) * RAYON,
        CENTRE.y,
        CENTRE.z - Math.cos(angle) * RAYON,
      );
      mono.lookAt(CENTRE);

      const dalle = new THREE.Mesh(
        new THREE.BoxGeometry(19, 28, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x131a4e, roughness: 0.34, metalness: 0.45,
          emissive: new THREE.Color(P.bleu), emissiveIntensity: 0.06 }),
      );
      const cadre = new THREE.Mesh(
        new THREE.BoxGeometry(20.6, 29.6, 1),
        new THREE.MeshBasicMaterial({ color: P.bleuClair, transparent: true, opacity: 0.22 }),
      );
      cadre.position.z = -0.5;

      // Numéro de la carte, gravé en haut.
      const num = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 3),
        new THREE.MeshBasicMaterial({
          map: textureTexte(`0${i + 1}`, { largeur: 256, hauteur: 128, couleur: '#FFD23F',
            police: '400 104px Anton, sans-serif' }),
          transparent: true,
        }),
      );
      num.position.set(-5.2, 11.4, 0.95);

      // Pas de titre gravé sur le monolithe : il ferait doublon avec le titre
      // DOM, en plus petit et moins lisible. Le monolithe porte son numéro et
      // son icône, le texte reste dans la colonne de gauche.
      const filet = new THREE.Mesh(
        new THREE.PlaneGeometry(11, 0.55),
        new THREE.MeshBasicMaterial({ color: P.jaune }),
      );
      filet.position.set(0, -10.6, 0.85);

      const icone = creerIcone(carte.cle);
      icone.position.set(0, 1.2, 5);
      icone.scale.setScalar(1.9);

      const lueur = new THREE.PointLight(P.jaune, 0, 46, 2);
      lueur.position.set(0, 2, 9);

      mono.add(cadre, dalle, num, filet, icone, lueur);
      mono.userData = { dalle, cadre, icone, lueur, num, filet, allume: false, index: i };
      groupe.add(mono);
      monolithes.push(mono);
    });
  }

  function poseDe(beat) {
    const angle = -beat * (Math.PI / 2);
    // Direction du monolithe visé, et sa perpendiculaire horizontale.
    const dir = new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle));
    const lat = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const monolithe = CENTRE.clone().addScaledVector(dir, RAYON);
    // Caméra en léger retrait derrière le centre de l'orbite : à 34 unités,
    // un monolithe de 28 de haut occupe les trois quarts de la hauteur d'image.
    const pos = CENTRE.clone().addScaledVector(dir, -RECUL).setY(CENTRE.y + 1.5);
    // On vise à gauche du monolithe pour qu'il se place à droite du cadre,
    // là où la colonne de texte ne passe jamais.
    const cible = monolithe.clone().addScaledVector(lat, -DECALAGE).setY(CENTRE.y - 1);
    return {
      pos: pos.toArray(),
      cible: cible.toArray(),
      fov: 60,
      duree: beat === 0 ? 2.3 : 1.35,
      arc: beat === 0 ? 0.14 : 0.05,
    };
  }

  function allumer(mono, tl, decalage = 0) {
    if (mono.userData.allume) return;
    mono.userData.allume = true;
    const { dalle, cadre, lueur, icone } = mono.userData;
    tl.to(dalle.material, { emissiveIntensity: 0.34, duration: 0.7, ease: 'power2.out' }, decalage)
      .to(cadre.material, { opacity: 0.75, duration: 0.5 }, decalage)
      .to(lueur, { intensity: 34, duration: 0.8, ease: 'power2.out' }, decalage)
      .fromTo(icone.scale, { x: 0.01, y: 0.01, z: 0.01 },
        { x: 1.9, y: 1.9, z: 1.9, duration: 0.75, ease: 'back.out(2)' }, decalage)
      .call(() => sono.cloche(1 + mono.userData.index * 0.12), null, decalage + 0.02);
  }

  function eteindre(mono) {
    if (!mono.userData.allume) return;
    mono.userData.allume = false;
    const { dalle, cadre, lueur } = mono.userData;
    gsap.to(dalle.material, { emissiveIntensity: 0.06, duration: 0.5 });
    gsap.to(cadre.material, { opacity: 0.22, duration: 0.4 });
    gsap.to(lueur, { intensity: 0, duration: 0.4 });
  }

  function entrer(beat, { instant, reduit } = {}) {
    const tl = gsap.timeline();
    monolithes.forEach((m, i) => { if (i !== beat) eteindre(m); });
    const mono = monolithes[beat];
    if (instant) {
      mono.userData.allume = true;
      mono.userData.dalle.material.emissiveIntensity = 0.34;
      mono.userData.cadre.material.opacity = 0.75;
      mono.userData.lueur.intensity = 34;
      mono.userData.icone.scale.setScalar(1.9);
      if (beat === 1) revelerNotification(mono, null, true);
      return tl;
    }
    allumer(mono, tl, reduit ? 0 : 0.85);
    if (beat === 1) revelerNotification(mono, tl, false);
    if (beat === 2) tl.call(() => sono.clic(), null, 1.5);
    return tl;
  }

  /** La pastille de notification qui « pop » sur l'enveloppe. */
  function revelerNotification(mono, tl, instant) {
    const { pastille, chiffre } = mono.userData.icone.userData;
    if (!pastille) return;
    if (instant) { pastille.scale.setScalar(1); chiffre.scale.setScalar(1); return; }
    tl.fromTo([pastille.scale, chiffre.scale], { x: 0.01, y: 0.01, z: 0.01 },
      { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(3.2)' }, 1.5)
      .call(() => sono.pop(1.2), null, 1.5);
  }

  function sortir() {
    for (const m of monolithes) eteindre(m);
  }

  function maj(dt, t) {
    for (const m of monolithes) {
      m.userData.icone.userData.anim?.(t);
      m.position.y = CENTRE.y + Math.sin(t * 0.5 + m.userData.index) * 0.45;
    }
  }

  return { id: 'programme', groupe, charger, poseDe, entrer, sortir, maj };
}
