/**
 * Scène 1 — « Année décisive ».
 *
 * Un couloir de lycée stylisé, low-poly et géométrique : on ne cherche pas le
 * réalisme mais la lecture immédiate. Trois panneaux flottants (Bac, Parcoursup,
 * Conseils) défilent pendant que la caméra avance, puis le tampon
 * « ANNÉE DÉCISIVE » s'écrase avec une secousse.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { P } from '../palette.js';
import { alea, textureTexte } from '../outils.js';
import { PANNEAUX } from '../contenu.js';

const Z0 = -90;            // entrée du couloir
const LONGUEUR = 260;

export function creerCouloir({ monde, sono }) {
  const groupe = new THREE.Group();
  const rnd = alea(4242);
  const panneaux = [];
  let neons = [];

  function charger() {
    const zc = Z0 - LONGUEUR / 2;

    // --- sol : une dalle sombre avec une bande lumineuse centrale
    const sol = new THREE.Mesh(
      new THREE.PlaneGeometry(46, LONGUEUR + 80),
      new THREE.MeshStandardMaterial({ color: 0x1b2360, roughness: 0.42, metalness: 0.35 }),
    );
    sol.rotation.x = -Math.PI / 2;
    sol.position.set(0, -7, zc);
    groupe.add(sol);

    const bande = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, LONGUEUR + 80),
      new THREE.MeshBasicMaterial({ color: P.jaune, transparent: true, opacity: 0.55 }),
    );
    bande.rotation.x = -Math.PI / 2;
    bande.position.set(0, -6.95, zc);
    groupe.add(bande);

    // --- murs
    const matMur = new THREE.MeshStandardMaterial({
      color: 0x242d7a, roughness: 0.72, metalness: 0.12,
      emissive: new THREE.Color(0x0e1440), emissiveIntensity: 0.6,
    });
    for (const cote of [-1, 1]) {
      const mur = new THREE.Mesh(new THREE.BoxGeometry(1.2, 20, LONGUEUR + 80), matMur);
      mur.position.set(cote * 17, 3, zc);
      groupe.add(mur);
    }
    // plafond
    const plafond = new THREE.Mesh(new THREE.PlaneGeometry(36, LONGUEUR + 80), matMur);
    plafond.rotation.x = Math.PI / 2;
    plafond.position.set(0, 13, zc);
    groupe.add(plafond);

    // --- casiers : une rangée de boîtes de chaque côté, couleurs de campagne
    const geoCasier = new THREE.BoxGeometry(0.9, 4.2, 2.4);
    const matCasier = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.3 });
    const nbCasiers = 2 * Math.floor(LONGUEUR / 3);
    const casiers = new THREE.InstancedMesh(geoCasier, matCasier, nbCasiers * 2);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    let k = 0;
    for (let cote of [-1, 1]) {
      for (let i = 0; i < nbCasiers; i++) {
        const z = Z0 + 30 - i * 3;
        for (const etage of [-2.6, 2.2]) {
          m.makeTranslation(cote * 16.1, etage, z);
          casiers.setMatrixAt(k, m);
          const r = rnd();
          c.set(r > 0.9 ? P.rouge : r > 0.78 ? P.jaune : r > 0.4 ? 0x20296b : 0x1a2159);
          casiers.setColorAt(k, c);
          k++;
          if (k >= nbCasiers * 2) break;
        }
        if (k >= nbCasiers * 2) break;
      }
    }
    casiers.count = k;
    casiers.instanceMatrix.needsUpdate = true;
    groupe.add(casiers);

    // --- néons au plafond : ce sont eux qui donnent la perspective
    const geoNeon = new THREE.BoxGeometry(9, 0.32, 1.1);
    const matNeon = new THREE.MeshBasicMaterial({ color: P.blanc });
    for (let i = 0; i < 16; i++) {
      const n = new THREE.Mesh(geoNeon, matNeon);
      n.position.set(0, 12.4, Z0 + 20 - i * 18);
      groupe.add(n);
      neons.push(n);
      if (i % 2 === 0) {
        const lampe = new THREE.PointLight(0xdfe6ff, 55, 70, 2);
        lampe.position.set(0, 10.5, n.position.z);
        groupe.add(lampe);
      }
      // Halo au sol sous chaque néon.
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 14),
        new THREE.MeshBasicMaterial({ color: 0x9fb0ff, transparent: true, opacity: 0.07,
          blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(0, -6.9, n.position.z);
      groupe.add(halo);
    }

    // --- les trois panneaux flottants
    const fonds = [P.bleu, P.rouge, P.jaune];
    const encres = ['#FFFBF2', '#FFFBF2', '#0D1030'];
    PANNEAUX.forEach((mot, i) => {
      const tex = textureTexte(mot, {
        largeur: 1024, hauteur: 384, fond: 'transparent',
        couleur: encres[i], police: '400 190px Anton, sans-serif',
      });
      const plaque = new THREE.Group();
      const fond = new THREE.Mesh(
        new THREE.BoxGeometry(20, 7.4, 0.6),
        new THREE.MeshStandardMaterial({ color: fonds[i], roughness: 0.4, metalness: 0.18,
          emissive: new THREE.Color(fonds[i]), emissiveIntensity: 0.22 }),
      );
      const texte = new THREE.Mesh(
        new THREE.PlaneGeometry(19, 7.1),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
      );
      texte.position.z = 0.32;
      const contour = new THREE.Mesh(
        new THREE.BoxGeometry(21.2, 8.6, 0.3),
        new THREE.MeshBasicMaterial({ color: P.blanc, transparent: true, opacity: 0.16 }),
      );
      contour.position.z = -0.2;
      plaque.add(fond, texte, contour);
      // Biais volontaire vers la droite du cadre : la colonne de texte occupe
      // la gauche de l'écran, les panneaux ne doivent jamais passer dessous.
      const cote = i === 1 ? -1 : 1;
      plaque.position.set(cote * 8.4, 3.4 + (i === 1 ? 2.2 : 0), Z0 - 78 - i * 66);
      plaque.rotation.y = -cote * 0.36;
      plaque.userData.base = plaque.position.y;
      plaque.userData.phase = i * 1.7;
      groupe.add(plaque);
      panneaux.push(plaque);
    });

    // --- fond du couloir : une porte lumineuse, pour que ça ne parte pas dans le noir
    const porte = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 17),
      new THREE.MeshBasicMaterial({ color: 0x2d3aa8, transparent: true, opacity: 0.85 }),
    );
    porte.position.set(0, 0.5, Z0 - LONGUEUR - 28);
    groupe.add(porte);
  }

  function poseDe() {
    return {
      pos: [-2.2, 2.8, Z0 + 30], cible: [-3.4, 2.4, Z0 - 70],
      fov: 62, duree: 2.4, arc: 0.1,
    };
  }

  function entrer(beat, { instant, reduit, outils } = {}) {
    const tl = gsap.timeline();
    // Point d'arrêt calculé pour rester à une trentaine d'unités du premier
    // panneau : assez près pour le lire, assez loin pour voir les trois.
    const ARRIVEE = Z0 - 46;
    if (instant) {
      monde.pose.pos.set(-2.2, 2.8, ARRIVEE);
      monde.pose.cible.set(-3.4, 2.4, ARRIVEE - 88);
      return tl;
    }
    // La caméra continue d'avancer pendant que Nael parle : le couloir défile.
    tl.to(monde.pose.pos, { z: ARRIVEE, duration: reduit ? 0.4 : 7.5, ease: 'none' }, 0.4)
      .to(monde.pose.cible, { z: ARRIVEE - 88, duration: reduit ? 0.4 : 7.5, ease: 'none' }, 0.4);
    if (!reduit) {
      tl.call(() => outils?.tamponner('Année décisive'), null, 1.9);
    }
    return tl;
  }

  function sortir() {
    gsap.to(document.getElementById('tampon'), { opacity: 0, duration: 0.3 });
  }

  function maj(dt, t) {
    for (const p of panneaux) {
      p.position.y = p.userData.base + Math.sin(t * 0.7 + p.userData.phase) * 0.55;
      p.rotation.z = Math.sin(t * 0.5 + p.userData.phase) * 0.025;
    }
  }

  return { id: 'couloir', groupe, charger, poseDe, entrer, sortir, maj };
}
