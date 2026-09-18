/**
 * Toute la bande-son, synthétisée à l'exécution (Web Audio API).
 *
 * Aucun fichier audio n'est embarqué : d'une part le livrable doit rester un
 * seul HTML raisonnable, d'autre part on est ainsi certain de ne dépendre
 * d'aucune musique protégée. Chaque son est construit à partir d'oscillateurs
 * et d'un buffer de bruit blanc.
 *
 * Deux bus : `musique` (nappes, fanfare — qu'on baisse quand Nael parle) et
 * `effets` (bruitages, toujours au premier plan).
 */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Notes utiles, en Hz. Do majeur, l'accord le plus « vainqueur » qui soit. */
const N = {
  do2: 65.41, sol2: 98.0, la2: 110.0,
  do3: 130.81, mi3: 164.81, fa3: 174.61, sol3: 196.0, la3: 220.0, si3: 246.94,
  do4: 261.63, re4: 293.66, mi4: 329.63, fa4: 349.23, sol4: 392.0, la4: 440.0,
  do5: 523.25, mi5: 659.25, sol5: 783.99, do6: 1046.5,
};

export class Sono {
  constructor() {
    this.ctx = null;
    this.pret = false;
    this.muet = false;
    this._nappe = null;
    this._boucle = null;
  }

  /** Appelé au clic sur « Lancer le show » : les navigateurs l'exigent. */
  async demarrer() {
    if (this.pret) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    // Volontairement sans `await` : sur un contexte encore suspendu (page
    // ouverte sans clic, capture automatisée), la promesse de `resume()` ne se
    // résout jamais et bloquerait tout le démarrage.
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

    const c = this.ctx;
    // Un compresseur en sortie : la fanfare et les confettis tapent fort, on
    // évite la saturation sur les enceintes d'un vidéoprojecteur.
    this.sortie = c.createDynamicsCompressor();
    this.sortie.threshold.value = -14;
    this.sortie.ratio.value = 4;
    this.sortie.attack.value = 0.004;
    this.sortie.release.value = 0.2;

    this.general = c.createGain();
    this.general.gain.value = 1;
    this.general.connect(this.sortie);
    this.sortie.connect(c.destination);

    this.busMusique = c.createGain();
    this.busMusique.gain.value = 0.9;
    this.busMusique.connect(this.general);

    this.busEffets = c.createGain();
    this.busEffets.gain.value = 1;
    this.busEffets.connect(this.general);

    // Une réverbération courte, faite d'un bruit décroissant : donne du volume
    // sans plugin ni fichier d'impulsion.
    this.reverb = c.createConvolver();
    this.reverb.buffer = this._impulsion(1.7, 2.6);
    this.envoiReverb = c.createGain();
    this.envoiReverb.gain.value = 0.34;
    this.envoiReverb.connect(this.reverb);
    this.reverb.connect(this.general);

    this._bruit = this._bufferBruit(2.5);
    this.pret = true;
  }

