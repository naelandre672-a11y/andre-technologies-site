/**
 * André Technologies — scène 3D "Ligne de process" pilotée par le scroll.
 * Vanilla JS + Three.js (CDN, aucun bundler). Voir README-3D.md pour le branchement.
 *
 * API :  const scene = initTreeScene(containerEl, onProgressChange, options)
 *        scene.setProgress(0..1, immediate?) · scene.setParams({...}) · scene.destroy()
 *        options = { manualScroll: false, params: {...} }
 *
 * TEXTURES — PBR CC0 de Poly Haven (polyhaven.com, CC0 1.0, aucune attribution requise) :
 *   écorce .......... bark_brown_02 (diffuse + normale)
 *   bois brut scié ... plywood (diffuse, teintée)
 *   bois raboté ...... plywood (diffuse, teinte claire)
 * Un rendu procédural Canvas2D s'affiche immédiatement et sert de repli si le CDN est
 * indisponible : la scène ne reste jamais vide.
 *
 * Étapes : 01 grume (bois de bout à cernes, mousse, cicatrice) · 02 sciage à cadre
 * multi-lames traversant · 03 empilage planche par planche avec délignage · 04 séchage
 * (teinte humide→sèche continue, vapeur) · 05 raboteuse traversante (tête de coupe,
 * rouleaux, plans de coupe) · 06 colis cerclé chargé sur camion plateau détaillé.
 */

import * as THREE from 'three';

const STEPS = [
  { name: 'Parc à grumes' }, { name: 'Sciage' }, { name: 'Triage & empilage' },
  { name: 'Séchage' }, { name: 'Rabotage' }, { name: 'Expédition' },
];
const BOUNDS = [0, 0.16, 0.33, 0.50, 0.66, 0.83, 1.0];

const BG_COLOR = 0x191a1c;
const ACCENT = 0x78a22f;

const CC0_TEXTURES = {
  barkDiff: 'images/textures/bark_brown_02_diff.jpg',
  barkNormal: 'images/textures/bark_brown_02_nor_gl.jpg',
  sawnWood: 'images/textures/plywood_diff.jpg',
  planedWood: 'images/textures/plywood_diff.jpg',
};

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const stageT = (p, i) => clamp((p - BOUNDS[i]) / (BOUNDS[i + 1] - BOUNDS[i]), 0, 1);
const ramp = (x, a, b) => smooth((x - a) / (b - a));

/* ---------------- textures procédurales (repli + affichage immédiat) ---------------- */

function canvasTexture(draw, w, h, repeat, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  return t;
}

const barkTexture = () => canvasTexture((ctx, w, h) => {
  ctx.fillStyle = '#4a4038'; ctx.fillRect(0, 0, w, h);
  // zones de teinte : plus grises, plus brunes, plus sombres par endroits
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 40 + Math.random() * 110;
    const kind = Math.random();
    const col = kind < 0.35 ? '96,92,86' : kind < 0.7 ? '86,66,48' : '38,32,27';
    const g = ctx.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, `rgba(${col},0.28)`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * w, y = Math.random() * h, len = 40 + Math.random() * 110;
    const v = 24 + Math.random() * 48;
    ctx.strokeStyle = `rgba(${v + 28},${v + 17},${v - 2},${0.13 + Math.random() * 0.32})`;
    ctx.lineWidth = 0.8 + Math.random() * 2.8;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 4, y + len * 0.35, x - 4, y + len * 0.7, x + (Math.random() - 0.5) * 9, y + len);
    ctx.stroke();
  }
}, 512, 512, [5, 1]);

const barkBump = () => canvasTexture((ctx, w, h) => {
  ctx.fillStyle = '#787878'; ctx.fillRect(0, 0, w, h);
  // sillons profonds (sombres) et crêtes (claires), le long du fil
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * w, y = Math.random() * h, len = 60 + Math.random() * 160;
    const deep = Math.random() < 0.5;
    ctx.strokeStyle = deep ? 'rgba(28,28,28,0.55)' : 'rgba(226,226,226,0.5)';
    ctx.lineWidth = deep ? 3 + Math.random() * 5 : 2 + Math.random() * 3;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 5, y + len * 0.3, x - 5, y + len * 0.7, x + (Math.random() - 0.5) * 12, y + len);
    ctx.stroke();
  }
  for (let i = 0; i < 1600; i++) {
    const v = Math.floor(40 + Math.random() * 190);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5 + Math.random() * 2.5, 10 + Math.random() * 40);
  }
}, 512, 512, [5, 1], false);

/* bois de bout : cernes concentriques irréguliers, cœur pâle → aubier plus foncé, gerces */
const endGrainTexture = () => canvasTexture((ctx, w, h) => {
  const cx = w / 2, cy = h / 2;
  const base = ctx.createRadialGradient(cx, cy, 4, cx, cy, w * 0.52);
  base.addColorStop(0, '#e6d3ac');
  base.addColorStop(0.55, '#d3b487');
  base.addColorStop(1, '#b08657');
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  let r = 7, ring = 0;
  while (r < w * 0.53) {
    ring++;
    const wobble = 1.5 + Math.random() * 3;
    ctx.strokeStyle = `rgba(122,84,46,${0.14 + Math.random() * 0.24})`;
    ctx.lineWidth = 0.8 + Math.random() * 2.2;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.12; a += 0.1) {
      const rr = r * (1 + Math.sin(a * 3 + ring * 1.7) * 0.03 + Math.sin(a * 7 + ring) * 0.015)
        + Math.sin(a * 11 + ring * 3) * wobble * 0.3;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    r += 3 + Math.random() * 8; // espacement variable
  }
  for (let i = 0; i < 7; i++) { // gerces radiales
    const a = Math.random() * Math.PI * 2;
    ctx.strokeStyle = 'rgba(58,38,20,0.5)';
    ctx.lineWidth = 1 + Math.random() * 2.6;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
    ctx.quadraticCurveTo(cx + Math.cos(a + 0.08) * w * 0.24, cy + Math.sin(a + 0.08) * w * 0.24,
      cx + Math.cos(a) * w * 0.46, cy + Math.sin(a) * w * 0.46);
    ctx.stroke();
  }
}, 512, 512);

const grainTexture = (base, contrast, seed = 0) => canvasTexture((ctx, w, h) => {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 110; i++) {
    const y = ((i * 37 + seed * 13) % h) + Math.random() * 4;
    ctx.strokeStyle = `rgba(110,72,36,${contrast * (0.2 + Math.random() * 0.5)})`;
    ctx.lineWidth = 0.5 + Math.random() * 2.6;
    ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.018 + i + seed) * (1.5 + Math.random() * 3.5));
    ctx.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 4 + Math.random() * 9;
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, `rgba(78,50,24,${contrast * 0.8})`); g.addColorStop(1, 'rgba(120,80,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  }
}, 1024, 256, [2, 1]);

