/**
 * Le fond permanent, accroché à la caméra.
 *
 * Sans lui, dès qu'une scène ne remplit pas le cadre on tombe sur du noir pur :
 * sur un vidéoprojecteur ça donne un grand rectangle mort. Ici, un dégradé très
 * sombre plus une poussière d'étoiles suivent la caméra en permanence, pour que
 * le cadre soit toujours habité sans jamais concurrencer le sujet.
 */
import * as THREE from 'three';
import { P } from './palette.js';
import { alea } from './outils.js';

export function creerCiel() {
  const groupe = new THREE.Group();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(900, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uHaut: { value: new THREE.Color(0x121a55) },
        uBas: { value: new THREE.Color(P.encreProfonde) },
        uAccent: { value: new THREE.Color(P.bleu) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vP; uniform vec3 uHaut, uBas, uAccent;
        void main(){
          float h = smoothstep(-0.55, 0.75, vP.y);
          vec3 c = mix(uBas, uHaut, h);
          // Une lueur diffuse décentrée : évite le dégradé trop régulier.
          float lueur = pow(max(0.0, dot(vP, normalize(vec3(-0.45, 0.35, -0.8)))), 4.0);
          gl_FragColor = vec4(c + uAccent * lueur * 0.35, 1.0);
        }`,
    }),
  );
  groupe.add(dome);

  // Poussière d'étoiles très discrète.
  const rnd = alea(51);
  const n = 900;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = 520 + rnd() * 250;
    pos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    pos[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * r;
    pos[i * 3 + 2] = Math.cos(ph) * r;
    const t = rnd();
    c.set(t > 0.9 ? P.jaune : t > 0.78 ? P.bleuClair : P.blanc).multiplyScalar(0.25 + rnd() * 0.6);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const etoiles = new THREE.Points(g, new THREE.PointsMaterial({
    size: 2.6, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.75, depthWrite: false, fog: false,
  }));
  groupe.add(etoiles);

  groupe.renderOrder = -1;
  groupe.frustumCulled = false;
  return { groupe, etoiles };
}