  _bufferBruit(secondes) {
    const c = this.ctx;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * secondes), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _impulsion(secondes, decroissance) {
    const c = this.ctx;
    const n = Math.floor(c.sampleRate * secondes);
    const buf = c.createBuffer(2, n, c.sampleRate);
    for (let canal = 0; canal < 2; canal++) {
      const d = buf.getChannelData(canal);
      for (let i = 0; i < n; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decroissance);
      }
    }
    return buf;
  }

  get t() { return this.ctx ? this.ctx.currentTime : 0; }

  basculerMuet() {
    this.muet = !this.muet;
    if (this.general) {
      this.general.gain.cancelScheduledValues(this.t);
      this.general.gain.setTargetAtTime(this.muet ? 0 : 1, this.t, 0.05);
    }
    return this.muet;
  }

  /** Brique de base : un oscillateur avec enveloppe ADSR simplifiée. */
  _voix({ type = 'sine', freq = 440, freqFin = null, debut = 0, duree = 0.5,
          gain = 0.2, attaque = 0.005, chute = null, bus = null, detune = 0,
          reverb = 0, courbe = 'exp' } = {}) {
    if (!this.pret) return null;
    const c = this.ctx;
    const t0 = this.t + debut;
    const osc = c.createOscillator();
    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqFin !== null) {
      if (courbe === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqFin), t0 + duree);
      else osc.frequency.linearRampToValueAtTime(freqFin, t0 + duree);
    }
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + attaque);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(attaque + 0.01, chute ?? duree));
    osc.connect(g);
    g.connect(bus || this.busEffets);
    if (reverb > 0) {
      const r = c.createGain();
      r.gain.value = reverb;
      g.connect(r);
      r.connect(this.envoiReverb);
    }
    osc.start(t0);
    osc.stop(t0 + Math.max(duree, chute ?? duree) + 0.1);
    return { osc, g, t0 };
  }

  /** Brique de base : une salve de bruit filtré. */
  _bruitFiltre({ debut = 0, duree = 0.4, gain = 0.3, type = 'bandpass',
                 f0 = 800, f1 = null, q = 1, bus = null, reverb = 0 } = {}) {
    if (!this.pret) return null;
    const c = this.ctx;
    const t0 = this.t + debut;
    const s = c.createBufferSource();
    s.buffer = this._bruit;
    s.loop = true;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0);
    if (f1 !== null) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + duree);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + Math.min(0.05, duree * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
    s.connect(f); f.connect(g); g.connect(bus || this.busEffets);
    if (reverb > 0) {
      const r = c.createGain(); r.gain.value = reverb;
      g.connect(r); r.connect(this.envoiReverb);
    }
    s.start(t0);
    s.stop(t0 + duree + 0.1);
    return { source: s, filtre: f, g, t0 };
  }

  // ---------------------------------------------------------------- bruitages

  /** Vol de caméra. `force` 0→1. */
  whoosh(force = 1, debut = 0) {
    const d = 0.55 + force * 0.5;
    this._bruitFiltre({ debut, duree: d, gain: 0.16 * force, type: 'bandpass',
      f0: 260, f1: 2600, q: 1.1, reverb: 0.5 });
    this._bruitFiltre({ debut: debut + d * 0.45, duree: d * 0.8, gain: 0.11 * force,
      type: 'bandpass', f0: 2200, f1: 180, q: 1.4, reverb: 0.6 });
  }

  /** Bip du compte à rebours. `dernier` = le « 1 », plus aigu. */
  bip(dernier = false, debut = 0) {
    const f = dernier ? N.la4 * 1.5 : N.la4;
    this._voix({ type: 'square', freq: f, debut, duree: 0.13, gain: 0.1, chute: 0.13, reverb: 0.35 });
    this._voix({ type: 'sine', freq: f * 2, debut, duree: 0.09, gain: 0.05, chute: 0.09 });
  }

  /** Montée en puissance avant le drop. */
  riser(duree = 4, debut = 0) {
    if (!this.pret) return;
    this._bruitFiltre({ debut, duree, gain: 0.2, type: 'bandpass', f0: 300, f1: 5200, q: 2.2, reverb: 0.5 });
    // Une sirène en fond qui monte d'une octave et demie.
    this._voix({ type: 'sawtooth', freq: N.do3, freqFin: N.sol4, debut, duree,
      gain: 0.07, attaque: 1.2, chute: duree, bus: this.busMusique, reverb: 0.4 });
    this._voix({ type: 'sawtooth', freq: N.do3 * 1.01, freqFin: N.sol4 * 1.01, debut, duree,
      gain: 0.06, attaque: 1.4, chute: duree, bus: this.busMusique });
    // Un roulement de plus en plus serré.
    let p = debut;
    let ecart = 0.34;
    while (p < debut + duree) {
      this._bruitFiltre({ debut: p, duree: 0.1, gain: 0.08, type: 'lowpass', f0: 220, q: 0.7 });
      p += ecart;
      ecart *= 0.86;
    }
  }

  /** L'impact : le moment où NAEL apparaît. */
  impact(debut = 0) {
    this._voix({ type: 'sine', freq: 130, freqFin: 32, debut, duree: 1.1, gain: 0.62,
      attaque: 0.003, chute: 1.2 });
    this._bruitFiltre({ debut, duree: 1.4, gain: 0.34, type: 'lowpass', f0: 5200, f1: 130, q: 0.8, reverb: 0.9 });
    this._voix({ type: 'triangle', freq: 1800, freqFin: 400, debut, duree: 0.18, gain: 0.16, chute: 0.2 });
  }

  /** Le tampon qui s'écrase. */
  tampon(debut = 0) {
    this._bruitFiltre({ debut, duree: 0.09, gain: 0.34, type: 'highpass', f0: 1400, q: 0.6 });
    this._voix({ type: 'sine', freq: 190, freqFin: 48, debut, duree: 0.34, gain: 0.44, attaque: 0.002, chute: 0.35 });
    this._bruitFiltre({ debut: debut + 0.01, duree: 0.5, gain: 0.16, type: 'lowpass', f0: 900, f1: 120, q: 0.9, reverb: 0.7 });
  }

  /** Petite notification (l'enveloppe, une carte qui s'allume). */
  pop(hauteur = 1, debut = 0) {
    this._voix({ type: 'sine', freq: 420 * hauteur, freqFin: 980 * hauteur, debut,
      duree: 0.14, gain: 0.2, attaque: 0.004, chute: 0.16, reverb: 0.3 });
    this._voix({ type: 'sine', freq: 1400 * hauteur, debut: debut + 0.03, duree: 0.1, gain: 0.07, chute: 0.12 });
  }

  /** Une touche de clavier. */
  clavier(debut = 0) {
    this._bruitFiltre({ debut, duree: 0.035, gain: 0.1 + Math.random() * 0.05,
      type: 'bandpass', f0: 1700 + Math.random() * 900, q: 1.2 });
    this._voix({ type: 'square', freq: 180 + Math.random() * 60, debut, duree: 0.03, gain: 0.03, chute: 0.035 });
  }

  /** Clic mécanique (une place qui s'allume, un jour qui se déplace). */
  clic(debut = 0) {
    this._bruitFiltre({ debut, duree: 0.05, gain: 0.14, type: 'bandpass', f0: 2400, q: 2 });
  }

  /** Mauvaise réponse. */
  buzzer(debut = 0) {
    this._voix({ type: 'square', freq: 116, debut, duree: 0.42, gain: 0.16, attaque: 0.006, chute: 0.45 });
    this._voix({ type: 'square', freq: 109, debut, duree: 0.42, gain: 0.16, attaque: 0.006, chute: 0.45 });
    this._bruitFiltre({ debut, duree: 0.42, gain: 0.08, type: 'lowpass', f0: 700, q: 0.8 });
  }

  /** Une réponse qui explose en morceaux. */
  eclat(debut = 0) {
    this._bruitFiltre({ debut, duree: 0.6, gain: 0.22, type: 'highpass', f0: 900, f1: 3000, q: 0.7, reverb: 0.6 });
    this._voix({ type: 'sine', freq: 160, freqFin: 40, debut, duree: 0.4, gain: 0.3, chute: 0.42 });
  }

  /** Bonne réponse. */
  victoire(debut = 0) {
    const notes = [N.do4, N.mi4, N.sol4, N.do5, N.mi5];
    notes.forEach((f, i) => {
      this._voix({ type: 'triangle', freq: f, debut: debut + i * 0.075, duree: 0.7,
        gain: 0.17, attaque: 0.006, chute: 0.8, reverb: 0.55, bus: this.busEffets });
      this._voix({ type: 'sine', freq: f * 2, debut: debut + i * 0.075, duree: 0.5,
        gain: 0.06, attaque: 0.006, chute: 0.55 });
    });
  }

  /** Cloche claire, pour souligner une étape. */
  cloche(hauteur = 1, debut = 0) {
    this._voix({ type: 'sine', freq: N.do5 * hauteur, debut, duree: 1.1, gain: 0.12,
      attaque: 0.004, chute: 1.2, reverb: 0.7 });
    this._voix({ type: 'sine', freq: N.do5 * hauteur * 2.76, debut, duree: 0.5, gain: 0.03, chute: 0.6 });
  }

  /** Canons à confettis. */
  confettis(debut = 0) {
    for (let i = 0; i < 3; i++) {
      this._bruitFiltre({ debut: debut + i * 0.09, duree: 0.22, gain: 0.2,
        type: 'highpass', f0: 1200, q: 0.6, reverb: 0.5 });
      this._voix({ type: 'sine', freq: 300, freqFin: 90, debut: debut + i * 0.09,
        duree: 0.2, gain: 0.22, chute: 0.22 });
    }
    for (let i = 0; i < 26; i++) {
      this._bruitFiltre({ debut: debut + 0.1 + Math.random() * 1.4, duree: 0.05,
        gain: 0.04, type: 'bandpass', f0: 1800 + Math.random() * 3200, q: 3 });
    }
  }

  // ------------------------------------------------------------------ musique

  /** Nappe grave et tenue. Sert de lit sous l'intro puis sous le final. */
  nappe(actif, cible = 0.18) {
    if (!this.pret) return;
    const c = this.ctx;
    if (actif && !this._nappe) {
      const g = c.createGain();
      g.gain.value = 0.0001;
      g.connect(this.busMusique);
      const r = c.createGain(); r.gain.value = 0.5;
      g.connect(r); r.connect(this.envoiReverb);
      const filtre = c.createBiquadFilter();
      filtre.type = 'lowpass';
      filtre.frequency.value = 900;
      filtre.Q.value = 0.6;
      filtre.connect(g);
      const oscs = [];
      for (const [f, d] of [[N.do2, -6], [N.do2, 6], [N.sol2, -4], [N.do3, 5], [N.mi3, -3], [N.sol3, 4]]) {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = d;
        const og = c.createGain();
        og.gain.value = f > 150 ? 0.06 : 0.12;
        o.connect(og); og.connect(filtre);
        o.start();
        oscs.push(o);
      }
      // Un lent mouvement de filtre pour que ça respire.
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoG = c.createGain();
      lfoG.gain.value = 330;
      lfo.connect(lfoG); lfoG.connect(filtre.frequency);
      lfo.start();
      oscs.push(lfo);
      this._nappe = { g, oscs };
    }
    if (this._nappe) {
      const g = this._nappe.g.gain;
      g.cancelScheduledValues(this.t);
      g.setTargetAtTime(actif ? cible : 0.0001, this.t, actif ? 0.6 : 0.5);
    }
  }

  /** Coupe franchement la musique : Nael commence à parler. */
  musiqueStop(fondu = 1.1) {
    if (!this.pret) return;
    this.nappe(false);
    const g = this.busMusique.gain;
    g.cancelScheduledValues(this.t);
    g.setValueAtTime(g.value, this.t);
    g.linearRampToValueAtTime(0.0001, this.t + fondu);
    if (this._boucle) { clearInterval(this._boucle); this._boucle = null; }
  }

  musiqueReprise(niveau = 0.9, fondu = 0.5) {
    if (!this.pret) return;
    const g = this.busMusique.gain;
    g.cancelScheduledValues(this.t);
    g.setValueAtTime(Math.max(0.0001, g.value), this.t);
    g.linearRampToValueAtTime(niveau, this.t + fondu);
  }

  /** Le « drop » : accord plein + grosse caisse, juste après l'impact. */
  drop(debut = 0) {
    const bus = this.busMusique;
    [N.do3, N.mi3, N.sol3, N.do4, N.sol4].forEach((f, i) => {
      this._voix({ type: 'sawtooth', freq: f, debut, duree: 3.2, gain: 0.09,
        attaque: 0.02, chute: 3.4, bus, reverb: 0.5, detune: (i % 2 ? 7 : -7) });
    });
    this._voix({ type: 'sine', freq: N.do2, debut, duree: 2.6, gain: 0.3, attaque: 0.01, chute: 2.8, bus });
    // Quatre temps de grosse caisse pour lancer le mouvement.
    for (let i = 0; i < 4; i++) {
      this._voix({ type: 'sine', freq: 120, freqFin: 42, debut: debut + i * 0.52,
        duree: 0.22, gain: 0.34, attaque: 0.003, chute: 0.24, bus });
    }
  }

  /** Fanfare du final. */
  fanfare(debut = 0) {
    const bus = this.busMusique;
    this.musiqueReprise(1, 0.15);
    // Mélodie type « sonnerie de victoire » : sol - do - mi - sol - do (aigu).
    const air = [
      [N.sol4, 0.0, 0.18], [N.do5, 0.18, 0.18], [N.mi5, 0.36, 0.18],
      [N.sol5, 0.54, 0.5], [N.mi5, 1.06, 0.16], [N.sol5, 1.24, 1.5],
    ];
    for (const [f, d, dur] of air) {
      [0, 7, -7].forEach((det) => {
        this._voix({ type: 'sawtooth', freq: f, debut: debut + d, duree: dur,
          gain: 0.09, attaque: 0.012, chute: dur * 1.1, bus, detune: det, reverb: 0.5 });
      });
      this._voix({ type: 'square', freq: f / 2, debut: debut + d, duree: dur,
        gain: 0.05, attaque: 0.012, chute: dur, bus });
    }
    // Basse et percussion.
    [[N.do3, 0], [N.sol2, 0.54], [N.do3, 1.24]].forEach(([f, d]) => {
      this._voix({ type: 'sawtooth', freq: f / 2, debut: debut + d, duree: 0.7,
        gain: 0.2, attaque: 0.01, chute: 0.8, bus });
    });
    for (let i = 0; i < 6; i++) {
      this._voix({ type: 'sine', freq: 120, freqFin: 40, debut: debut + i * 0.36,
        duree: 0.2, gain: 0.26, attaque: 0.003, chute: 0.22, bus });
      this._bruitFiltre({ debut: debut + i * 0.36 + 0.18, duree: 0.12, gain: 0.07,
        type: 'highpass', f0: 3800, q: 0.7, bus });
    }
  }
}

export const sono = new Sono();