function backdropTexture() {
  return canvasTexture((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0f1011'); g.addColorStop(0.55, '#202224'); g.addColorStop(1, '#141516');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }, 64, 512);
}

function applyCC0(loader, url, material, slot, repeat, maxAniso, registry, offset) {
  const proc = material[slot];
  const procBump = material.bumpMap;
  loader.load(url, (tex) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    if (repeat) tex.repeat.set(repeat[0], repeat[1]);
    if (offset) tex.offset.set(offset[0], offset[1]);
    if (maxAniso) tex.anisotropy = maxAniso;
    if (slot === 'map') tex.colorSpace = THREE.SRGBColorSpace;
    material[slot] = tex;
    if (slot === 'normalMap') { material.bumpMap = null; material.normalScale = new THREE.Vector2(1.1, 1.1); }
    material.needsUpdate = true;
    if (registry) registry.push({ material, slot, proc, procBump, cc0: tex });
  }, undefined, () => { /* repli procédural conservé */ });
}

/* planche aux arêtes chanfreinées (rabotage) : les arêtes accrochent la lumière */
function chamferedBoard(len, thick, width, bevel) {
  const s = new THREE.Shape();
  const w2 = width / 2 - bevel, t2 = thick / 2 - bevel;
  s.moveTo(-w2, -t2); s.lineTo(w2, -t2); s.lineTo(w2, t2); s.lineTo(-w2, t2); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: len - bevel * 2, bevelEnabled: true, bevelThickness: bevel,
    bevelSize: bevel, bevelSegments: 2, curveSegments: 1,
  });
  geo.center();
  geo.rotateY(Math.PI / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) / len) + 0.5, (pos.getZ(i) / width) + 0.5);
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function initTreeScene(container, onProgressChange, opts = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 900px = le point de rupture où le site passe la séquence en deux colonnes épinglées.
  // En dessous, il n'y a plus de pin → la scène bascule en repli auto-rotatif.
  // (Mesuré sur la fenêtre, pas sur le conteneur : la colonne média fait ~570px sur desktop.)
  const simplified = reduced || window.innerWidth < 900;
  const manualScroll = !!opts.manualScroll;

  /* ---------- paramètres réglables à chaud (panneau de la démo) ---------- */
  const params = {
    smoothing: 0.07,
    exposure: 1.18,
    keyIntensity: 2.6,
    accentIntensity: 3.2,
    cameraSweep: 1.75,
    fov: 34,
    bumpScale: 0.09,
    woodTint: 'ambre',
    particles: true,
    useCC0: true,
    ...(opts.params || {}),
  };
  // [humide (scié frais), sec, raboté]
  const TINTS = {
    ambre: ['#a87445', '#e2c99c', '#f0e0bd'],
    clair: ['#b98a5e', '#ecd9b4', '#f7ecd2'],
    chene: ['#8f6234', '#d3b485', '#e6d0a4'],
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG_COLOR, 0.05);
  const fog = scene.fog;

  const camera = new THREE.PerspectiveCamera(params.fov, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 80);

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight || window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = params.exposure;
  renderer.localClippingEnabled = true; // plans de coupe de la raboteuse
  container.appendChild(renderer.domElement);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  /* ---------- environnement studio (réflexions douces) ---------- */
  {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x1a1b1d);
    const panel = (color, intensity, pos, scl) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) }));
      m.position.set(...pos); m.scale.set(...scl); m.lookAt(0, 0, 0); envScene.add(m);
    };
    panel(0xfff0dc, 4.0, [3, 4, 2], [6, 4, 1]);
    panel(0xa8c6dd, 1.2, [-4, 2, -2], [7, 5, 1]);
    panel(0xffffff, 2.0, [0, 5, -4], [8, 3, 1]);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    scene.environmentIntensity = 0.55;
    pmrem.dispose();
  }

  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(40, 32, 16),
    new THREE.MeshBasicMaterial({ map: backdropTexture(), side: THREE.BackSide, fog: false, depthWrite: false })
  );
  scene.add(backdrop);

  /* ---------- éclairage 3 points, ambiance par étape ---------- */
  const key = new THREE.DirectionalLight(0xffe8ce, 2.6);
  const KEY_BASE = new THREE.Vector3(4.5, 6, 3.2);
  const KEY_RAKING = new THREE.Vector3(1.6, 1.3, 5.4); // rasante latérale : creuse l'écorce
  key.position.copy(KEY_RAKING);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 26;
  key.shadow.camera.left = -8; key.shadow.camera.right = 8;
  key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  key.shadow.bias = -0.0007; key.shadow.normalBias = 0.02; key.shadow.radius = 3;
  scene.add(key);

  const fillLight = new THREE.DirectionalLight(0x9ab8cf, 0.6);
  fillLight.position.set(-5, 2.2, -1.2);
  scene.add(fillLight);

  const rim = new THREE.SpotLight(0xffffff, 9, 20, 0.75, 0.9, 1.4);
  rim.position.set(-3, 4, -5.5);
  scene.add(rim);

  const accentLight = new THREE.PointLight(ACCENT, params.accentIntensity, 9, 2.4);
  accentLight.position.set(2.6, 1.9, -3.2);
  scene.add(accentLight);

  const hemi = new THREE.HemisphereLight(0x8fa6b8, 0x1c1a18, 0.4);
  scene.add(hemi);

  // lumière côté caméra : modèle la face visible des machines et du camion (étapes 5-6)
  const frontLight = new THREE.DirectionalLight(0xdfe8ee, 0);
  scene.add(frontLight);
  scene.add(frontLight.target);

  /* ---------- sol ---------- */
  const floorTex = canvasTexture((ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.05, w / 2, h / 2, w * 0.5);
    g.addColorStop(0, '#33352f'); g.addColorStop(0.55, '#2a2b2d'); g.addColorStop(1, '#1b1c1d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }, 512, 512);
  floorTex.wrapS = floorTex.wrapT = THREE.ClampToEdgeWrapping;
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.78, metalness: 0.04 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(18, 64), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- matériaux bois ---------- */
  const texLoader = new THREE.TextureLoader();
  texLoader.setCrossOrigin('anonymous');
  const texSwaps = [];

  const barkMat = new THREE.MeshStandardMaterial({
    map: barkTexture(), bumpMap: barkBump(), bumpScale: params.bumpScale,
    color: 0xa89b8f, roughness: 1.0, metalness: 0, transparent: true,
  });
  barkMat.map.anisotropy = maxAniso;
  applyCC0(texLoader, CC0_TEXTURES.barkDiff, barkMat, 'map', [5, 1], maxAniso, texSwaps);
  applyCC0(texLoader, CC0_TEXTURES.barkNormal, barkMat, 'normalMap', [5, 1], maxAniso, texSwaps);

  const endTex = endGrainTexture();
  // coupe fraîche légèrement luisante, jamais mate
  const endMat = new THREE.MeshStandardMaterial({ map: endTex, roughness: 0.48, metalness: 0.02, envMapIntensity: 0.9, transparent: true });

  const WET = new THREE.Color(TINTS.ambre[0]);
  const DRY = new THREE.Color(TINTS.ambre[1]);
  const PLANED = new THREE.Color(TINTS.ambre[2]);
  const sawnTex = grainTexture('#b07f47', 1);
  const planedTex = grainTexture('#d9bb8e', 0.4, 3);
  sawnTex.anisotropy = planedTex.anisotropy = maxAniso;

  const stickerMat = new THREE.MeshStandardMaterial({ color: 0x8a6f4c, roughness: 0.95, transparent: true });
  const bearerMat = new THREE.MeshStandardMaterial({ color: 0x3a352f, roughness: 0.9, transparent: true, opacity: 0 });

  /* ---------- grume : galbe, effilement, ovalisation, nœuds, mousse, cicatrice ---------- */
  const LOG_LEN = 3.0, R_BUTT = 0.56, R_TIP = 0.44;
  const logGroup = new THREE.Group();
  const logGeo = new THREE.CylinderGeometry(R_TIP, R_BUTT, LOG_LEN, 56, 14, true);
  {
    const pos = logGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const t = y / LOG_LEN + 0.5; // 0 (gros bout) → 1 (fin bout)
      const oval = 1 + Math.sin(y * 2.1 + 1.2) * 0.045 * Math.cos(a * 2); // ovalisation variable
      const n = 1 + Math.sin(y * 3.1 + a * 4) * 0.018 + Math.sin(y * 8.3 + a * 2) * 0.011 + Math.sin(a * 9) * 0.007;
      const bow = Math.sin(t * Math.PI) * 0.05; // léger galbe
      pos.setX(i, x * n * oval + bow);
      pos.setZ(i, z * n * (2 - oval));
    }
    logGeo.computeVertexNormals();
  }
  const logMesh = new THREE.Mesh(logGeo, barkMat);
  logMesh.rotation.z = Math.PI / 2;
  logMesh.castShadow = true; logMesh.receiveShadow = true;
  logGroup.add(logMesh);

  const capButt = new THREE.Mesh(new THREE.CircleGeometry(R_BUTT * 1.01, 48), endMat);
  capButt.rotation.y = -Math.PI / 2; capButt.position.x = -LOG_LEN / 2 + 0.003;
  const capTip = new THREE.Mesh(new THREE.CircleGeometry(R_TIP * 1.02, 48), endMat);
  capTip.rotation.y = Math.PI / 2; capTip.position.x = LOG_LEN / 2 - 0.003;
  logGroup.add(capButt, capTip);

  // nœuds coupés (cicatrices d'élagage) : cylindre d'écorce + cœur sombre en creux
  const knotCoreMat = new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.95, transparent: true });
  [[-0.85, 0.5, 1], [0.62, -0.35, -1]].forEach(([x, ry, side]) => {
    const rTop = 0.07, rBot = 0.115;
    const knot = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, 0.13, 14), barkMat);
    knot.position.set(x, 0.12 * side, side * R_BUTT * 0.8);
    knot.rotation.set(Math.PI / 2 * side, 0, ry);
    knot.castShadow = true;
    logGroup.add(knot);
    const core = new THREE.Mesh(new THREE.CircleGeometry(rTop * 0.85, 14), knotCoreMat);
    core.position.copy(knot.position);
    const dir = new THREE.Vector3(0, 0.12 * side, side).normalize();
    core.position.addScaledVector(dir, 0.062);
    core.lookAt(core.position.clone().addScaledVector(dir, 1));
    logGroup.add(core);
  });

  // plaques de mousse / lichen + une zone d'écorce détachée
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x49523e, roughness: 1, transparent: true, opacity: 0.92 });
  const lichenMat = new THREE.MeshStandardMaterial({ color: 0x5e6456, roughness: 1, transparent: true, opacity: 0.85 });
  const barkLossMat = new THREE.MeshStandardMaterial({ color: 0x8a6b4a, roughness: 0.9, transparent: true });
  const decalMats = [mossMat, lichenMat, barkLossMat];
  const addDecal = (mat, x, angle, sx, sz) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), mat);
    const t = x / LOG_LEN + 0.5;
    const r = lerp(R_BUTT, R_TIP, t) * 0.995;
    m.position.set(x, Math.cos(angle) * r, Math.sin(angle) * r);
    m.scale.set(sx, 0.035, sz);
    m.lookAt(m.position.x, m.position.y * 2.5, m.position.z * 2.5);
    logGroup.add(m);
  };
  addDecal(mossMat, -1.1, 0.5, 0.19, 0.13);
  addDecal(mossMat, -0.3, 0.9, 0.16, 0.12);
  addDecal(lichenMat, 0.55, -0.7, 0.19, 0.13);
  addDecal(lichenMat, 1.05, 0.3, 0.12, 0.1);
  addDecal(barkLossMat, 0.1, -2.4, 0.3, 0.17); // écorce détachée : bois nu

  logGroup.position.y = R_BUTT;
  logGroup.rotation.y = 0.05;
  scene.add(logGroup);

  /* ---------- débits : 6 tranches verticales (sciage) qui deviennent la pile ---------- */
  const N = 6, T = 0.105, STICK = 0.045, UNIFORM_W = 0.62;
  const dys = [-0.375, -0.225, -0.075, 0.075, 0.225, 0.375];
  const chordAt = (dz) => 2 * Math.sqrt(Math.max(R_BUTT * R_BUTT - Math.pow(Math.abs(dz) + T / 2, 2), 0.03)) * 0.95;
  const boards = [];
  const sharedEndTex = endGrainTexture();

  for (let i = 0; i < N; i++) {
    const off = [Math.random() * 0.6, Math.random() * 0.5];
    const sideTex = sawnTex.clone();
    sideTex.offset.set(off[0], off[1]);
    sideTex.needsUpdate = true;
    const faceMat = new THREE.MeshStandardMaterial({
      map: sideTex, color: WET.clone(), roughness: 0.72, metalness: 0, transparent: true, opacity: 0,
    });
    applyCC0(texLoader, CC0_TEXTURES.sawnWood, faceMat, 'map', [2, 1], maxAniso, texSwaps, off);
    // face inférieure plus sombre : occlusion dans les interstices de la pile
    const bottomMat = faceMat.clone();
    const endFace = new THREE.MeshStandardMaterial({
      map: sharedEndTex, color: WET.clone(), roughness: 0.72, transparent: true, opacity: 0,
    });
    // ordre des faces : +x, -x, +y (dessus), -y (dessous), +z, -z
    const mats = [endFace, endFace, faceMat, bottomMat, faceMat, faceMat];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(LOG_LEN * 0.96, T, UNIFORM_W), mats);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.visible = false;
    scene.add(mesh);
    boards.push({
      mesh, faceMat, bottomMat, endFace,
      sliceZ: dys[i],
      chordScale: chordAt(dys[i]) / UNIFORM_W,
      stackY: 0.14 + i * (T + STICK),
      jitter: 0.93 + Math.random() * 0.13, // variation planche à planche
    });
  }
  const HERO = 5; // la planche du dessus part au rabotage

  /* ---------- scie à cadre multi-lames (sciage) ---------- */
  const sawFrameMat = new THREE.MeshStandardMaterial({ color: 0x2c2e31, roughness: 0.5, metalness: 0.6, transparent: true, opacity: 0 });
  const sawBladeMat = new THREE.MeshStandardMaterial({ color: 0xb8bdb6, roughness: 0.22, metalness: 0.92, transparent: true, opacity: 0 });
  const sawAccentMat = new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.5, metalness: 0.2, transparent: true, opacity: 0 });
  const sawGroup = new THREE.Group();
  const addSawPart = (geo, mat, pos) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.castShadow = true;
    sawGroup.add(m);
    return m;
  };
  addSawPart(new THREE.BoxGeometry(0.14, 2.2, 0.14), sawFrameMat, [0, 1.1, -0.95]);
  addSawPart(new THREE.BoxGeometry(0.14, 2.2, 0.14), sawFrameMat, [0, 1.1, 0.95]);
  addSawPart(new THREE.BoxGeometry(0.12, 0.16, 2.0), sawFrameMat, [0, 2.14, 0]);
  addSawPart(new THREE.BoxGeometry(0.12, 0.1, 2.0), sawFrameMat, [0, 0.05, 0]);
  addSawPart(new THREE.BoxGeometry(0.12, 0.05, 1.9), sawAccentMat, [0, 2.0, 0]);
  const sawBlades = [];
  for (let k = 0; k <= N; k++) {
    const z = -0.45 + k * 0.15;
    sawBlades.push(addSawPart(new THREE.BoxGeometry(0.09, 1.7, 0.011), sawBladeMat, [0, 1.02, z]));
  }
  sawGroup.visible = false;
  scene.add(sawGroup);

  /* ---------- chevrons + baguettes d'espacement ---------- */
  const bearers = [-1, 1].map((s) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, UNIFORM_W * 1.25), bearerMat);
    m.position.set(s * LOG_LEN * 0.3, 0.05, 0);
    m.castShadow = true; m.receiveShadow = true; m.visible = false;
    scene.add(m);
    return m;
  });
  const stickers = [];
  for (let i = 0; i < N - 1; i++) {
    for (let s = 0; s < 3; s++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, STICK * 0.85, UNIFORM_W * 1.03), stickerMat);
      m.castShadow = true; m.visible = false;
      scene.add(m);
      stickers.push({ mesh: m, layer: i, y: 0.14 + i * (T + STICK) + T / 2 + STICK * 0.42, x: (s - 1) * LOG_LEN * 0.35 });
    }
  }

  /* ---------- raboteuse industrielle ---------- */
  const FEED_Y = 0.95, TF = T * 0.86;
  const machBodyMat = new THREE.MeshStandardMaterial({ color: 0x5b6167, roughness: 0.36, metalness: 0.65, envMapIntensity: 1.25, transparent: true, opacity: 0 });
  const machSteelMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a3, roughness: 0.28, metalness: 0.85, transparent: true, opacity: 0 });
  const cutterMat = new THREE.MeshStandardMaterial({ color: 0x7d8388, roughness: 0.28, metalness: 0.85, envMapIntensity: 1.3, transparent: true, opacity: 0 });
  const machAccentMat = new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.5, metalness: 0.2, transparent: true, opacity: 0 });
  const machineMats = [machBodyMat, machSteelMat, cutterMat, machAccentMat];
  const machineGroup = new THREE.Group();
  const addMach = (geo, mat, pos, rot) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    m.castShadow = true; m.receiveShadow = true;
    machineGroup.add(m);
    return m;
  };
  // tables d'entrée / sortie + pieds
  addMach(new THREE.BoxGeometry(4.4, 0.07, 0.8), machBodyMat, [0, FEED_Y - TF / 2 - 0.045, 0]);
  [-1.9, 1.9].forEach((x) => addMach(new THREE.BoxGeometry(0.1, FEED_Y - 0.1, 0.7), machBodyMat, [x, (FEED_Y - 0.1) / 2, 0]));
  // bâti : flancs + capot (ouvert en façade pour voir la tête de coupe)
  addMach(new THREE.BoxGeometry(1.15, 0.9, 0.06), machBodyMat, [0, FEED_Y + 0.32, -0.43]);
  addMach(new THREE.BoxGeometry(1.15, 0.9, 0.06), machBodyMat, [0, FEED_Y + 0.32, 0.43]);
  addMach(new THREE.BoxGeometry(1.15, 0.1, 0.92), machBodyMat, [0, FEED_Y + 0.82, 0]);
  addMach(new THREE.BoxGeometry(1.15, 0.04, 0.92), machAccentMat, [0, FEED_Y + 0.75, 0]);
  addMach(new THREE.BoxGeometry(0.26, 0.22, 0.05), machBodyMat, [0.32, FEED_Y + 0.4, 0.46]); // pupitre
  // tête de coupe rotative + 4 fers
  const cutterHead = new THREE.Group();
  const cutterCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.78, 20), cutterMat);
  cutterCyl.rotation.x = Math.PI / 2;
  cutterHead.add(cutterCyl);
  for (let k = 0; k < 4; k++) {
    const fer = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.014, 0.78), machSteelMat);
    const a = (k / 4) * Math.PI * 2;
    fer.position.set(Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0);
    fer.rotation.z = a;
    cutterHead.add(fer);
  }
  cutterHead.position.set(0.06, FEED_Y + TF / 2 + 0.1, 0);
  machineGroup.add(cutterHead);
  // rouleaux d'entraînement (entrée / sortie)
  const rollers = [-0.42, 0.44].map((x) => {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.78, 16), machSteelMat);
    r.rotation.x = Math.PI / 2;
    r.position.set(x, FEED_Y + TF / 2 + 0.06, 0);
    r.castShadow = true;
    machineGroup.add(r);
    return r;
  });
  machineGroup.visible = false;
  scene.add(machineGroup);

  /* ---------- planche héroïne : brute (entrée) + rabotée (sortie), plans de coupe ---------- */
  const CLIP_ROUGH = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.06); // garde x < 0.06
  const CLIP_FINAL = new THREE.Plane(new THREE.Vector3(1, 0, 0), -0.06); // garde x > 0.06
  const roughTexOff = [Math.random() * 0.4, Math.random() * 0.4];
  const roughFaceMat = new THREE.MeshStandardMaterial({ map: sawnTex.clone(), roughness: 0.9, metalness: 0, color: DRY.clone() });
  roughFaceMat.map.offset.set(roughTexOff[0], roughTexOff[1]);
  applyCC0(texLoader, CC0_TEXTURES.sawnWood, roughFaceMat, 'map', [2, 1], maxAniso, texSwaps, roughTexOff);
  const roughEndMat = new THREE.MeshStandardMaterial({ map: sharedEndTex, roughness: 0.9, color: DRY.clone() });
  const roughHero = new THREE.Mesh(
    new THREE.BoxGeometry(LOG_LEN * 0.93, T, UNIFORM_W * 0.97),
    [roughEndMat, roughEndMat, roughFaceMat, roughFaceMat, roughFaceMat, roughFaceMat]
  );
  roughHero.castShadow = true; roughHero.receiveShadow = true;
  roughHero.visible = false;
  scene.add(roughHero);

  const finalMat = new THREE.MeshStandardMaterial({
    map: planedTex, color: PLANED.clone(), roughness: 0.34, metalness: 0.03, envMapIntensity: 0.85,
  });
  applyCC0(texLoader, CC0_TEXTURES.planedWood, finalMat, 'map', [2, 1], maxAniso, texSwaps);
  const finalBoard = new THREE.Mesh(chamferedBoard(LOG_LEN * 0.93, TF, UNIFORM_W * 0.97, 0.012), finalMat);
  finalBoard.castShadow = true; finalBoard.receiveShadow = true;
  finalBoard.visible = false;
  scene.add(finalBoard);

  /* ---------- colis de planches (expédition) ---------- */
  const PLANK_L = LOG_LEN * 0.93, PLANK_T = TF, PLANK_W = UNIFORM_W * 0.97;
  const bundleMat = new THREE.MeshStandardMaterial({
    map: planedTex.clone(), color: PLANED.clone(), roughness: 0.34, metalness: 0.03, envMapIntensity: 0.85,
  });
  applyCC0(texLoader, CC0_TEXTURES.planedWood, bundleMat, 'map', [2, 1], maxAniso, texSwaps, [0.3, 0.2]);
  const bundleGroup = new THREE.Group();
  bundleGroup.visible = false;
  const bundlePlanks = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(chamferedBoard(PLANK_L, PLANK_T, PLANK_W, 0.012), bundleMat);
    m.position.y = (i + 1) * (PLANK_T + 0.004);
    m.castShadow = true; m.receiveShadow = true;
    bundleGroup.add(m);
    bundlePlanks.push(m);
  }
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x2f3134, roughness: 0.65, metalness: 0.25, transparent: true, opacity: 0 });
  const straps = [-0.85, 0.85].map((x) => {
    const h = PLANK_T * 6 + 0.06;
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, PLANK_W * 1.04), strapMat);
    s.geometry.translate(0, -h / 2, 0);
    s.position.set(x, h - PLANK_T * 0.6, 0);
    s.castShadow = true;
    s.visible = false;
    bundleGroup.add(s);
    return s;
  });
  scene.add(bundleGroup);

  /* ---------- camion plateau détaillé ---------- */
  const truckGroup = new THREE.Group();
  truckGroup.visible = false;
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5a6066, roughness: 0.38, metalness: 0.55, envMapIntensity: 1.3 });
  const cabDarkMat = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.45, metalness: 0.5, envMapIntensity: 1.1 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x11161a, roughness: 0.08, metalness: 0.75, envMapIntensity: 1.6 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x141516, roughness: 0.95 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x8e9295, roughness: 0.3, metalness: 0.85 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.5, metalness: 0.2 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x62676b, roughness: 0.6, metalness: 0.4, envMapIntensity: 1.1 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff3d6, roughness: 0.3, emissive: 0xffe9b0, emissiveIntensity: 0.7 });

  const addTruckPart = (geo, mat, pos, rot) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    m.castShadow = true; m.receiveShadow = true;
    truckGroup.add(m);
    return m;
  };

  const BED_TOP = 1.02;
  // châssis : longerons, traverses, réservoir, échappement
  [-0.35, 0.35].forEach((z) => addTruckPart(new THREE.BoxGeometry(7.4, 0.14, 0.09), cabDarkMat, [0.3, 0.72, z]));
  [-2.2, 0.3, 2.6].forEach((x) => addTruckPart(new THREE.BoxGeometry(0.1, 0.12, 0.78), cabDarkMat, [x, 0.72, 0]));
  addTruckPart(new THREE.CylinderGeometry(0.17, 0.17, 0.68, 16), rimMat, [-1.35, 0.56, 0.62], [Math.PI / 2, 0, Math.PI / 2]); // réservoir
  addTruckPart(new THREE.CylinderGeometry(0.055, 0.055, 1.15, 10), cabDarkMat, [-1.78, 1.32, -0.72]); // échappement
  addTruckPart(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 10), rimMat, [-1.78, 1.93, -0.72]);
  // plateau + dosseret + ridelles
  addTruckPart(new THREE.BoxGeometry(5.6, 0.1, 1.5), deckMat, [1.25, BED_TOP - 0.05, 0]);
  addTruckPart(new THREE.BoxGeometry(0.12, 0.95, 1.5), bodyMat, [-1.6, BED_TOP + 0.47, 0]);
  [-0.62, 0.62].forEach((z) => addTruckPart(new THREE.BoxGeometry(5.5, 0.1, 0.06), bodyMat, [1.25, BED_TOP + 0.08, z * 1.2]));
  // cabine : volume, pare-brise incliné, vitres latérales, déflecteur de toit
  addTruckPart(new THREE.BoxGeometry(2.0, 1.35, 1.58), bodyMat, [-2.88, 1.5, 0]);
  addTruckPart(new THREE.BoxGeometry(0.1, 0.68, 1.44), glassMat, [-3.9, 1.84, 0], [0, 0, 0.18]);
  [-0.8, 0.8].forEach((z) => addTruckPart(new THREE.BoxGeometry(1.35, 0.5, 0.05), glassMat, [-2.72, 1.82, z]));
  addTruckPart(new THREE.BoxGeometry(1.4, 0.34, 1.3), bodyMat, [-2.55, 2.32, 0], [0, 0, 0.24]); // déflecteur
  addTruckPart(new THREE.BoxGeometry(2.04, 0.1, 1.64), stripeMat, [-2.88, 1.06, 0]); // bandeau accent
  // face avant : calandre à lames, pare-chocs, phares
  addTruckPart(new THREE.BoxGeometry(0.14, 0.55, 1.35), cabDarkMat, [-3.95, 1.06, 0]);
  [1.18, 1.0, 0.88].forEach((y) => addTruckPart(new THREE.BoxGeometry(0.16, 0.045, 1.2), rimMat, [-3.96, y, 0]));
  addTruckPart(new THREE.BoxGeometry(0.28, 0.3, 1.7), cabDarkMat, [-3.94, 0.52, 0]); // pare-chocs
  [-0.62, 0.62].forEach((z) => addTruckPart(new THREE.BoxGeometry(0.1, 0.12, 0.26), lightMat, [-4.06, 0.66, z]));
  // rétroviseurs + marchepieds
  [-1, 1].forEach((s) => {
    addTruckPart(new THREE.BoxGeometry(0.04, 0.04, 0.3), cabDarkMat, [-3.75, 2.05, s * 0.94]);
    addTruckPart(new THREE.BoxGeometry(0.05, 0.34, 0.16), glassMat, [-3.75, 1.86, s * 1.1]);
    addTruckPart(new THREE.BoxGeometry(0.5, 0.06, 0.28), cabDarkMat, [-2.3, 0.62, s * 0.8]);
    addTruckPart(new THREE.BoxGeometry(0.5, 0.06, 0.28), cabDarkMat, [-2.3, 0.4, s * 0.8]);
  });

  // roues : pneu torique à épaulement rond, jante, moyeu, rayons
  const wheels = [];
  const tireGeo = new THREE.TorusGeometry(0.3, 0.125, 12, 26);
  const rimDiscGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.2, 18);
  const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.24, 12);
  const spokeGeo = new THREE.BoxGeometry(0.05, 0.24, 0.03);
  [-3.0, 1.7, 2.85].forEach((x) => {
    [-1, 1].forEach((s) => {
      const w = new THREE.Group();
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      const rimDisc = new THREE.Mesh(rimDiscGeo, rimMat);
      rimDisc.rotation.x = Math.PI / 2;
      const hub = new THREE.Mesh(hubGeo, rimMat);
      hub.rotation.x = Math.PI / 2;
      w.add(tire, rimDisc, hub);
      for (let k = 0; k < 5; k++) {
        const sp = new THREE.Mesh(spokeGeo, cabDarkMat);
        sp.rotation.z = (k / 5) * Math.PI * 2;
        sp.position.set(Math.sin(sp.rotation.z) * -0.09, Math.cos(sp.rotation.z) * 0.09, 0.06);
        w.add(sp);
      }
      w.position.set(x, 0.425, s * 0.78);
      truckGroup.add(w);
      wheels.push(w);
    });
  });
  scene.add(truckGroup);

  /* ---------- particules : sciure · vapeur · copeaux ---------- */
  const spriteTex = canvasTexture((ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }, 64, 64);

  function particleSystem(count, color, size, spread) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3), seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread[0];
      pos[i * 3 + 1] = Math.random() * spread[1];
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2];
      seed[i] = Math.random();
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color, size, map: spriteTex, alphaMap: spriteTex, transparent: true,
      opacity: 0, depthWrite: false, sizeAttenuation: true, blending: THREE.NormalBlending,
    });
    const pts = new THREE.Points(geo, mat);
    pts.visible = false;
    scene.add(pts);
    return { pts, geo, mat, seed, count };
  }
  const dust = particleSystem(160, 0xe0c193, 0.028, [0.9, 1.3, 1.1]);
  const vapor = particleSystem(120, 0xd3dde2, 0.1, [LOG_LEN * 0.75, 1.0, 0.55]);
  const chips = particleSystem(80, 0xf0dcb4, 0.05, [0.5, 0.35, 0.55]);

  /* ---------- progression ---------- */
  const camTarget = new THREE.Vector3(0, 0.5, 0);
  const camBase = new THREE.Vector3();
  const keyPos = new THREE.Vector3();
  let stepIndex = 0, progress = 0, target = 0;
  let planingActive = false;

  function applyProgress(p) {
    progress = clamp(p, 0, 1);
    p = progress;
    const t1 = stageT(p, 1), t2 = stageT(p, 2), t3 = stageT(p, 3), t4 = stageT(p, 4), t5 = stageT(p, 5);

    /* caméra : travelling orbital continu */
    const angle = -0.55 + p * params.cameraSweep - smooth(t5) * 0.95;
    const radius = lerp(4.9, 4.1, smooth(p)) - smooth(t4) * 0.35 + smooth(t5) * 6.4;
    const height = lerp(2.0, 1.35, smooth(clamp(p * 1.25, 0, 1))) + smooth(t4) * 0.55 + smooth(t5) * 1.9;
    camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    const focusY = lerp(R_BUTT, 0.5, smooth(clamp((p - 0.16) * 3, 0, 1))) + smooth(t4) * 0.5 + smooth(t5) * 0.65;
    camTarget.set(camera.aspect > 1.1 ? lerp(0.3, 0.5, smooth(t5)) : 0, focusY, 0);
    camera.lookAt(camTarget);
    camBase.copy(camera.position);

    /* ambiance par étape : rasante sur la grume, voilée au séchage */
    const raking = 1 - ramp(p, 0.1, 0.2);
    keyPos.lerpVectors(KEY_BASE, KEY_RAKING, raking);
    key.position.copy(keyPos);
    const dry = smooth(t3);
    const dryBell = Math.sin(dry * Math.PI) * (p < BOUNDS[4] ? 1 : 0);
    fillLight.intensity = 0.6 + dryBell * 0.35;
    hemi.intensity = 0.4 + dryBell * 0.15;
    fog.density = 0.05 + dryBell * 0.012;

    /* 1 — parc à grumes */
    const sweep = smooth(t1);
    logGroup.rotation.y = 0.05 + smooth(stageT(p, 0)) * 0.1;
    const logFade = 1 - ramp(sweep, 0.45, 0.95);
    barkMat.opacity = logFade;
    endMat.opacity = logFade;
    knotCoreMat.opacity = logFade;
    mossMat.opacity = logFade * 0.92;
    lichenMat.opacity = logFade * 0.85;
    barkLossMat.opacity = logFade;
    logGroup.visible = logFade > 0.01;

    /* 2 — sciage : le cadre multi-lames traverse la grume, les tranches s'ouvrent derrière lui */
    const sawing = p >= BOUNDS[1] - 0.002 && p < BOUNDS[2];
    sawGroup.visible = sawing;
    const sawOp = sawing ? ramp(t1, 0, 0.06) * (1 - ramp(t1, 0.93, 1)) : 0;
    sawFrameMat.opacity = sawOp;
    sawAccentMat.opacity = sawOp;
    sawBladeMat.opacity = sawOp * 0.95;
    const sawSweepX = lerp(-LOG_LEN * 0.72, LOG_LEN * 0.72, sweep);
    if (sawing) {
      sawGroup.position.x = sawSweepX;
      dust.pts.visible = params.particles && t1 > 0.04 && t1 < 0.96;
      if (dust.pts.visible) {
        dust.mat.opacity = 0.55 * Math.sin(sweep * Math.PI);
        dust.pts.position.set(sawSweepX - 0.2, R_BUTT * 0.4, 0);
      }
    } else {
      dust.pts.visible = false;
    }

    /* 3 — empilage planche par planche (+ délignage) · 4 — séchage (teinte continue) */
    const stackSink = p >= BOUNDS[4] ? smooth(clamp((t4 - 0.02) * 5, 0, 1)) * 0.9 : 0;
    const stackFade = p >= BOUNDS[4] ? 1 - smooth(clamp(t4 * 7, 0, 1)) : 1;
    boards.forEach((b, i) => {
      const born = ramp(sweep, 0.1, 0.45);
      const visible = (p >= BOUNDS[1] && born > 0.01) || p >= BOUNDS[2];
      if (!visible) { b.mesh.visible = false; return; }

      // dépôt une par une sur la pile (ordre bas → haut)
      const s = ramp(t2, i * 0.115, i * 0.115 + 0.31);
      const rot = smooth(s);
      const fanZ = b.sliceZ * (1 + 0.8 * sweep);
      const py = lerp(R_BUTT, b.stackY, rot) + Math.sin(rot * Math.PI) * 0.42 - stackSink;
      const pz = lerp(fanZ, 0, rot);
      b.mesh.position.set(0, py, pz);
      b.mesh.rotation.x = (1 - rot) * Math.PI / 2;
      b.mesh.rotation.y = 0;
      // délignage : la largeur en plot devient calibrée pendant la manutention
      b.mesh.scale.z = lerp(b.chordScale, 1, ramp(s, 0.45, 0.9));
      b.mesh.scale.y = 1 - dry * 0.04;

      let op = p >= BOUNDS[2] ? 1 : born;
      op *= stackFade;
      if (i === HERO && p >= BOUNDS[4]) op *= 1 - ramp(t4, 0, 0.05); // la héroïne est prélevée
      if (p >= BOUNDS[5]) op = 0;
      const solid = op > 0.995;
      b.faceMat.opacity = op; b.bottomMat.opacity = op; b.endFace.opacity = op;
      b.faceMat.transparent = b.bottomMat.transparent = b.endFace.transparent = !solid;
      // séchage : humide foncé saturé → sec pâle homogène ; le grain individuel s'estompe
      const jitterNow = lerp(b.jitter, 1, dry * 0.7);
      b.faceMat.color.copy(WET).lerp(DRY, dry).multiplyScalar(jitterNow);
      b.bottomMat.color.copy(b.faceMat.color).multiplyScalar(0.72);
      b.endFace.color.copy(WET).lerp(DRY, dry).multiplyScalar(jitterNow);
      b.faceMat.roughness = lerp(0.72, 0.95, dry); // luisant humide → mat sec
      b.mesh.castShadow = solid;
      b.mesh.visible = op > 0.05;
    });

    stickerMat.opacity = ramp(t2, 0.25, 0.55) * stackFade;
    stickers.forEach((s) => {
      // les baguettes apparaissent couche après couche, juste après la planche du dessus
      const layerT = ramp(t2, (s.layer + 1) * 0.115 + 0.18, (s.layer + 1) * 0.115 + 0.3);
      const vis = layerT > 0.02 && stackFade > 0.05 && p >= BOUNDS[2] - 0.001 && p < BOUNDS[5];
      s.mesh.visible = vis;
      if (vis) {
        s.mesh.scale.setScalar(Math.max(layerT, 0.001));
        s.mesh.position.set(s.x, s.y - stackSink, 0);
      }
    });
    bearerMat.opacity = ramp(t2, 0.02, 0.2) * stackFade;
    bearers.forEach((b) => {
      b.visible = bearerMat.opacity > 0.05 && p >= BOUNDS[2] - 0.001 && p < BOUNDS[5];
      b.position.y = 0.05 - stackSink;
    });

    /* 4 — vapeur de séchage */
    const vaporOn = params.particles && p > BOUNDS[3] - 0.02 && p < BOUNDS[4];
    vapor.pts.visible = vaporOn;
    if (vaporOn) { vapor.mat.opacity = 0.35 * Math.sin(dry * Math.PI); vapor.pts.position.y = 0.15; }

    /* 5 — rabotage : la planche traverse la machine, brute à l'entrée, lisse à la sortie */
    const inRabotage = p >= BOUNDS[4] && p < BOUNDS[5];
    planingActive = inRabotage;
    const machOp = (p >= BOUNDS[4] && p < BOUNDS[5] + 0.06)
      ? ramp(t4, 0, 0.08) * (1 - ramp(t5, 0, 0.16)) : 0;
    machineGroup.visible = machOp > 0.01;
    machineMats.forEach((m) => { m.opacity = machOp; });

    const pickup = ramp(t4, 0, 0.12);
    const heroPassT = ramp(t4, 0.12, 0.94);
    const heroX = lerp(-2.35, 2.35, heroPassT);

    if (inRabotage) {
      roughHero.visible = heroPassT < 0.999;
      const fromY = boards[HERO].stackY;
      if (pickup < 1) {
        roughHero.position.set(
          lerp(0, -2.35, pickup),
          lerp(fromY, FEED_Y, pickup) + Math.sin(pickup * Math.PI) * 0.35,
          0
        );
      } else {
        roughHero.position.set(heroX, FEED_Y, 0);
      }
      roughHero.rotation.y = 0;
      [roughFaceMat, roughEndMat].forEach((m) => { m.clippingPlanes = pickup >= 1 ? [CLIP_ROUGH] : null; });
      finalMat.clippingPlanes = [CLIP_FINAL];
      finalBoard.visible = heroPassT > 0.02;
      finalBoard.position.set(heroX, FEED_Y, 0);
      finalBoard.rotation.y = 0;
      roughFaceMat.color.copy(DRY);
      roughEndMat.color.copy(DRY);
      chips.pts.visible = params.particles && heroPassT > 0.08 && heroPassT < 0.92;
      if (chips.pts.visible) {
        chips.mat.opacity = 0.65 * Math.sin(heroPassT * Math.PI);
        chips.pts.position.set(0.62, FEED_Y - 0.04, 0);
      }
    } else {
      roughHero.visible = false;
      if (p < BOUNDS[4] || p >= BOUNDS[5]) chips.pts.visible = false;
      finalMat.clippingPlanes = null;
      [roughFaceMat, roughEndMat].forEach((m) => { m.clippingPlanes = null; });
    }

    /* 6 — expédition : colis cerclé + camion détaillé + chargement */
    const shipping = p >= BOUNDS[5];
    bundleGroup.visible = shipping;
    truckGroup.visible = shipping;
    finalBoard.visible = shipping || (inRabotage && heroPassT > 0.02);
    if (shipping) {
      finalMat.clippingPlanes = null;
      bundlePlanks.forEach((m, i) => {
        const delay = i * 0.05;
        const s = ramp(t5, 0.02 + delay, 0.26 + delay);
        m.position.y = lerp(0, (i + 1) * (PLANK_T + 0.004), s);
        m.position.x = 0;
        m.position.z = lerp((i % 2 ? 0.06 : -0.06) * (1 - s), 0, s);
      });
      const strapIn = ramp(t5, 0.26, 0.36);
      strapMat.opacity = strapIn;
      strapMat.transparent = strapIn < 0.995;
      straps.forEach((s) => {
        s.visible = strapIn > 0.02;
        s.scale.y = Math.max(strapIn, 0.001);
      });

      const arrive = smooth(clamp((t5 - 0.02) / 0.30, 0, 1));
      const truckX = lerp(-17, 0, arrive);
      truckGroup.position.x = truckX;
      const rolled = (truckX + 17) / 0.425;
      wheels.forEach((w) => { w.rotation.z = -rolled; });

      const load = smooth(clamp((t5 - 0.38) / 0.58, 0, 1));
      const up = smooth(clamp(load / 0.35, 0, 1));
      const over = smooth(clamp((load - 0.25) / 0.45, 0, 1));
      const down = smooth(clamp((load - 0.72) / 0.28, 0, 1));
      const PARK_Z = 2.5, DECK_Y = BED_TOP + PLANK_T * 0.55, HOVER_Y = 2.15;
      const park = smooth(clamp(t5 / 0.22, 0, 1));
      const bx = lerp(lerp(2.35, 0, park), 1.6, over);
      const bz = lerp(lerp(0, PARK_Z, park), 0, over);
      const by = lerp(lerp(lerp(FEED_Y, 0.78, park), HOVER_Y, up), DECK_Y, down);
      finalBoard.position.set(bx, by, bz);
      bundleGroup.position.set(bx, by, bz);
      bundleGroup.rotation.y = 0;
      finalBoard.rotation.y = 0;
    } else {
      strapMat.opacity = 0;
      straps.forEach((s) => { s.visible = false; });
    }

    /* lumière produit sur la fin ; face caméra éclairée pendant machines/camion */
    const machBell = Math.sin(smooth(t4) * Math.PI) * (p < BOUNDS[5] ? 1 : 0);
    frontLight.intensity = machBell * 0.9 + smooth(t5) * 1.5;
    frontLight.position.set(camera.position.x * 1.2, camera.position.y + 2.5, camera.position.z * 1.2);
    frontLight.target.position.set(0, 1, 0);
    key.intensity = params.keyIntensity + raking * 0.5 + smooth(t5) * 0.5;
    rim.intensity = 9 + smooth(t5) * 16;
    accentLight.intensity = params.accentIntensity + smooth(t5) * 2.5;
    renderer.toneMappingExposure = params.exposure + smooth(t5) * 0.03;

    let idx = 0;
    for (let i = 0; i < BOUNDS.length - 1; i++) if (p >= BOUNDS[i]) idx = i;
    stepIndex = idx;
    if (typeof onProgressChange === 'function') onProgressChange(p, stepIndex, STEPS[stepIndex].name);
  }

  /* ---------- boucle ---------- */
  let raf = null;
  const clock = new THREE.Clock();

  function driftParticles(sys, dt, rise, driftAmt, top) {
    if (!sys.pts.visible) return;
    const a = sys.geo.attributes.position;
    for (let i = 0; i < sys.count; i++) {
      let y = a.getY(i) + (rise + sys.seed[i] * rise * 0.8) * dt;
      if (y > top) y = 0;
      if (y < 0) y = top;
      a.setY(i, y);
      a.setX(i, a.getX(i) + Math.sin(clock.elapsedTime * 0.8 + sys.seed[i] * 9) * driftAmt * dt);
    }
    a.needsUpdate = true;
  }

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const el = clock.elapsedTime;

    if (!simplified) {
      if (params.smoothing > 0.001) {
        const k = 1 - Math.pow(1 - params.smoothing, dt * 60);
        const next = progress + (target - progress) * k;
        if (Math.abs(target - progress) > 0.00015) applyProgress(next);
        else if (progress !== target) applyProgress(target);
      } else if (progress !== target) {
        applyProgress(target);
      }
    }

    if (simplified) {
      logGroup.rotation.y = el * 0.16;
      camera.position.set(Math.sin(el * 0.16) * 4.4, 1.8, Math.cos(el * 0.16) * 4.4);
      camera.lookAt(0, R_BUTT, 0);
    } else {
      camera.position.set(
        camBase.x + Math.sin(el * 0.35) * 0.012,
        camBase.y + Math.sin(el * 0.27 + 1.4) * 0.008,
        camBase.z
      );
      camera.lookAt(camTarget);
      // lames du cadre qui oscillent, tête de coupe et rouleaux qui tournent
      if (sawGroup.visible) {
        sawBlades.forEach((b, k) => { b.position.y = 1.02 + Math.sin(el * 34 + k * 0.9) * 0.07; });
      }
      if (machineGroup.visible) {
        cutterHead.rotation.z = el * (planingActive ? 26 : 8);
        rollers.forEach((r, k) => { r.rotation.y = el * 5 * (k ? 1 : -1); });
      }
      driftParticles(dust, dt, -0.35, 0.06, 1.4);
      driftParticles(vapor, dt, 0.16, 0.05, 1.6);
      driftParticles(chips, dt, -0.5, 0.09, 0.35);
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  function onResize() {
    const w = container.clientWidth, h = container.clientHeight || window.innerHeight;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    applyProgress(progress);
  }
  window.addEventListener('resize', onResize);

  let scrollHandler = null;
  if (!manualScroll && !simplified) {
    const wrapper = container.closest('[data-tree-scroll-wrapper]') || container.parentElement;
    let queued = false;
    const update = () => {
      queued = false;
      const rect = wrapper.getBoundingClientRect();
      const total = wrapper.offsetHeight - window.innerHeight;
      target = clamp(total > 0 ? -rect.top / total : 0, 0, 1);
    };
    scrollHandler = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', scrollHandler, { passive: true });
    update();
  } else {
    applyProgress(0);
  }

  /* ---------- API publique ---------- */
  function setProgress(p, immediate) {
    target = clamp(p, 0, 1);
    if (immediate || params.smoothing <= 0.001 || simplified) applyProgress(target);
  }

  function setParams(next = {}) {
    Object.assign(params, next);
    camera.fov = params.fov;
    camera.updateProjectionMatrix();
    barkMat.bumpScale = params.bumpScale;
    barkMat.needsUpdate = true;

    const tint = TINTS[params.woodTint] || TINTS.ambre;
    WET.set(tint[0]); DRY.set(tint[1]); PLANED.set(tint[2]);
    finalMat.color.copy(PLANED);
    bundleMat.color.copy(PLANED);

    texSwaps.forEach(({ material, slot, proc, procBump, cc0: tex }) => {
      material[slot] = params.useCC0 ? tex : proc;
      if (slot === 'normalMap' && !params.useCC0) material.bumpMap = procBump;
      if (slot === 'normalMap' && params.useCC0) material.bumpMap = null;
      material.needsUpdate = true;
    });

    if (!params.particles) { dust.pts.visible = vapor.pts.visible = chips.pts.visible = false; }
    applyProgress(progress);
    return params;
  }

  applyProgress(0);
  tick();

  return {
    setProgress,
    setParams,
    getParams: () => ({ ...params }),
    getProgress: () => progress,
    getStepName: () => STEPS[stepIndex].name,
    steps: STEPS.map((s) => s.name),
    isSimplified: simplified,
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    },
  };
}
