/**
 * Scène 4 — le conseil de classe.
 *
 * Table ronde stylisée, un projecteur qui s'allume sur une place, et la
 * plaidoirie qui s'écrit lettre par lettre avec des sons de clavier.
 *
 * La bulle est un élément DOM et non une texture : le texte doit rester
 * parfaitement net au fond de la salle, et il change à chaque frappe — le
 * régénérer en texture soixante fois coûterait bien plus cher.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { P } from '../palette.js';
import { alea } from '../outils.js';
import { PLAIDOIRIE } from '../contenu.js';

const CENTRE = new THREE.Vector3(0, -4, -980);
const PLACES = 12;
const MA_PLACE = 8;      // la place qu'éclaire le projecteur

export function creerConseil({ monde, sono }) {
  const groupe = new THREE.Group();
  const rnd = alea(1312);
  let cone, projecteur, chaises = [], moi, bulle, texteBulle, curseurFrappe = null;

  function charger() {
    // --- sol
    const sol = new THREE.Mesh(
      new THREE.CircleGeometry(90, 56),
      new THREE.MeshStandardMaterial({ color: 0x0a0e2e, roughness: 0.85, metalness: 0.1 }),
    );
    sol.rotation.x = -Math.PI / 2;
    sol.position.copy(CENTRE).setY(CENTRE.y - 6);
    groupe.add(sol);

    // --- table ronde
    const plateau = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 20, 1.3, 56),
      new THREE.MeshStandardMaterial({ color: 0x2b3591, roughness: 0.3, metalness: 0.45 }),
    );
    plateau.position.copy(CENTRE);
    groupe.add(plateau);

    const lisere = new THREE.Mesh(
      new THREE.TorusGeometry(20.1, 0.28, 8, 72),
      new THREE.MeshBasicMaterial({ color: P.bleuClair, transparent: true, opacity: 0.55 }),
    );
    lisere.rotation.x = Math.PI / 2;
    lisere.position.copy(CENTRE).setY(CENTRE.y + 0.7);
    groupe.add(lisere);

    const pied = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 7, 6, 20),
      new THREE.MeshStandardMaterial({ color: 0x141a4a, roughness: 0.6, metalness: 0.3 }),
    );
    pied.position.copy(CENTRE).setY(CENTRE.y - 3.4);
    groupe.add(pied);

    // --- les places : un dossier de chaise + une silhouette
    for (let i = 0; i < PLACES; i++) {
      const a = (i / PLACES) * Math.PI * 2;
      const r = 27;
      const g = new THREE.Group();
      g.position.set(CENTRE.x + Math.cos(a) * r, CENTRE.y - 2, CENTRE.z + Math.sin(a) * r);
      g.lookAt(CENTRE.x, CENTRE.y - 2, CENTRE.z);

      const moiCi = i === MA_PLACE;
      const teinte = moiCi ? P.jaune : i % 4 === 0 ? P.rouge : 0x2a3382;
      const dossier = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 5.2, 0.7),
        new THREE.MeshStandardMaterial({ color: teinte, roughness: 0.5, metalness: 0.15,
          emissive: new THREE.Color(teinte), emissiveIntensity: moiCi ? 0.1 : 0.04 }),
      );
      dossier.position.set(0, 1.4, -2.2);
      const corps = new THREE.Mesh(
        new THREE.CapsuleGeometry(1.5, 3.4, 4, 10),
        new THREE.MeshStandardMaterial({ color: moiCi ? P.blanc : 0x3c47a0, roughness: 0.6 }),
      );
      corps.position.set(0, 3.2, 0);
      const tete = new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 16, 12),
        new THREE.MeshStandardMaterial({ color: moiCi ? P.blanc : 0x4a56bb, roughness: 0.55 }),
      );
      tete.position.set(0, 6.4, 0);
      g.add(dossier, corps, tete);
      g.userData = { dossier, corps, tete, phase: rnd() * 6.3, moi: moiCi };
      groupe.add(g);
      chaises.push(g);
      if (moiCi) moi = g;
    }

    // --- le projecteur qui s'allume sur ma place
    projecteur = new THREE.SpotLight(P.jaune, 0, 70, 0.34, 0.45, 1.2);
    projecteur.position.set(moi.position.x, CENTRE.y + 34, moi.position.z);
    projecteur.target.position.copy(moi.position);
    groupe.add(projecteur, projecteur.target);

    // Le faisceau visible : un cône additif, l'astuce classique.
    cone = new THREE.Mesh(
      new THREE.ConeGeometry(8.5, 28, 28, 1, true),
      new THREE.MeshBasicMaterial({
        color: P.jaune, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    cone.position.set(moi.position.x, CENTRE.y + 11, moi.position.z);
    groupe.add(cone);

    const flaque = new THREE.Mesh(
      new THREE.CircleGeometry(9, 32),
      new THREE.MeshBasicMaterial({ color: P.jaune, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    flaque.rotation.x = -Math.PI / 2;
    flaque.position.set(moi.position.x, CENTRE.y - 5.9, moi.position.z);
    groupe.add(flaque);
    cone.userData.flaque = flaque;

    bulle = document.getElementById('bulle');
    texteBulle = document.getElementById('bulle-texte');
  }

  /**
   * Cadrage de la scène. Même principe que pour les monolithes : on vise à
   * gauche de ma place pour qu'elle tombe dans la moitié droite de l'image,
   * là où la colonne de texte ne passe pas.
   */
  function cadrage(distance, hauteur, decalage) {
    const vers = new THREE.Vector3().subVectors(CENTRE, moi.position).setY(0).normalize();
    const pos = CENTRE.clone().addScaledVector(vers, distance).setY(CENTRE.y + hauteur);
    const axe = new THREE.Vector3().subVectors(moi.position, pos).setY(0).normalize();
    const lat = new THREE.Vector3().crossVectors(axe, new THREE.Vector3(0, 1, 0)).normalize();
    const cible = moi.position.clone().addScaledVector(lat, -decalage).setY(CENTRE.y + 1.5);
    return { pos, cible };
  }

  function poseDe() {
    const { pos, cible } = cadrage(42, 30, 15);
    return { pos: pos.toArray(), cible: cible.toArray(), fov: 56, duree: 2.5, arc: 0.18 };
  }

  /** Écrit la plaidoirie lettre par lettre, avec le son qui va avec. */
  function frapper(instant) {
    clearInterval(curseurFrappe);
    if (!texteBulle) return;
    if (instant) { texteBulle.textContent = PLAIDOIRIE; bulle.classList.add('vue'); return; }
    texteBulle.textContent = '';
    bulle.classList.add('vue', 'frappe');
    let i = 0;
    curseurFrappe = setInterval(() => {
      if (i >= PLAIDOIRIE.length) {
        clearInterval(curseurFrappe);
        bulle.classList.remove('frappe');
        return;
      }
      texteBulle.textContent += PLAIDOIRIE[i];
      if (PLAIDOIRIE[i] !== ' ') sono.clavier();
      i++;
    }, 42);
  }

  function entrer(beat, { instant, reduit } = {}) {
    const tl = gsap.timeline();
    const flaque = cone.userData.flaque;

    const fin = cadrage(27, 20, 13);
    if (instant || reduit) {
      projecteur.intensity = 260;
      cone.material.opacity = 0.26;
      flaque.material.opacity = 0.34;
      monde.pose.pos.copy(fin.pos);
      monde.pose.cible.copy(fin.cible);
      frapper(true);
      return tl;
    }

    projecteur.intensity = 0;
    cone.material.opacity = 0;
    flaque.material.opacity = 0;
    bulle.classList.remove('vue');

    // Le projecteur s'allume en deux temps, comme une vraie lampe.
    tl.call(() => sono.clic(), null, 1.1)
      .to(projecteur, { intensity: 90, duration: 0.09 }, 1.1)
      .to(projecteur, { intensity: 24, duration: 0.07 }, 1.19)
      .to(projecteur, { intensity: 260, duration: 0.7, ease: 'power2.out' }, 1.3)
      .to(cone.material, { opacity: 0.26, duration: 0.8 }, 1.3)
      .to(flaque.material, { opacity: 0.34, duration: 0.8 }, 1.3)
      .to(moi.scale, { x: 1.06, y: 1.06, z: 1.06, duration: 0.5, ease: 'back.out(2)' }, 1.3);

    // Puis la caméra se rapproche doucement et la réplique s'écrit.
    tl.to(monde.pose.pos, { x: fin.pos.x, y: fin.pos.y, z: fin.pos.z, duration: 6.5, ease: 'power1.inOut' }, 1.6)
      .to(monde.pose.cible, { x: fin.cible.x, y: fin.cible.y, z: fin.cible.z, duration: 6.5, ease: 'power1.inOut' }, 1.6)
      .call(() => frapper(false), null, 2.1);

    return tl;
  }

  function sortir() {
    clearInterval(curseurFrappe);
    bulle?.classList.remove('vue', 'frappe');
  }

  function maj(dt, t) {
    for (const c of chaises) {
      // Petit mouvement de respiration pour que l'assemblée soit vivante.
      c.userData.corps.position.y = 3.2 + Math.sin(t * 1.1 + c.userData.phase) * 0.09;
      c.userData.tete.position.y = 6.4 + Math.sin(t * 1.1 + c.userData.phase) * 0.12;
      c.userData.tete.rotation.y = Math.sin(t * 0.4 + c.userData.phase) * 0.35;
    }
    if (cone) cone.rotation.y = t * 0.12;
  }

  return { id: 'conseil', groupe, charger, poseDe, entrer, sortir, maj };
}
