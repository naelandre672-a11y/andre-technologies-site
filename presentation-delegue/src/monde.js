/**
 * Le socle 3D : rendu, caméra, post-traitement, gestion de la performance.
 *
 * La caméra n'est jamais pilotée directement par les scènes : elles décrivent
 * une « pose » (position + point visé) et `voyager()` s'occupe du trajet, sur
 * une courbe, avec un whoosh et une légère aberration chromatique. C'est ce qui
 * donne l'impression d'un vol continu plutôt que d'une suite de diapositives.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { gsap } from 'gsap';
import { P } from './palette.js';
import { clamp } from './outils.js';

/** Aberration chromatique + vignette + grain, en une seule passe. */
const PasseFinale = {
  uniforms: {
    tDiffuse: { value: null },
    aberration: { value: 0 },
    vignette: { value: 0.9 },
    grain: { value: 0.045 },
    temps: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float aberration, vignette, grain, temps;
    varying vec2 vUv;
    float bruit(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5;
      float d = length(c);
      vec2 dec = c * aberration * (0.35 + d);
      vec4 col;
      col.r = texture2D(tDiffuse, vUv + dec).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - dec).b;
      col.a = 1.0;
      col.rgb *= smoothstep(1.05, vignette * 0.35, d * 1.25);
      col.rgb += (bruit(vUv * 900.0 + temps) - 0.5) * grain;
      gl_FragColor = col;
    }
  `,
};

export class Monde {
  constructor(canvas, { reduit = false } = {}) {
    this.reduit = reduit;
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, powerPreference: 'high-performance', stencil: false,
    });
    this.renderer.setClearColor(P.encreProfonde, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(P.encreProfonde, 0.0032);

    this.camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 4000);
    this.camera.position.set(0, 0, 60);

    // Pose logique de la caméra. Les secousses et la parallaxe souris sont
    // ajoutées par-dessus, pour ne jamais polluer l'animation de voyage.
    this.pose = { pos: new THREE.Vector3(0, 0, 60), cible: new THREE.Vector3(0, 0, 0), fov: 58, roulis: 0 };
    this.secousseVec = new THREE.Vector3();
    this.souris = new THREE.Vector2();
    this.sourisLissee = new THREE.Vector2();
    this.parallaxe = 1;

    this._composer(reduit);

    this.tempsPrecedent = performance.now() / 1000;
    this.temps = 0;
    this.fps = 60;
    this._echantillons = [];
    this._basDepuis = 0;
    this.modePerf = reduit;
    this.perfForcee = false;
    this.auRendu = new Set();

    this.redimensionner();
    window.addEventListener('resize', () => this.redimensionner());
    window.addEventListener('pointermove', (e) => {
      this.souris.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    });
  }

  _composer(reduit) {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 288), 0.62, 0.7, 0.72);
    this.passeFinale = new ShaderPass(PasseFinale);
    this.passeFinale.renderToScreen = true;
    if (!reduit) this.composer.addPass(this.bloom);
    this.composer.addPass(this.passeFinale);
  }

  /** Bascule vers un rendu allégé : moins de pixels, pas de bloom. */
  passerEnPerf(force = false) {
    if (this.modePerf) return;
    this.modePerf = true;
    this.perfForcee = force;
    this.composer.passes = this.composer.passes.filter((p) => p !== this.bloom);
    this.passeFinale.uniforms.grain.value = 0.02;
    this.redimensionner();
    for (const f of this.auRendu) f.perf?.(true);
    document.documentElement.classList.add('perf');
  }

  quitterPerf() {
    if (!this.modePerf || this.reduit) return;
    this.modePerf = false;
    this.perfForcee = false;
    this.composer.passes = [this.composer.passes[0], this.bloom, this.passeFinale];
    this.passeFinale.uniforms.grain.value = 0.045;
    this.redimensionner();
    for (const f of this.auRendu) f.perf?.(false);
    document.documentElement.classList.remove('perf');
  }

  basculerPerf() {
    if (this.modePerf) this.quitterPerf(); else this.passerEnPerf(true);
    return this.modePerf;
  }

  redimensionner() {
    const l = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.modePerf ? 1 : 1.5);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(l, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(l, h);
    this.bloom.setSize(Math.max(256, l * 0.4), Math.max(144, h * 0.4));
    this.camera.aspect = l / h;
    // En 4/3 ou en fenêtre étroite, on élargit le champ pour ne rien couper.
    this.camera.fov = this.pose.fov * (this.camera.aspect < 1.5 ? 1.5 / Math.max(0.9, this.camera.aspect) : 1);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Vol de caméra vers une nouvelle pose, sur une courbe douce.
   * `arc` écarte le trajet de la ligne droite : c'est ce qui donne le mouvement
   * « de caméra » plutôt que le glissement mécanique.
   */
  voyager(pose, { duree = 2.2, arc = 0.18, ease = 'power2.inOut', instant = false } = {}) {
    const depart = this.pose.pos.clone();
    const departCible = this.pose.cible.clone();
    const arrivee = new THREE.Vector3().fromArray(pose.pos);
    const cible = new THREE.Vector3().fromArray(pose.cible);
    const fov = pose.fov ?? 58;
    const roulis = pose.roulis ?? 0;

    if (instant || duree === 0) {
      this.pose.pos.copy(arrivee); this.pose.cible.copy(cible);
      this.pose.fov = fov; this.pose.roulis = roulis;
      this.redimensionner();
      return gsap.timeline();
    }

    const milieu = depart.clone().lerp(arrivee, 0.5);
    const d = depart.distanceTo(arrivee);
    const lateral = new THREE.Vector3().subVectors(arrivee, depart).normalize()
      .cross(new THREE.Vector3(0, 1, 0)).multiplyScalar(d * arc);
    milieu.add(lateral).add(new THREE.Vector3(0, d * arc * 0.35, 0));
    const courbe = new THREE.CatmullRomCurve3([depart, milieu, arrivee], false, 'catmullrom', 0.5);

    const etat = { t: 0 };
    const tl = gsap.timeline();
    tl.to(etat, {
      t: 1, duration: duree, ease,
      onUpdate: () => {
        courbe.getPoint(etat.t, this.pose.pos);
        this.pose.cible.copy(departCible).lerp(cible, etat.t < 0.5
          ? 2 * etat.t * etat.t
          : 1 - Math.pow(-2 * etat.t + 2, 2) / 2);
      },
    }, 0);
    tl.to(this.pose, { fov, roulis, duration: duree, ease, onUpdate: () => this.redimensionner() }, 0);
    // Aberration chromatique : elle monte au milieu du vol, jamais à l'arrêt.
    const ab = this.passeFinale.uniforms.aberration;
    tl.to(ab, { value: this.reduit ? 0.0015 : 0.006, duration: duree * 0.45, ease: 'power2.out' }, 0)
      .to(ab, { value: 0, duration: duree * 0.55, ease: 'power2.in' }, duree * 0.45);
    return tl;
  }

  /** Secousse de caméra sur un impact. */
  secousse(force = 1, duree = 0.55) {
    if (this.reduit) return;
    const etat = { f: force };
    gsap.to(etat, { f: 0, duration: duree, ease: 'power2.out' });
    const depart = performance.now();
    const boucle = () => {
      const e = (performance.now() - depart) / 1000;
      if (e > duree) { this.secousseVec.set(0, 0, 0); return; }
      this.secousseVec.set(
        (Math.random() - 0.5) * etat.f * 2.2,
        (Math.random() - 0.5) * etat.f * 2.2,
        (Math.random() - 0.5) * etat.f * 1.2,
      );
      requestAnimationFrame(boucle);
    };
    boucle();
  }

  /** Flash plein écran (géré en CSS pour rester net et gratuit). */
  flash(couleur = '#FFFBF2', duree = 0.5) {
    const el = document.getElementById('flash');
    if (!el) return;
    el.style.background = couleur;
    gsap.fromTo(el, { opacity: 0.92 }, { opacity: 0, duration: duree, ease: 'power2.out' });
  }

  _surveillerFps(dt) {
    if (this.perfForcee || this.reduit) return;
    this._echantillons.push(1 / Math.max(dt, 0.0001));
    if (this._echantillons.length > 90) this._echantillons.shift();
    if (this._echantillons.length < 90) return;
    this.fps = this._echantillons.reduce((a, b) => a + b, 0) / this._echantillons.length;
    if (!this.modePerf && this.fps < 45) {
      this._basDepuis += dt;
      if (this._basDepuis > 1.6) this.passerEnPerf(false);
    } else {
      this._basDepuis = 0;
    }
  }

  demarrerBoucle(surImage) {
    const image = () => {
      this._raf = requestAnimationFrame(image);
      const maintenant = performance.now() / 1000;
      const dt = Math.min(maintenant - this.tempsPrecedent, 0.1);
      this.tempsPrecedent = maintenant;
      this.temps += dt;
      const t = this.temps;
      this._surveillerFps(dt);

      // Parallaxe souris : discrète, mais c'est elle qui rend la scène vivante.
      this.sourisLissee.lerp(this.souris, 0.055);
      surImage?.(dt, t);

      const p = this.pose;
      this.camera.position.copy(p.pos).add(this.secousseVec);
      this.camera.position.x += this.sourisLissee.x * 1.6 * this.parallaxe;
      this.camera.position.y += -this.sourisLissee.y * 1.1 * this.parallaxe;
      this.camera.lookAt(p.cible);
      this.camera.rotateZ(p.roulis);
      this.passeFinale.uniforms.temps.value = t;
      this.composer.render();
    };
    image();
  }
}
