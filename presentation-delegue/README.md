# Présentation de campagne — « Nael, la voix de la T4 »

Présentation 3D immersive pour l'élection des délégués de Terminale 4.
**Pour l'utiliser le jour J, tout est dans [`MEMO.md`](MEMO.md).** Ce fichier-ci
décrit le code.

## Le livrable

`index.html`, à la racine de ce dossier : **un seul fichier autonome**. Il
contient three.js, GSAP, les polices Anton et Rubik en base64 et toute la mise
en scène. Il s'ouvre par un double-clic, sans serveur et sans Internet — la
contrainte de départ étant un PC de lycée dont le Wi-Fi peut lâcher.

Les sons ne sont pas embarqués : ils sont **synthétisés à l'exécution** avec la
Web Audio API (`src/sono.js`). C'est ce qui garde le fichier sous 1 Mo et écarte
toute question de droits sur la musique.

## Fabriquer le fichier

```bash
npm install
npm run build      # écrit index.html
```

Le build (`build.mjs`) tient en une passe : esbuild empaquette `src/main.js`,
puis les polices et la feuille de style sont inlinées dans le gabarit HTML.

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `src/contenu.js` | **Tout le texte** : messages, clins d'œil, notes à l'oral. Le seul fichier à toucher pour corriger le fond. |
| `src/main.js` | Enchaînement des étapes, clavier, HUD, notes, écran de démarrage |
| `src/monde.js` | Rendu, caméra, post-traitement, mode performance |
| `src/sono.js` | Toute la bande-son, synthétisée |
| `src/ciel.js` | Fond permanent accroché à la caméra |
| `src/scenes/*.js` | Une scène = un lieu du voyage |
| `src/repli.js` | Version 2D de secours si WebGL manque |
| `src/outils.js` | Échantillonnage de texte en points, textures de texte |

Une **étape** (une pression sur →) est décrite dans `ETAPES` : la scène
concernée, son « beat », le texte du panneau et les notes à l'oral. Plusieurs
étapes peuvent partager une scène : c'est ce qui permet de dérouler les quatre
points du programme sans changer de lieu.

## Conventions

- Tout est en français, code et commentaires compris.
- Les couleurs vivent dans `src/palette.js` (3D) et `:root` de `src/style.css`
  (DOM). Jamais de valeur en dur ailleurs.
- **Le texte lisible est en DOM, pas en 3D.** Une texture de texte bave sur un
  vidéoprojecteur ; le DOM reste net. La 3D porte les objets, la typographie
  reste au-dessus.
- Le texte occupe la colonne de gauche, le sujet 3D la moitié droite. Les
  fonctions `poseDe()` des scènes calculent leur cadrage pour respecter ça.
- Toute animation passe par la timeline GSAP de la scène, jamais par une
  animation CSS : sinon elle ne sait ni se rembobiner, ni se figer, ni sauter à
  son état final quand on avance pendant qu'elle joue.

## Vérification

`.captures/` contient le harnais Playwright utilisé pendant la construction :

```bash
node .captures/capture.mjs etapes 1280 720 1     # une image par étape
node .captures/intro.mjs 0.7 2.4 5.2             # l'intro figée à des instants précis
node .captures/parcours.mjs                      # parcours complet + contrôles
```

Note : l'environnement de test rend en logiciel (SwiftShader). Au-delà de
640×360, la plongée de l'intro le fait tomber — c'est une limite du rendu
logiciel, pas du code. Les captures d'intro se font donc en petit format, et
`?perf=1` force le rendu allégé.

## Paramètres d'URL (mise au point uniquement)

- `?etape=5` — se placer directement sur une étape
- `?perf=1` — forcer le mode performance
