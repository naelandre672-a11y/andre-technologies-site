/**
 * Tout le texte de la présentation, au même endroit.
 *
 * Séparé du code de mise en scène pour que le contenu se relise et se corrige
 * sans toucher à la 3D. `notes` = ce que Nael dit à l’oral (touche N), calibré
 * pour un total d’environ 1 min 30.
 */

export const SLOGAN = 'La voix de la T4';
export const NOM = 'NAEL';

/**
 * Les étapes de la présentation, dans l’ordre. Une flèche droite = une étape.
 * Plusieurs étapes peuvent partager la même scène 3D (la caméra ne bouge alors
 * que légèrement) : c’est ce qui permet de dérouler un argument en plusieurs
 * temps sans casser le voyage.
 */
export const ETAPES = [
  {
    scene: 'intro',
    beat: 0,
    hud: false,
    notes:
      "— Ne rien dire. Laisser l’intro tourner (8 s). Attendre la fin du slogan, " +
      'puis appuyer sur la flèche droite.',
  },
  {
    scene: 'couloir',
    beat: 0,
    titre: 'Année décisive',
    panneau: {
      surtitre: 'Terminale 4',
      titre: 'Année<br><em>décisive</em>',
      texte: 'Bac, Parcoursup, conseils de classe : cette année, tout compte double.',
    },
    notes:
      "Cette année, c’est la Terminale. Le bac, Parcoursup, et des conseils de " +
      'classe qui partent directement dans nos dossiers. Autant dire que cette ' +
      "année-là, on n’élit pas ses délégués au hasard.",
  },
  {
    scene: 'programme',
    beat: 0,
    titre: 'Porte-parole',
    panneau: {
      surtitre: 'Mon programme — 01',
      titre: 'Porte-<br>parole',
      texte: "Je n’ai pas peur d’aller parler aux profs pour porter vos questions et vos demandes.",
    },
    notes:
      'Premier point : je suis votre porte-parole. Aller voir un prof pour poser ' +
      'vos questions ou porter une demande de la classe, ça ne me fait pas peur. ' +
      "Vous me le dites, je le dis — et je vous rapporte la réponse.",
  },
  {
    scene: 'programme',
    beat: 1,
    titre: 'Ultra réactif',
    panneau: {
      surtitre: 'Mon programme — 02',
      titre: 'Ultra<br><em>réactif</em>',
      texte: 'Mails et messages : réponse quasi immédiate, pas la semaine prochaine.',
      clin: "Je réponds plus vite que la file de la cantine n’avance.",
    },
    notes:
      'Deuxième point : je réponds. Aux mails, aux messages, tout de suite. ' +
      "Je réponds plus vite que la file de la cantine n’avance.",
  },
  {
    scene: 'programme',
    beat: 2,
    titre: 'Organisateur',
    panneau: {
      surtitre: 'Mon programme — 03',
      titre: 'Organi-<br>sateur',
      texte: "Un cours ou un contrôle à déplacer ? Je m\u2019en occupe, tout de suite.",
      clin: 'Trois contrôles le même jour ? Pas sous mon mandat.',
    },
    notes:
      "Troisième point : j’organise. Un contrôle à déplacer, un cours à décaler, " +
      'je m’en occupe. Trois contrôles le même jour ? Pas sous mon mandat.',
  },
  {
    scene: 'programme',
    beat: 3,
    titre: 'Médiateur',
    panneau: {
      surtitre: 'Mon programme — 04',
      titre: 'Média-<br>teur',
      texte: 'Je règle les conflits, entre profs et élèves comme entre élèves.',
    },
    notes:
      'Quatrième point : je règle les conflits. Entre les profs et les élèves, ' +
      'et entre nous. Sans prendre parti, et sans que ça monte.',
  },
  {
    scene: 'parcoursup',
    beat: 0,
    titre: 'Parcoursup',
    panneau: {
      surtitre: 'Parcoursup',
      titre: 'Personne<br>à la <em>traîne</em>',
      texte: 'De la recherche de formations jusqu\u2019aux réponses, je suis là pour tout le monde.',
    },
    notes:
      'Parcoursup, maintenant. Je vous accompagne du début à la fin : chercher ' +
      'les formations, formuler les vœux, soigner le dossier, et encaisser les ' +
      'réponses. Le but, c’est que chacun soit content de son orientation. ' +
      'Personne à la traîne.',
  },
  {
    scene: 'conseil',
    beat: 0,
    titre: 'Conseil de classe',
    panneau: {
      surtitre: 'Conseil de classe',
      titre: 'Je prends<br>la parole',
      texte: 'Sans peur, pour défendre mes camarades et plaider leur cause.',
    },
    notes:
      'Au conseil de classe, je prends la parole. Sans trembler. Pour défendre ' +
      'chacun d’entre vous et expliquer ce que les notes ne disent pas.',
  },
  {
    scene: 'quiz',
    beat: 0,
    titre: 'Le quiz',
    panneau: {
      haut: true,
      surtitre: 'À vous de jouer',
      titre: "Le délégué idéal,<br>c\u2019est quelqu\u2019un qui…",
    },
    notes:
      'Petit test. Le délégué idéal, c’est quelqu’un qui… A, B, ou C ? ' +
      '(laisser la classe répondre à voix haute, puis appuyer sur C ou sur la ' +
      'flèche droite)',
  },
  {
    scene: 'quiz',
    beat: 1,
    titre: 'Réponse C',
    notes: 'Réponse C. Évidemment.',
  },
  {
    scene: 'final',
    beat: 0,
    titre: 'Au vote',
    notes:
      'Alors au moment de voter, une seule case à cocher. Nael, la voix de la T4. ' +
      'Merci !',
  },
];

