/**
 * Scène 3 — Parcoursup.
 *
 * Un chemin lumineux à quatre étapes que la caméra survole, pendant qu'une
 * foule de petites silhouettes avance dessus — l'image du « personne à la
 * traîne » : elles partent en ordre dispersé et arrivent groupées.
 *
 * La traînée lumineuse est faite dans le shader du tube (une bande claire qui
 * remonte l'axe U), plutôt qu'avec un objet qui se déplace : c'est plus fluide
 * et ça ne coûte rien.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { P } from '../palette.js';
import { alea, textureTexte } from '../outils.js';
import { PARCOURS } from '../contenu.js';

const BASE = new THREE.Vector3(0, -6, -700);

export function creerParcoursup({ monde, sono }) {
  const groupe = new THREE.Group();
  const rnd = alea(777);
  let courbe, matTube, foule, etapes = [], matFoule;
  let avancementFoule = 0;
  let vitesseFoule = 0;
  const nbFoule = 150;
  const decalages = new Float32Array(nbFoule);
  const lateraux = new Float32Array(nbFoule);

  function charger() {
    // --- la courbe : elle s'enfonce vers le fond en montant, et reste sur la
    // droite du cadre. Un chemin qui traverse l'écran de gauche à droite
    // passerait sous la colonne de texte à chaque étape.
    const pts = [
      new THREE.Vector3(24, 0, 96),
      new THREE.Vector3(44, 6, 44),
      new THREE.Vector3(22, 12, -6),
      new THREE.Vector3(48, 19, -58),
      new THREE.Vector3(26, 26, -106),
      new THREE.Vector3(52, 34, -152),
    ].map((v) => v.add(BASE));
    courbe = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);

    matTube = new THREE.ShaderMaterial({
      uniforms: {
        uTemps: { value: 0 },
        uTrainee: { value: 0 },      // 0 → 1 : progression de la traînée
        uA: { value: new THREE.Color(P.bleu) },
        uB: { value: new THREE.Color(P.jaune) },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec2 vUv; uniform float uTemps, uTrainee; uniform vec3 uA, uB;
        void main(){
          float parcouru = step(vUv.x, uTrainee);
          // Tête de comète, juste devant la partie déjà parcourue.
          float tete = smoothstep(0.06, 0.0, abs(vUv.x - uTrainee));
          // Stries qui filent en continu, pour que le chemin ne soit pas inerte.
          float stries = 0.5 + 0.5 * sin((vUv.x * 120.0) - uTemps * 3.4);
          vec3 c = mix(uA * 0.55, uB, parcouru * (0.6 + stries * 0.4));
          c += uB * tete * 2.2;
          // Bords plus lumineux : donne du volume au ruban.
          float bord = smoothstep(0.42, 0.5, abs(vUv.y - 0.5));
          gl_FragColor = vec4(c + bord * 0.5, 1.0);
        }`,
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(courbe, 220, 3.4, 10, false), matTube);
    groupe.add(tube);

    // Halo sous le chemin.
    const halo = new THREE.Mesh(
      new THREE.TubeGeometry(courbe, 120, 10, 8, false),
      new THREE.MeshBasicMaterial({ color: P.bleuClair, transparent: true, opacity: 0.09,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }),
    );
    groupe.add(halo);

    // --- les quatre étapes : un portique + une étiquette
    PARCOURS.forEach((etape, i) => {
      const u = 0.1 + i * 0.26;
      const pos = courbe.getPointAt(Math.min(0.99, u));
      const g = new THREE.Group();
      g.position.copy(pos);

      const portique = new THREE.Mesh(
        new THREE.TorusGeometry(11, 0.7, 8, 40),
        new THREE.MeshStandardMaterial({ color: P.blanc, roughness: 0.3, metalness: 0.5,
          emissive: new THREE.Color(P.bleuClair), emissiveIntensity: 0.25 }),
      );
      portique.rotation.y = Math.PI / 2;

      const etiquette = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 9),
        new THREE.MeshBasicMaterial({
          map: textureTexte([etape.titre], { largeur: 900, hauteur: 270, couleur: '#FFFBF2',
            police: '400 124px Anton, sans-serif' }),
          transparent: true, depthWrite: false,
        }),
      );
      etiquette.position.set(17, 16, 0);

      const numero = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 4.4),
        new THREE.MeshBasicMaterial({
          map: textureTexte(etape.num, { largeur: 280, hauteur: 160, couleur: '#FFD23F',
            police: '400 128px Anton, sans-serif' }),
          transparent: true, depthWrite: false,
        }),
      );
      numero.position.set(17, 24, 0);

      const lueur = new THREE.PointLight(P.jaune, 0, 60, 2);
      lueur.position.set(0, 6, 0);

      g.add(portique, etiquette, numero, lueur);
      g.userData = { portique, etiquette, numero, lueur, u, allume: false };
      groupe.add(g);
      etapes.push(g);
    });

    // --- la foule : des capsules qui remontent le chemin ensemble
    matFoule = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1 });
    foule = new THREE.InstancedMesh(new THREE.CapsuleGeometry(1.4, 3.4, 4, 8), matFoule, nbFoule);
    const c = new THREE.Color();
    for (let i = 0; i < nbFoule; i++) {
      // Départ étalé : au début, le groupe est très dispersé.
      decalages[i] = -rnd() * 0.42;
      lateraux[i] = (rnd() - 0.5) * 4.6;
      const r = rnd();
      c.set(r > 0.86 ? P.jaune : r > 0.62 ? P.rouge : P.blanc);
      foule.setColorAt(i, c);
    }
    foule.instanceColor.needsUpdate = true;
    groupe.add(foule);

    // Sol lointain, pour ne pas flotter dans le vide absolu.
    const sol = new THREE.Mesh(
      new THREE.PlaneGeometry(520, 620),
      new THREE.MeshStandardMaterial({ color: 0x0a0e2c, roughness: 0.9 }),
    );
    sol.rotation.x = -Math.PI / 2;
    sol.position.set(BASE.x + 38, BASE.y - 40, BASE.z - 50);
    groupe.add(sol);
  }

  function poseDe() {
    const p = courbe.getPointAt(0.02);
    return {
      // En retrait sur la gauche et en hauteur : le chemin part du coin bas
      // droit et fuit vers le fond, le texte garde toute la colonne de gauche.
      pos: [p.x - 52, p.y + 22, p.z + 40], cible: [p.x - 4, p.y + 8, p.z - 54],
      fov: 60, duree: 2.6, arc: 0.2,
    };
  }

  function placerFoule() {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const haut = new THREE.Vector3(0, 1, 0);
    const pos = new THREE.Vector3();
    const tangente = new THREE.Vector3();
    const cote = new THREE.Vector3();
    for (let i = 0; i < nbFoule; i++) {
      // Plus la traînée avance, plus le groupe se resserre : « personne à la traîne ».
      const serrage = 1 - avancementFoule * 0.78;
      const u = Math.min(0.995, Math.max(0.002, avancementFoule + decalages[i] * serrage));
      courbe.getPointAt(u, pos);
      courbe.getTangentAt(u, tangente);
      cote.crossVectors(tangente, haut).normalize();
      pos.addScaledVector(cote, lateraux[i]);
      pos.y += 5.6 + Math.abs(Math.sin(avancementFoule * 26 + i)) * 0.55;
      q.setFromUnitVectors(haut, tangente.clone().lerp(haut, 0.82).normalize());
      m.compose(pos, q, new THREE.Vector3(1, 1, 1));
      foule.setMatrixAt(i, m);
    }
    foule.instanceMatrix.needsUpdate = true;
  }

  function entrer(beat, { instant, reduit } = {}) {
    const tl = gsap.timeline();
    etapes.forEach((e) => {
      e.userData.allume = false;
      e.userData.lueur.intensity = 0;
      e.userData.portique.material.emissiveIntensity = 0.25;
      e.userData.etiquette.material.opacity = 0.25;
      e.userData.numero.material.opacity = 0.25;
    });

    const fin = courbe.getPointAt(0.97);
    // Vue d'arrivée : on prend de la hauteur et du recul pour voir le chemin
    // entier, plutôt que de coller au ruban et de perdre la lecture d'ensemble.
    const ARRIVEE = { x: BASE.x - 30, y: BASE.y + 58, z: BASE.z + 58 };
    const VISE = { x: BASE.x + 46, y: BASE.y + 14, z: BASE.z - 86 };
    if (instant || reduit) {
      matTube.uniforms.uTrainee.value = 1;
      avancementFoule = 0.96;
      placerFoule();
      etapes.forEach((e) => allumerEtape(e, null, 0));
      monde.pose.pos.set(ARRIVEE.x, ARRIVEE.y, ARRIVEE.z);
      monde.pose.cible.set(VISE.x, VISE.y, VISE.z);
      return tl;
    }

    // La traînée remonte le chemin ; la caméra le survole en parallèle.
    avancementFoule = 0;
    tl.to(matTube.uniforms.uTrainee, { value: 1, duration: 8.4, ease: 'none' }, 0.8)
      .to({ v: 0 }, {
        v: 1, duration: 8.4, ease: 'none',
        onUpdate() { avancementFoule = this.targets()[0].v; },
      }, 0.8);

    etapes.forEach((e, i) => {
      tl.call(() => allumerEtape(e, null, 0), null, 0.8 + (e.userData.u + 0.02) * 8.4);
    });

    // Survol : la caméra longe le chemin en restant légèrement en retrait.
    tl.to(monde.pose.pos, { ...ARRIVEE, duration: 8.6, ease: 'power1.inOut' }, 0.8)
      .to(monde.pose.cible, { ...VISE, duration: 8.6, ease: 'power1.inOut' }, 0.8);
    return tl;
  }

  function allumerEtape(e, _tl, _d) {
    if (e.userData.allume) return;
    e.userData.allume = true;
    gsap.to(e.userData.lueur, { intensity: 42, duration: 0.5, ease: 'power2.out' });
    gsap.to(e.userData.portique.material, { emissiveIntensity: 1.1, duration: 0.5 });
    gsap.to([e.userData.etiquette.material, e.userData.numero.material], { opacity: 1, duration: 0.45 });
    gsap.fromTo(e.userData.portique.scale, { x: 0.86, y: 0.86, z: 0.86 },
      { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(3)' });
    sono.cloche(1.25);
  }

  function sortir() {}

  function maj(dt, t) {
    if (!matTube) return;
    matTube.uniforms.uTemps.value = t;
    placerFoule();
    for (const e of etapes) {
      e.userData.portique.rotation.z = t * 0.25;
      // `lookAt` viserait le point de vue et ferait basculer les panneaux dès
      // qu'ils s'éloignent de l'axe. Copier l'orientation de la caméra les
      // garde tous rigoureusement parallèles à l'écran.
      e.userData.etiquette.quaternion.copy(monde.camera.quaternion);
      e.userData.numero.quaternion.copy(monde.camera.quaternion);
      const d = monde.camera.position.distanceTo(e.position);
      const k = Math.min(2.6, Math.max(0.85, d / 105));
      e.userData.etiquette.scale.setScalar(k);
      e.userData.numero.scale.setScalar(k);
      e.userData.etiquette.position.set(15 * k, 15 * k, 0);
      e.userData.numero.position.set(15 * k, 22 * k, 0);
    }
  }

  function perf(actif) {
    if (foule) foule.count = actif ? 60 : nbFoule;
  }

  return { id: 'parcoursup', groupe, charger, poseDe, entrer, sortir, maj, perf };
}
