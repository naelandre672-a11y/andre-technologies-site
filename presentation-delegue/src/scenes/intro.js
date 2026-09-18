/**
 * Scène 0 — l'intro, sans parole.
 *
 * Noir → compte à rebours → plongée en hypervitesse dans le champ d'étoiles →
 * des milliers de particules convergent pour former NAEL en lettres pleines →
 * onde de choc et slogan.
 *
 * Les particules sont animées **dans le vertex shader** : un seul draw call pour
 * 12 000 points, ce qui passe sans effort sur un GPU intégré. La convergence
 * n'est qu'un `uniform` que GSAP fait passer de 0 à 1.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { P } from '../palette.js';
import { pointsDeTexte, alea } from '../outils.js';
import { NOM } from '../contenu.js';

const VERT_PARTICULES = `
  uniform float uProgres;      // 0 = dispersé, 1 = lettres formées
  uniform float uTemps;
  uniform float uTaille;
  uniform vec3  uSouris;
  uniform float uSourisForce;
  attribute vec3 aDepart;
  attribute vec3 aCible;
  attribute float aDecalage;   // décale la convergence, lettre par lettre
  attribute vec3 aTeinte;
  varying vec3 vTeinte;
  varying float vVie;

  void main() {
    float p = clamp((uProgres - aDecalage * 0.25) / 0.75, 0.0, 1.0);
    p = 1.0 - pow(1.0 - p, 3.0);                 // easing cubique en sortie
    vec3 pos = mix(aDepart, aCible, p);

    // Tourbillon pendant le trajet, respiration une fois arrivé.
    float tourbillon = (1.0 - p) * 9.0;
    pos.x += sin(uTemps * 0.7 + aDecalage * 24.0) * tourbillon;
    pos.y += cos(uTemps * 0.6 + aDecalage * 19.0) * tourbillon;
    pos.z += sin(uTemps * 0.9 + aDecalage * 31.0) * tourbillon * 1.4;
    pos += vec3(
      sin(uTemps * 1.5 + aCible.x * 0.4),
      cos(uTemps * 1.3 + aCible.y * 0.5),
      sin(uTemps * 1.1 + aCible.x * 0.3)
    ) * p * 0.22;

    // Répulsion à la souris : les particules s'écartent du curseur.
    vec3 vers = pos - uSouris;
    float d = length(vers.xy);
    float pousse = uSourisForce * p * 26.0 / (1.0 + d * d * 0.05);
    pos.xy += normalize(vers.xy + 0.0001) * pousse;

    vTeinte = aTeinte;
    vVie = p;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // Borne indispensable : pendant la plongée, la caméra traverse la coquille
    // de particules. Sans plafond, un point passant à deux unités de l'objectif
    // couvre l'écran entier et fait chuter n'importe quel GPU intégré.
    gl_PointSize = min(uTaille * (0.55 + p * 0.65) * (260.0 / -mv.z), 16.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG_PARTICULES = `
  varying vec3 vTeinte;
  varying float vVie;
  uniform float uOpacite;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vTeinte * (0.75 + vVie * 0.9), a * uOpacite);
  }
`;

export function creerIntro({ monde, sono }) {
  const groupe = new THREE.Group();
  const rnd = alea(20260918);
  let etoiles, particules, voxels, onde, halo;
  let matParticules;
  let etirementMax = 46;
  let tl = null;
  const uSouris = new THREE.Vector3(0, 0, 0);

  function charger() {
    // ---- champ d'étoiles, en segments pour pouvoir les étirer en hypervitesse
    const nbEtoiles = 2200;
    const pos = new Float32Array(nbEtoiles * 2 * 3);
    const lg = new Float32Array(nbEtoiles * 2);
    const col = new Float32Array(nbEtoiles * 2 * 3);
    const teintes = [new THREE.Color(P.blanc), new THREE.Color(P.jaune), new THREE.Color(P.bleuClair)];
    for (let i = 0; i < nbEtoiles; i++) {
      const r = 26 + rnd() * 240;
      const a = rnd() * Math.PI * 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.62;
      const z = -760 + rnd() * 1180;
      pos.set([x, y, z, x, y, z], i * 6);
      lg[i * 2] = 0; lg[i * 2 + 1] = 1;
      const c = teintes[(rnd() * 3) | 0].clone().multiplyScalar(0.45 + rnd() * 0.75);
      col.set([c.r, c.g, c.b, c.r * 0.25, c.g * 0.25, c.b * 0.25], i * 6);
    }
    const gEtoiles = new THREE.BufferGeometry();
    gEtoiles.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    gEtoiles.setAttribute('aLong', new THREE.BufferAttribute(lg, 1));
    gEtoiles.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const matEtoiles = new THREE.ShaderMaterial({
      uniforms: { uEtirement: { value: 0.6 }, uOpacite: { value: 1 } },
      vertexShader: `
        attribute float aLong; varying vec3 vC; uniform float uEtirement;
        void main(){ vC = color; vec3 p = position; p.z += aLong * uEtirement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
      fragmentShader: `varying vec3 vC; uniform float uOpacite;
        void main(){ gl_FragColor = vec4(vC, uOpacite); }`,
      vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    etoiles = new THREE.LineSegments(gEtoiles, matEtoiles);
    etoiles.frustumCulled = false;
    groupe.add(etoiles);

    // ---- la cible : les pixels du mot NAEL, relevés dans un canvas
    const echantillon = pointsDeTexte(NOM, {
      police: '400 260px Anton, sans-serif', pas: 4, hauteur: 26, interlettre: 6,
    });
    const cibles = echantillon.positions;
    const nbCibles = echantillon.nombre;

    // ---- particules : 5 par pixel de lettre, pour une matière dense
    const parPixel = 5;
    const nb = nbCibles * parPixel;
    const aDepart = new Float32Array(nb * 3);
    const aCible = new Float32Array(nb * 3);
    const aDecalage = new Float32Array(nb);
    const aTeinte = new Float32Array(nb * 3);
    const positions = new Float32Array(nb * 3);
    const cBlanc = new THREE.Color(P.blanc);
    const cJaune = new THREE.Color(P.jaune);
    const cBleu = new THREE.Color(0x7d8cff);
    for (let i = 0; i < nb; i++) {
      const s = (i % nbCibles) * 3;
      const cx = cibles[s], cy = cibles[s + 1];
      aCible[i * 3] = cx + (rnd() - 0.5) * 0.55;
      aCible[i * 3 + 1] = cy + (rnd() - 0.5) * 0.55;
      aCible[i * 3 + 2] = (rnd() - 0.5) * 3.4;
      // Départ : une coquille très large, devant et derrière la caméra.
      const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = 110 + rnd() * 190;
      aDepart[i * 3] = Math.sin(ph) * Math.cos(th) * r;
      aDepart[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * r * 0.7;
      aDepart[i * 3 + 2] = Math.cos(ph) * r - 60;
      aDecalage[i] = (cx + echantillon.largeur / 2) / echantillon.largeur; // gauche → droite
      const c = rnd() > 0.86 ? cJaune : rnd() > 0.7 ? cBleu : cBlanc;
      aTeinte.set([c.r, c.g, c.b], i * 3);
    }
    const gPart = new THREE.BufferGeometry();
    gPart.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    gPart.setAttribute('aDepart', new THREE.BufferAttribute(aDepart, 3));
    gPart.setAttribute('aCible', new THREE.BufferAttribute(aCible, 3));
    gPart.setAttribute('aDecalage', new THREE.BufferAttribute(aDecalage, 1));
    gPart.setAttribute('aTeinte', new THREE.BufferAttribute(aTeinte, 3));
    gPart.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);
    matParticules = new THREE.ShaderMaterial({
      uniforms: {
        uProgres: { value: 0 }, uTemps: { value: 0 }, uTaille: { value: 1.55 },
        uOpacite: { value: 1 }, uSouris: { value: uSouris }, uSourisForce: { value: 0 },
      },
      vertexShader: VERT_PARTICULES, fragmentShader: FRAG_PARTICULES,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    particules = new THREE.Points(gPart, matParticules);
    particules.frustumCulled = false;
    groupe.add(particules);

    // ---- les lettres pleines : un cube par pixel, en InstancedMesh
    // Les cubes sont volontairement un peu plus larges que le pas
    // d'échantillonnage : sans ce recouvrement, les lettres apparaissent
    // grignotées, comme rongées par les bords.
    const geoCube = new THREE.BoxGeometry(0.82, 0.82, 3.2);
    const matCube = new THREE.MeshStandardMaterial({
      color: P.blanc, roughness: 0.22, metalness: 0.08,
      emissive: new THREE.Color(P.blanc), emissiveIntensity: 0.62,
    });
    voxels = new THREE.InstancedMesh(geoCube, matCube, nbCibles);
    const m = new THREE.Matrix4();
    const couleur = new THREE.Color();
    for (let i = 0; i < nbCibles; i++) {
      m.makeTranslation(cibles[i * 3], cibles[i * 3 + 1], (rnd() - 0.5) * 0.9);
      voxels.setMatrixAt(i, m);
      const r = rnd();
      couleur.set(r > 0.93 ? P.jaune : r > 0.88 ? P.bleuClair : P.blanc);
      voxels.setColorAt(i, couleur);
    }
    voxels.instanceMatrix.needsUpdate = true;
    voxels.frustumCulled = false;
    voxels.scale.set(1, 0.001, 1);
    voxels.visible = false;
    groupe.add(voxels);

    // ---- onde de choc + halo derrière les lettres
    onde = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.1, 96),
      new THREE.MeshBasicMaterial({ color: P.jaune, transparent: true, opacity: 0,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    onde.scale.setScalar(1);
    groupe.add(onde);

    halo = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 120),
      new THREE.ShaderMaterial({
        uniforms: { uOpacite: { value: 0 }, uCouleur: { value: new THREE.Color(P.bleu) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: `varying vec2 vUv; uniform float uOpacite; uniform vec3 uCouleur;
          void main(){ float d = length((vUv-0.5)*vec2(1.6,1.0));
            gl_FragColor = vec4(uCouleur, smoothstep(0.62,0.0,d)*uOpacite); }`,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    halo.position.z = -26;
    groupe.add(halo);
  }

  function perf(actif) {
    if (!particules) return;
    const total = particules.geometry.attributes.aCible.count;
    particules.geometry.setDrawRange(0, actif ? Math.floor(total * 0.34) : total);
    etoiles.geometry.setDrawRange(0, actif ? 1400 : Infinity);
    matParticules.uniforms.uTaille.value = actif ? 2.1 : 1.55;
    // Les traînées d'étoiles sont ce qui coûte le plus cher pendant la plongée :
    // en mode performance on les raccourcit fortement.
    etirementMax = actif ? 22 : 46;
  }

  /** Le déroulé complet de l'intro. */
  function entrer(beat, { instant = false, reduit = false } = {}) {
    groupe.visible = true;
    tl = gsap.timeline();
    const cpt = document.getElementById('compte');
    const matEtoiles = etoiles.material;

    // État de départ
    monde.pose.pos.set(0, 0, 430);
    monde.pose.cible.set(0, 0, 0);
    matParticules.uniforms.uProgres.value = 0;
    matParticules.uniforms.uSourisForce.value = 0;
    matParticules.uniforms.uOpacite.value = 1;
    matEtoiles.uniforms.uEtirement.value = 0.6;
    voxels.visible = false;
    voxels.scale.set(1, 0.001, 1);
    onde.material.opacity = 0;
    halo.material.uniforms.uOpacite.value = 0;
    // Remise à zéro indispensable pour la touche R : sans elle, une intro
    // rejouée affichait le slogan dès le compte à rebours.
    document.body.classList.remove('slogan-visible');
    const noir = document.getElementById('noir');

    if (instant || reduit) {
      matParticules.uniforms.uProgres.value = 1;
      matParticules.uniforms.uSourisForce.value = 1;
      matParticules.uniforms.uOpacite.value = 0.42;
      voxels.visible = true; voxels.scale.set(1, 1, 1);
      halo.material.uniforms.uOpacite.value = 0.42;
      monde.pose.pos.set(0, 0, 64);
      document.body.classList.add('slogan-visible');
      if (cpt) { cpt.textContent = ''; gsap.set(cpt, { opacity: 0 }); }
      if (noir) gsap.set(noir, { opacity: 0 });
      return tl;
    }

    // ---- 1. compte à rebours, sur fond noir
    if (noir) {
      gsap.set(noir, { opacity: 1 });
      tl.to(noir, { opacity: 0, duration: 2.2, ease: 'power2.in' }, 2.6);
    }
    // Le décompte est animé par GSAP et non par une animation CSS : il reste
    // ainsi solidaire de la timeline (donc correct après un saut, un retour en
    // arrière ou la touche R), ce qu'une animation CSS ne sait pas faire.
    const bip = (n, dernier, quand) => {
      tl.call(() => { cpt.textContent = n; sono.bip(dernier); }, null, quand)
        .fromTo(cpt, { opacity: 0, scale: 2.2 },
          { opacity: 1, scale: 1, duration: 0.2, ease: 'power3.out' }, quand)
        .to(cpt, { opacity: 0, scale: 0.86, duration: 0.34, ease: 'power2.in' }, quand + 0.42);
    };
    gsap.set(cpt, { opacity: 0 });
    bip('3', false, 0.55);
    bip('2', false, 1.4);
    bip('1', true, 2.25);
    tl.call(() => { cpt.textContent = ''; }, null, 2.95);
    tl.to({}, { duration: 0.05 }, 2.95);

    // ---- 2. plongée en hypervitesse
    tl.call(() => { sono.riser(3.4); sono.nappe(true, 0.16); });
    tl.to(matEtoiles.uniforms.uEtirement, { value: etirementMax, duration: 2.3, ease: 'power3.in' }, '<')
      .to(monde.pose.pos, { z: 96, duration: 3.1, ease: 'power2.in' }, '<')
      .to(monde.passeFinale.uniforms.aberration, { value: 0.009, duration: 2.6, ease: 'power2.in' }, '<');

    // ---- 3. convergence des particules
    tl.to(matEtoiles.uniforms.uEtirement, { value: 1.4, duration: 1.1, ease: 'power2.out' })
      .to(monde.pose.pos, { z: 64, duration: 2.4, ease: 'power2.out' }, '<')
      .to(matParticules.uniforms.uProgres, { value: 1, duration: 1.75, ease: 'none' }, '<')
      .to(monde.passeFinale.uniforms.aberration, { value: 0, duration: 1.2 }, '<');

    // ---- 4. impact
    tl.call(() => {
      sono.impact(); sono.drop();
      monde.flash('#FFFBF2', 0.45);
      monde.secousse(1.5, 0.75);
      voxels.visible = true;
      document.body.classList.add('slogan-visible');
    }, null, '-=0.12');
    tl.fromTo(voxels.scale, { y: 0.001, x: 1.25, z: 1.25 },
      { y: 1, x: 1, z: 1, duration: 0.55, ease: 'back.out(2.4)' }, '<');
    tl.fromTo(onde.material, { opacity: 0.95 }, { opacity: 0, duration: 1.1, ease: 'power2.out' }, '<')
      .fromTo(onde.scale, { x: 2, y: 2, z: 2 }, { x: 150, y: 150, z: 150, duration: 1.1, ease: 'power2.out' }, '<')
      .to(halo.material.uniforms.uOpacite, { value: 0.42, duration: 1.2 }, '<')
      .to(matParticules.uniforms.uSourisForce, { value: 1, duration: 1.4 }, '<')
      // Les particules passent en halo : à pleine opacité elles mangent les
      // lettres au lieu de les mettre en valeur.
      .to(matParticules.uniforms.uOpacite, { value: 0.42, duration: 1.2 }, '<');

    // ---- 5. on souffle : léger recul, les lettres respirent
    tl.to(monde.pose.pos, { z: 70, duration: 3.2, ease: 'power1.inOut' }, '>-0.3');
    return tl;
  }

  function sortir() {
    document.body.classList.remove('slogan-visible');
    gsap.to(matParticules.uniforms.uOpacite, { value: 0.35, duration: 0.8 });
    gsap.to(etoiles.material.uniforms.uOpacite, { value: 0.55, duration: 0.8 });
  }

  function maj(dt, t) {
    if (!matParticules) return;
    matParticules.uniforms.uTemps.value = t;
    // La souris, projetée sur le plan des lettres.
    uSouris.set(monde.sourisLissee.x * 46, -monde.sourisLissee.y * 26, 0);
    if (voxels.visible) voxels.rotation.y = Math.sin(t * 0.35) * 0.055;
    if (halo) halo.rotation.z = Math.sin(t * 0.12) * 0.04;
  }

  return {
    id: 'intro', groupe, charger, entrer, sortir, maj, perf,
    poseDe: () => null,        // l'intro pilote sa caméra elle-même
    dureeApprox: 9.5,
  };
}