/** Panneaux flottants du couloir. */
export const PANNEAUX = ['BAC', 'PARCOURSUP', 'CONSEILS'];

/** Les quatre monolithes du programme. */
export const CARTES = [
  {
    cle: 'megaphone',
    titre: 'Porte-parole',
    texte: "Je n’ai pas peur d’aller parler aux profs pour porter vos questions.",
    clin: null,
  },
  {
    cle: 'enveloppe',
    titre: 'Ultra réactif',
    texte: 'Mails et messages : réponse quasi immédiate.',
    clin: "Je réponds plus vite que la file de la cantine n’avance.",
  },
  {
    cle: 'calendrier',
    titre: 'Organisateur',
    texte: 'Un contrôle ou un cours à déplacer ? Je m’en occupe.',
    clin: 'Trois contrôles le même jour ? Pas sous mon mandat.',
  },
  {
    cle: 'poignee',
    titre: 'Médiateur',
    texte: 'Je règle les conflits, entre profs et élèves comme entre élèves.',
    clin: null,
  },
];

/** Les quatre étapes du chemin Parcoursup. */
export const PARCOURS = [
  { num: '01', titre: 'Explorer', texte: 'Trouver les formations qui vous vont' },
  { num: '02', titre: 'Formuler ses vœux', texte: 'Sans se tromper de case' },
  { num: '03', titre: 'Soigner son dossier', texte: 'Projet motivé, relu, solide' },
  { num: '04', titre: 'Les réponses', texte: 'Et on gère ensemble' },
];

/** Ce qui s’écrit lettre par lettre dans la bulle du conseil de classe. */
export const PLAIDOIRIE =
  'Madame, Monsieur, je voudrais prendre la défense de mes camarades…';

/** Le quiz. `bonne` désigne la réponse juste. */
export const QUIZ = {
  question: "Le délégué idéal, c’est quelqu’un qui…",
  reponses: [
    { cle: 'A', texte: 'Découvre la date du conseil de classe… le lendemain.' },
    { cle: 'B', texte: 'Répond à vos mails après les vacances d’été.' },
    { cle: 'C', texte: 'Vous défend, répond en 2 min et gère Parcoursup avec vous.' },
  ],
  bonne: 'C',
  verdict: 'Réponse C : Nael !',
};
