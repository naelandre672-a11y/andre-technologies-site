# André Technologies — Refonte du site web

## Contexte
Site vitrine pour André Technologies, entreprise d'ingénierie des industries du
bois (parc à grumes, sciage, séchage, rabotage) et de valorisation énergétique
du bois (chaudières biomasse, cogénération, pellets). Le site actuel
(andre-technologies.fr) est daté ; cette refonte vise un rendu moderne,
interactif, inspiré des standards Apple/Nike.

Projet mené par Nael André (fils du dirigeant), qui apprend le développement
web en construisant ce site. Il gère seul le contenu (mises à jour mensuelles),
d'où le choix d'un **site statique HTML/CSS/JS** plutôt qu'un CMS.

## Système de design (refondu le 29/07/2026)
La première version utilisait Big Shoulders Display + Work Sans + IBM Plex Mono
sur fond quasi-noir avec un seul accent vert : exactement le rendu par défaut
d'une IA. Retour client explicite là-dessus, d'où cette refonte.

**Trois voix typographiques, chacune avec une règle stricte :**
- `--font-structural` — **Archivo**. Tout ce qui structure : navigation, boutons,
  titres des pages métier, libellés. Son axe de chasse variable sert les grands
  titres en capitales élargies (`font-variation-settings:'wdth' 112`), qui
  reprennent le lettrage des plaques signalétiques de machines.
- `--font-editorial` — **Newsreader**. Dessinée pour la presse. Prend le relais
  dès qu'il s'agit de **lire** : veille, articles, chapôs, citations. Le site
  change de voix quand il arrête de vendre et se met à informer.
- `--font-data` — **DM Mono**. Réservée aux **vrais chiffres** : dates, mesures,
  références, compte à rebours, chiffres clés. Plus jamais d'étiquette
  décorative en mono — si c'est en mono, c'est une valeur.

**Couleurs** (dans style.css `:root`) — trois matières prises dans le monde
du client, plutôt qu'un fond noir et un accent :
- `--acier-900/800/700/600` : l'acier des bâtis de machines, plus froid qu'un
  noir neutre.
- `--zinc-400/300/200` : le zinc galvanisé des goulottes et convoyeurs, couleur
  relevée directement sur les installations Springer de la vidéo.
- `--doc` / `--doc-2` / `--doc-3` / `--doc-ink` : le papier d'une documentation
  technique, volontairement froid (et non crème). C'est la surface des pages de
  veille et des articles.
- `--vert-600/500/400` : le vert du logo, redevenu **signal** (nouveauté, état
  actif, lien) et non décoration.
- `--braise` : réservé au bois énergie.

Les anciens noms (`--graphite`, `--oak`, `--birch`...) sont conservés comme
alias pointant vers les nouvelles valeurs, pour ne pas réécrire chaque règle.
- **Logo** : `logo-v2.png`, fond transparent, à utiliser tel quel (ne pas
  recréer de "puce" de fond, contrairement à un ancien essai avec un logo
  sans transparence).

## Fichiers existants
- `index.html` — page d'accueil (hero plein écran, ligne de process
  interactive, tuiles Industrie bois / Bois énergie, section "pourquoi nous",
  CTA contact)
- `bois-energie.html` — page détail Bois énergie (équipements interactifs)
- `industrie-bois.html` — page détail Industrie bois (5 étapes, plus de
  profondeur que l'accueil)
- `bureau-etudes.html` — les 4 phases d'un projet (étude, sélection
  équipements, installation, SAV)
- `contact.html` — formulaire (nom, société, email, téléphone, message,
  case RGPD) + coordonnées + carte Google Maps. **Formulaire pas encore
  connecté** : voir `FORM_ENDPOINT` dans le `<script>` en bas du fichier —
  il faut créer un compte Formspree (ou équivalent) et coller le vrai
  endpoint avant la mise en ligne. En attendant, le formulaire affiche un
  message clair invitant à écrire directement par email.
- `veille.html` — **le cœur de la refonte du 29/07/2026** (voir plus bas).
  Remplace l'ancienne `actualites.html`, supprimée ; une redirection 301 est
  posée dans `_redirects` pour ne pas casser les liens déjà partagés.
- `evenements.html` — agenda des salons + compte à rebours vers le prochain
- `actualite-nouveau-site.html` — premier article réel (annonce du site)
- `actualite-modele.html` — gabarit à dupliquer pour chaque nouvel article
  (non lié depuis la navigation, contient des instructions en commentaire)
- `mentions-legales.html` / `politique-confidentialite.html` — pages
  légales obligatoires. **Contiennent des placeholders en évidence**
  (fond vert, pointillés : `[SIRET]`, `[capital social]`, `[hébergeur]`...)
  à remplacer par les vraies informations de l'entreprise avant publication.
- `style.css` / `script.js` — partagés entre toutes les pages
- `logo-v2.png` — logo officiel, fond transparent

## Effets interactifs déjà en place (à conserver et réutiliser sur les
nouvelles pages, ne pas dupliquer le code — tout est dans script.js/style.css)
- Header qui se compacte au scroll, sous-menus au survol, menu mobile plein écran
- Curseur personnalisé (point + anneau qui suit la souris)
- Cartes avec effet tilt 3D au survol (classe `.tilt`)
- Boutons "magnétiques" qui suivent légèrement le curseur (classe `.magnetic`)
- Apparitions en fondu au scroll (classe `.reveal`, via IntersectionObserver)
- Compteurs animés (`.stat-num` avec `data-count`)
- Showcase à onglets cliquables avec image qui change (`.showcase`, voir
  process sur l'accueil et équipements sur bois-energie.html)

## Effet spotlight du hero
La souris révèle une 2e photo en gros plan à travers l'image de fond
(`.hero-reveal-layer` / `#reveal-layer` / `#reveal-tag`, logique dans
`script.js`). Une scène 3D (WebGL/Three.js) a été testée à la place le
16/07/2026 puis retirée le 18/07/2026 à la demande du client — pas la peine
de la réintroduire sans qu'on en reparle.

Pour prévisualiser en conditions HTTP réelles (recommandé, un simple
double-clic sur les fichiers peut se comporter différemment) : un petit
serveur local sans dépendance est fourni dans `.claude/serve.ps1` (utilise
.NET, déjà sur Windows). Lancer avec `powershell -File .claude/serve.ps1`
puis ouvrir `http://localhost:8843/`.

## Images — vraies photos intégrées le 18/07/2026
Les photos viennent d'un dossier partagé par André Technologies (via
SharePoint pro, `Site web Nael.url`). Elles sont dans `photos/` (originaux,
non utilisés directement — trop lourds pour le web) et `images/` (versions
redimensionnées à 2400px max, ~150-1000 Ko, utilisées dans le site).
- `sciage-linck.jpg` — ligne de sciage Linck, gros plan pièce de bois
- `pellets-convoyeur.jpg` — grappin à grumes + silos (parc à grumes)
- `pellets-scierie-chauvin.jpg` — vue aérienne complète d'une scierie
- `pellets-usine-argentine.jpg` / `pellets-usine-bresil.jpg` — usines de
  référence Rudnick (vues aériennes)
- `pellets-ensachage.jpg` — ligne d'ensachage de pellets
- `pellets-pelletisation-1/2/3.jpg` — presses à granuler
- `pellets-trommelhacker.jpg` — broyeur à tambour
- `pellets-recyclingtechnik.jpg`, `pellets-schwingsichter.jpg`,
  `pellets-transport-stockage.jpg` — équipements/silos Rudnick
- `sechage-siat3.jpg` / `sechage-siat9.jpg` — bâtiments séchoirs Mühlböck
- `sechage-scs2.jpg` / `sechage-scs3.jpg` — tuyauterie/vannes (chaufferie)
- `sechage-lef1.jpg` / `sechage-lef2.jpg` — non utilisées pour l'instant

**Étapes du showcase encore en photo de stock (Unsplash), faute de vraie
photo fournie** : Rabotage (accueil + industrie bois), Expédition (accueil).
À remplacer dès que ces photos seront disponibles.

## Vidéos partenaires intégrées le 25/07/2026
Deux vidéos reçues (`Chaudière Urbas.zip`, `Parc à billons springer.zip`)
ne contenaient que des rushs bruts, sans photo. Traitement avec `ffmpeg`
(installé en local uniquement pour ce projet, non versionné) :
- Une image de couverture extraite de chaque vidéo remplace le stock Unsplash
  restant : `images/cogeneration-urbas.jpg` (bras robotisé qui soude une
  virole de chaudière, utilisée pour l'étape "Cogénération" sur
  bois-energie.html) et `images/triage-empilage-springer.jpg` (grume triée
  automatiquement, utilisée pour l'étape "Triage & empilage" sur l'accueil
  et industrie-bois.html).
- Extraits compressés (720p, H.264) dans `videos/` et intégrés en `<video
  controls>` juste après la section équipements de chaque page concernée :
  `videos/urbas-fabrication-chaudiere.mp4` (32 s, 5,4 Mo, avec son) sur
  bois-energie.html, `videos/springer-triage-empilage.mp4` (34 s, 7,3 Mo,
  muette) sur industrie-bois.html.
- Les vidéos sources brutes (108 Mo / 69 Mo) restent à la racine du projet,
  gitignorées, non utilisées telles quelles sur le site.

**Fichiers reçus mais non exploités** — à voir avec André Technologies :
- `Evacuation des connexes Rudnik.zip` et `Triage empilage springer.zip` :
  vides (dossier zippé sans rien dedans).
- `Non confirmé 56417.crdownload` (794 Mo, s'il existe encore) : téléchargement
  resté inachevé, fichier invalide en l'état — à retélécharger si besoin.
Ces fichiers sont toujours à la racine du projet ; à nettoyer une fois
vérifiés (ils ne sont pas utilisés par le site).

## Pages restant à construire
Toutes les pages du brief sont construites (accueil, bois énergie, industrie
bois, bureau d'études, contact, actualités, mentions légales / politique de
confidentialité).

## Coordonnées réelles (intégrées le 16/07/2026)
Adresse, téléphone et fax réels sont désormais dans le footer de toutes les
pages, sur `contact.html` (coordonnées + carte) et dans les pages légales :
8, rue Jean Marie Lehn, Parc d'activités du Rosenmeer, Zone Sud,
F-67560 Rosheim, France — Tél. +33 (0)3 88 95 44 43 — Fax +33 (0)3 88 47 65 09.

## Bande partenaires (ajoutée le 24/07/2026)
Sur l'accueil, sous les chiffres clés : logos Linck / Springer / Urbas /
Mühlböck / Rudnick & Enners, récupérés depuis l'ancien site
(andre-technologies.fr/app/uploads/2019/06/partenaire0X.png, transparents).
Infobulle au survol avec une courte description de la spécialité de chacun
(déduite des noms de dossiers photos + slogan du logo — à faire valider par
André Technologies si possible). Fond clair sans bordure (ombre douce à la
place, cf retour du client sur le rendu "boîte" trop marqué).

## Veille technologique — refonte stratégique du 29/07/2026
Demande du PDG d'André Technologies après avoir vu la v1 : le site doit
**apporter une information utile au client**, pas seulement présenter
l'entreprise. Son exemple : un client lui demande chaque année, sur le salon
Eurobois, ce qui est sorti de nouveau chez les constructeurs.

Le positionnement qui en découle : André Technologies est l'intermédiaire entre
les constructeurs européens (Linck, Springer, Urbas, Mühlböck, Rudnick) et les
scieries françaises. C'est donc légitimement **la source d'information technique
de la filière en France**. Le site devient un service, pas une brochure.

**Ce qui a été construit :**
- `veille.html` — le relevé. Chaque entrée est estampillée date, catégorie et
  **provenance** (salon, communiqué constructeur, retour de chantier), pour que
  le lecteur sache toujours ce qu'il lit. Filtres par catégorie **générés
  automatiquement** à partir des `data-cat` présentes : ajouter une entrée dans
  une nouvelle catégorie fait apparaître son filtre, sans toucher au code.
- Le bloc `.entry-impact` (« Ce que ça change pour votre scierie ») est le
  cœur de la valeur ajoutée : l'info brute existe déjà chez le constructeur,
  l'analyse pour une scierie française non. **Si un jour il n'y a rien à en
  dire, supprimer le bloc plutôt que de le remplir de généralités.**
- `evenements.html` — LIGNA 2027 (10-14 mai, Hanovre, on y va en visiteur) et
  Eurobois 2028 (1-4 février, Eurexpo Lyon, **on y expose**). Compte à rebours
  live vers la prochaine échéance : la date cible est dans l'attribut
  `data-countdown`, rien d'autre à modifier. L'état « salon passé » est géré
  (message dédié, jamais de nombres négatifs).
- Sur l'accueil, la veille devient un **pilier** au même niveau que les deux
  métiers (section `.watch`), avec les 3 dernières entrées et la date de
  dernière mise à jour affichée franchement — ce qui oblige à la tenir à jour.
- Navigation : « Actualités » disparaît, remplacé par « Veille » (avec
  sous-menu Innovations / Événements), placé **avant** « Qui sommes-nous ».
- Bloc d'inscription à la veille, prêt à brancher sur Brevo (gratuit jusqu'à
  ~2000 contacts) : remplacer `SUBSCRIBE_ENDPOINT` en bas de `veille.html`.
  Tant que ce n'est pas fait, le formulaire le dit honnêtement au lieu de faire
  semblant d'enregistrer.

**Rythme convenu : une entrée par mois**, rédigée par André Technologies.
Le mode d'emploi complet est en commentaire directement dans `veille.html`.

✅ **L'entrée exemple a été supprimée le 19/08/2026**, remplacée par six entrées
réelles (voir « Premières entrées de veille » plus bas). Le numéro de stand
Eurobois reste en placeholder dans `evenements.html`.

⚠️ **Ne pas récupérer automatiquement (scraper) le contenu des sites
partenaires** : problème de droits d'auteur et casse à la moindre refonte de
leur site. La bonne méthode est de demander aux constructeurs d'être mis en
copie de leurs communiqués — c'est dans leur intérêt commercial.

## Accueil — séquence, partenaires et vidéo (29/07/2026)

**Section partenaires — « un spécialiste européen par étape ».**
La bande de logos a été remplacée par cinq cartes, rangées dans l'ordre de la
ligne de production, chacune rattachée au poste qu'elle équipe. Un carrousel
défilant a été écarté volontairement : à cinq logos la boucle se voit, et faire
défiler des leaders européens comme un tapis roulant les banalise au lieu de les
valoriser. La spécialité, auparavant cachée dans une infobulle au survol, est
maintenant lisible d'emblée — y compris au clavier et au doigt.

Les logos ont été remplacés par les fichiers officiels des constructeurs
(`images/logo-*.png|svg`) : les anciens `partenaire0X.png` faisaient 200×150 px,
donc impossibles à agrandir sans devenir flous. Linck et Rudnick sont désormais
en **SVG** (nets à toute taille). Chaque logo reçoit sa hauteur propre via la
variable `--logo-h` posée en attribut `style` : un logo sept fois plus large que
haut (Springer) doit être moins haut qu'un logo compact (Linck), sinon il écrase
visuellement les autres. **Ces valeurs se règlent à l'œil, pas au calcul.**

⚠️ **Erreur corrigée le 29/07/2026 : mauvais logo Mühlböck.** Le premier
téléchargement automatique avait récupéré le logo de « mühlböck küche.raum »,
une entreprise de cuisines homonyme — pas le fabricant de séchoirs à bois
(Mühlböck Holztrocknungsanlagen GmbH, `muehlboeck.com`, pas `.at`). Remplacé par
le vrai logo (`images/logo-muhlbock.svg`, vectoriel officiel). **Leçon : pour un
nom d'entreprise courant, vérifier le domaine par une recherche dédiée avant de
télécharger — ne pas faire confiance au premier résultat.**
Le logo Springer (`images/logo-springer.png`) est correct (bonne entreprise,
vérifié visuellement) mais c'est un fichier blanc pur, prévu pour un fond
sombre : il paraissait invisible sur nos plaques claires. Corrigé avec
`filter:invert(1)` en CSS plutôt qu'en retouchant le fichier — le fichier
original reste intact si on en a besoin ailleurs sur fond sombre.

**Séquence de ligne pilotée par le défilement.**
La ligne de process n'est plus un jeu d'onglets cliquables : la photo reste
épinglée pendant qu'on parcourt les postes, et l'étape active suit la lecture.
L'épinglage repose sur `position:sticky` **en CSS pur** — le JavaScript ne fait
que désigner le poste courant et remplir le filet de progression. Si le script
tombe, la page reste entièrement lisible.
Pour ajouter un poste : ajouter un `<li class="seq-step">` **et** son `<img>`
dans le même ordre. C'est la position qui les apparie, il n'y a aucun index à
maintenir dans le JavaScript.
En mobile `.seq` reste en `display:block` : le bloc conteneur est alors toute la
section, ce qui donne à `sticky` la hauteur de défilement dont il a besoin. En
grille deux colonnes, c'est la rangée qui la fournit.

**Vidéo de fond du héros — essayée puis retirée le 29/07/2026.**
Une boucle de 12 s tirée de la vidéo Springer avait été mise en fond du héros
(chargée uniquement sur grand écran, retirée du DOM sur mobile). Le client n'a
finalement pas aimé le rendu ; retour au hero photo + effet spotlight à la
souris d'origine. Fichiers supprimés (`videos/hero-triage-boucle.mp4`,
`images/hero-triage-poster.jpg`) ainsi que le HTML/CSS/JS associés — rien n'a
été laissé en dormant dans le code.

## Scène 3D de la ligne de process (11/08/2026)

La séquence « Ligne de process » de l'accueil (6 photos en fondu, pilotées par
le défilement) a été remplacée par une scène 3D : la grume est suivie du parc
à grumes jusqu'au chargement du camion, en Three.js pur (pas de bundler).

**Origine.** Une scène 3D avait été testée puis retirée le 18/07/2026 à la
demande du client (voir plus bas) — cette fois, c'est le client qui l'a
redemandée explicitement, avec un paquet de fichiers prêt à intégrer
(`tree-scene.js` + `README-INTEGRATION.md` + une version de référence
d'`index.html`, déposés dans `3D tree scene integration.zip` à la racine —
zip gitignoré, conservé sur le poste mais jamais commité).

**Ce qui a changé dans `index.html`** — exactement les 3 points documentés,
appliqués à la main sur la version courante du fichier plutôt que par un
remplacement en bloc (la version fournie datait d'avant le nettoyage de la
classe `tilt` et aurait fait régresser ce correctif) :
1. Dans le `<head>` : un `<script type="importmap">` qui charge three.js
   0.184.0 depuis unpkg.com avec hash d'intégrité (SRI), et un `<style>` qui
   donne sa taille au conteneur `#tree-3d` et restaure `.seq-media`/`.seq-tag`
   sous `prefers-reduced-motion`.
2. Dans `.seq-media` : les 6 `<img>` remplacées par `<div id="tree-3d"></div>`
   (le cartouche `.seq-tag` reste inchangé, toujours piloté par `script.js`).
3. Juste avant `</body>` : un module qui initialise la scène et lui transmet
   la progression du scroll.

`style.css` et `script.js` n'ont **pas** été modifiés — c'est le point le plus
important de l'intégration. Le filet vert, le cartouche 01/Parc à grumes et
l'étape active continuent d'être calculés par `script.js` exactement comme
avant. Le module d'initialisation de la scène 3D lit la **même donnée** de la
même façon : `(mire38% - #seq-steps.getBoundingClientRect().top) / hauteur`.
Les deux écouteurs de scroll sont indépendants (le module 3D ne connaît pas
`script.js` et inversement) mais calculent la même formule sur le même
élément — donc synchronisés par construction, sans coordination directe.

**Comportement dégradé** (géré par `tree-scene.js` lui-même, rien à faire
dans le reste du site) :
- Écran < 900px ou `prefers-reduced-motion` : pas d'épinglage, la grume
  tourne lentement sur elle-même, la colonne de texte se lit normalement.
- WebGL indisponible ou CDN three.js bloqué : le conteneur reste vide sur le
  fond sombre de `.seq-media`, mais la colonne de texte, le filet et le
  cartouche restent entièrement fonctionnels — rien de bloquant.
- CDN de textures (Poly Haven, CC0) bloqué : repli sur des textures
  procédurales générées en Canvas2D, visibles immédiatement le temps que les
  vraies textures arrivent (ou en remplacement permanent si le CDN échoue).

**Vérification.** Le scroll réel n'a pas pu être simulé de façon fiable dans
l'outillage de test disponible ici (bug d'outillage : `window.scrollTo()`
combiné à `virtual-time-budget` sous Chromium headless produit un rendu
blanc, y compris sur une page vide sans rapport avec ce projet). Vérifié à la
place par : (1) comparaison de code confirmant que les deux formules sont
identiques ; (2) pilotage direct de l'API publique de la scène
(`scene.setProgress()`) pour confirmer que les étapes s'enchaînent dans le
bon ordre aux bonnes bornes ; (3) rendu visuel réel (Edge headless) à trois
moments du parcours — grume texturée au début, pile de planches en séchage au
milieu, camion avec bandeau vert de marque à la fin — confirmant que
géométrie, matériaux, éclairage et CDN fonctionnent bout en bout sans erreur
console.

**Un seul écart avec la doc fournie** : le fichier `index.html` du paquet
contenait encore `class="why-card tilt"` sur 3 cartes (généré avant le
nettoyage du 30/07/2026, voir plus bas) — non repris, gardé nettoyé.

**Réglages** (fluidité du scroll, exposition, focale, teinte du bois,
particules) : objet `params` en haut de `tree-scene.js`. Un panneau de réglage
(`demo.html`) existe dans le projet de conception d'origine mais n'a pas été
fourni avec ce paquet ; retoucher `params` directement si besoin.

⚠️ **Dépendance à deux CDN externes** (unpkg.com pour three.js, Poly Haven
pour les textures). `README-INTEGRATION.md` documente comment héberger les
deux en propre dans `vendor/` et `images/textures/` — pas fait pour l'instant,
la scène fonctionne mais dépend de la disponibilité de ces deux CDN.

## Rythme de la séquence 3D corrigé (19/08/2026)
Retour client : « les étapes vont un peu vite — avec la souris ça va trop vite »,
et « à la fin, quand le bois va dans le camion, on ne voit pas bien ».

**Le diagnostic est le même pour les deux remarques, et il est arithmétique.**
La progression est le rapport entre la ligne de mire et la hauteur de la colonne
`#seq-steps` : c'est donc cette hauteur qui fixe la vitesse. Elle mesurait
1 402 px pour six étapes, soit 234 px par étape — et un cran de molette Windows
vaut environ 100 px. Chaque étape tenait donc en **2,3 crans**. Pire, à l'étape 6
le chargement du camion n'occupait que 34 % de l'étape, soit **79 px : moins d'un
cran.** Le colis se téléportait sur le plateau entre deux crans de molette. Ce
n'était pas un problème de cadrage mais de durée.

**Trois réglages, aucun changement de structure :**
1. `style.css` — `.seq-step` passe de `padding:7vh` à `14vh` (et le repère
   `::before` de `calc(7vh + 8px)` à `calc(14vh + 8px)`, sinon les pastilles se
   décalent des titres). La colonne passe à 2 452 px sur une fenêtre de 900 px :
   409 px par étape, soit **4,1 crans au lieu de 2,8**.
2. `tree-scene.js` — `params.smoothing` de `0.10` à `0.07`. Le lissage est
   indépendant du framerate (`k = 1 - (1-smoothing)^(dt*60)`) ; on passe d'une
   constante de temps de ~0,17 s à ~0,25 s. Entre deux crans de molette la scène
   glisse au lieu de se figer. Ne pas descendre plus bas : le cartouche et le
   filet vert, eux, sautent immédiatement, et un lissage trop long ferait
   réapparaître le décalage corrigé le 16/08/2026.
3. `tree-scene.js`, étape 6 — le chargement occupe désormais **58 % de l'étape
   au lieu de 34 %** : camion garé plus tôt (`arrive` sur `t5` 0,02→0,32),
   cerclage avant le levage (`strapIn` 0,26→0,36), chargement étalé
   (`load` 0,38→0,96). Le chargement dure maintenant ~237 px, soit **2,4 crans
   contre 1 avant**.

⚠️ **Ne pas rapprocher la caméra à la fin — testé et écarté.** Le camion mesure
8,11 unités du pare-chocs au bout du plateau ; à la focale de la scène (34°) et
au format du conteneur `.seq-media`, la caméra n'en cadre que 7,1. **Le camion
dépassait déjà du cadre avant toute modification** (111 %). Réduire le recul de
6,4 à 4,2 fait bien passer le colis de 39 % à 51 % de la largeur d'image, mais
coupe alors soit la cabine et son bandeau vert de marque (à x = −2,88), soit le
bout du plateau (x = 4,05). Le gain de taille ne valait pas la perte : `radius`,
`height` et `camTarget` de l'étape 6 sont **restés à leurs valeurs d'origine**.
Si le cadrage devait quand même être resserré un jour, il faudrait d'abord
raccourcir le modèle du camion, pas reculer la caméra.

**Vérification.** Impossible de contrôler le rendu 3D dans le navigateur intégré
ici : `requestAnimationFrame` est gelé tant que le panneau n'est pas affiché
(sonde posée : **0 image en 7 secondes**), donc ni la scène ni le cartouche
n'avancent, même en pilotant `window.scrollTo`. À noter aussi, `scroll-behavior:
smooth` est actif : tout `scrollTo` de test doit passer `behavior:'instant'`,
sinon la position lue est encore l'ancienne. Vérifié à la place par le calcul —
hauteurs de colonne mesurées dans le DOM, distances et angles de caméra
recalculés à partir des formules du fichier (script conservé dans le
scratchpad de la session). **Le rendu final reste à valider à l'œil.**

## Bug corrigé le 30/07/2026 : menu mobile cassé (« bizarre en défilant »)

Signalé par le client : rendu mobile étrange en faisant défiler / en cliquant
sur le menu. Reproduit et diagnostiqué : le menu mobile plein écran
(`.mobile-menu`, `position:fixed;inset:0`) ne couvrait qu'environ 150 px de
haut en haut de l'écran au lieu de tout l'écran — le reste de la page restait
visible (et cliquable) dessous.

**Cause : un piège CSS classique.** `header` a un `backdrop-filter:blur(10px)`
(l'effet de flou derrière la barre de navigation). Or tout élément avec
`filter` ou `backdrop-filter` crée un nouveau bloc de référencement pour ses
descendants en `position:fixed` — et `.mobile-menu` était un enfant direct de
`<header>` dans le HTML. Résultat : au lieu de se positionner par rapport à
tout l'écran, le menu se positionnait par rapport à la barre de nav elle-même
(≈150 px de haut), d'où le rendu cassé.

**Correctif :** sortir `.mobile-menu` du `<header>` (il devient un frère
direct, placé juste après `</header>`) sur les 11 pages du site. Le
`backdrop-filter` de l'en-tête est conservé — l'effet visuel voulu ne change
pas, seul le menu mobile est déplacé dans le DOM. Vérifié : le menu couvre
maintenant tout l'écran, tous les liens (avec sous-menus) sont visibles et
défilables, la barre de nav (logo) reste visible par-dessus comme prévu.

⚠️ **Le logo André Technologies reste le point faible.** `logo-v2.png` fait
185×82 px, soit tout juste le minimum pour un affichage à 40 px sur écran Retina.
Il ne peut pas être agrandi sans devenir flou. **À faire revectoriser** (.svg) :
cela débloquera un logo plus présent dans l'en-tête, et servira aussi pour les
plaquettes, le stand Eurobois et les véhicules.

## Premières entrées de veille (19/08/2026)
Six entrées réelles (N° 004 à 009) remplacent l'entrée exemple, qui est
supprimée, ainsi que le style `.demo-badge` devenu mort. Le relevé compte
désormais 9 entrées.

**Deux catégories ont été ajoutées**, parce que la demande du PDG ne portait pas
seulement sur les nouveautés constructeurs : ses clients lui demandent aussi ce
qui se passe dans la filière. Il a donc fallu compléter le dictionnaire `LABELS`
dans `script.js` — sans quoi le filtre s'affiche avec la valeur brute non
accentuée :
- `marche` → « Marché »
- `reglementation` → « Réglementation »

**Les six entrées et leurs sources :**
- N° 009 · Réglementation — RDUE/EUDR applicable au 30/12/2026, déclaration de
  diligence raisonnée dans TRACES. Source : ministère de la Transition
  écologique. Point vérifié à deux reprises car il engage le lecteur : le report
  de six mois accordé aux micro et petites entreprises **ne couvre pas le bois**.
- N° 008 · Marché — note de conjoncture FNB (−14,4 % de CA pour les scieries
  résineux, −18,1 % feuillus, −8,6 % à l'export), redressement des prix des
  sciages au T1 2026 alors que les bois sur pied baissent.
- N° 007 · Sciage — Linck PRO NANO : 8 à 35 cm, 220 m/min, ~250 000 m³/an et par
  équipe, canter horizontal qui supprime le retourneur.
- N° 006 · Automatisation — Springer SAWBOX, présentée au salon de Klagenfurt en
  mars 2026, visites chez Cimenti.
- N° 005 · Séchage — Mühlböck, récupération de chaleur : jusqu'à 50 % annoncés au
  catalogue, ~20 % sur la référence française de Volgelsheim (Schilliger Bois).
  **L'écart est assumé et expliqué dans l'entrée** — c'est ce qui donne sa
  crédibilité au relevé.
- N° 004 · Bois énergie — Urbas : Pölkky (Kajaani, janvier 2026), Lustenau 5 MW
  (juin 2026), Holtmeyer (granulés + cogénération). Prix du granulé ~410 €/t en
  vrac en 2026 contre ~285 €/t avant la crise de 2022.

**Règle de rédaction retenue pour la suite.** Chaque entrée renvoie à sa source
par le lien `.entry-more` (`target="_blank" rel="noopener"`), et les six liens
ont été testés — tous en HTTP 200. On ne recopie jamais le texte d'un
constructeur : on résume, on date, on source, et on ajoute l'analyse française
dans `.entry-impact`. Quand un chiffre constructeur est un maximum commercial,
on le présente comme tel et on donne la valeur observée sur une installation
réelle : c'est le seul moyen que le lecteur revienne.

Les trois entrées les plus récentes ont été recopiées dans le bloc `.watch` de
l'accueil et la date `.watch-freshness` passée à « août 2026 ». Vérifié après
coup : filtres générés correctement (9 boutons), aucun débordement horizontal en
1265 px comme en 375 px, aucune erreur console.

## Travailler en local (ajouté le 19/08/2026)
Le projet a été récupéré depuis GitHub sur un nouveau PC. Pour le développer :

```bash
git clone https://github.com/naelandre672-a11y/andre-technologies-site.git
cd andre-technologies-site
node serve.mjs
```

Le site est alors sur http://localhost:4321. Rien à installer : `serve.mjs` est un
serveur de fichiers de 40 lignes qui n'utilise que Node (aucune dépendance npm),
volontairement, pour ne pas trahir le choix du site sans chaîne d'outils.

⚠️ **Ouvrir `index.html` par double-clic ne fonctionne pas.** Les scripts de la
scène 3D sont chargés en `type="module"`, et les navigateurs refusent de charger
un module depuis `file://` (règle CORS). Le serveur est donc obligatoire pour
voir la page telle qu'elle sera en ligne.

`serve.mjs` sert aussi les URL sans extension (`/contact` → `contact.html`) pour
se comporter comme Netlify.

## Hébergement (fait le 24/07/2026, déploiement continu ajouté le 25/07/2026)
Le code est versionné sur GitHub (`naelandre672-a11y/andre-technologies-site`,
branche `main`) et le site est hébergé sur Netlify, lié à ce dépôt :
`andretechnologies.netlify.app`. Déploiement continu actif : chaque `git push`
sur `main` redéploie automatiquement le site en quelques minutes, plus besoin
de glisser-déposer manuellement. Reste à faire : brancher le nom de domaine
andre-technologies.fr dessus.

## Ce qu'il reste à faire avant la mise en ligne définitive
- [x] Vraies photos de l'entreprise + 2 vidéos partenaires (Urbas, Springer)
      — sauf Rabotage et Expédition encore en photo de stock faute de
      matière fournie (voir section Images / Vidéos)
- [x] Hébergement — en ligne sur Netlify, reste à lier un compte + le domaine
- [x] Refonte typographique et chromatique (29/07/2026)
- [x] Rubrique veille technologique + événements (29/07/2026)
- [x] **Écrire les premières vraies entrées de veille** et supprimer l'entrée
      exemple dans `veille.html` — c'est le point bloquant avant publication
- [ ] Demander aux constructeurs partenaires d'être mis en copie de leurs
      communiqués de nouveautés (matière première de la veille)
- [ ] Renseigner le n° de stand Eurobois 2028 dans `evenements.html`
- [ ] Créer le compte Brevo et coller l'URL dans `SUBSCRIBE_ENDPOINT`
      (bas de `veille.html`)
- [ ] Connecter le formulaire de contact à un vrai service d'envoi
      (`FORM_ENDPOINT` dans `contact.html`)
- [ ] Compléter les informations légales réelles restantes dans
      `mentions-legales.html` (forme juridique, capital social, RCS, SIRET,
      dirigeant, hébergeur — l'adresse est déjà à jour)
- [ ] Brancher le nom de domaine andre-technologies.fr sur Netlify (DNS)
- [ ] SEO on-page (meta descriptions déjà en place par page, ajouter
      sitemap.xml) + accessibilité
- [ ] Tests multi-navigateurs / vitesse
- [ ] Mise en ligne définitive + redirections + suivi (Analytics, Search Console)
- [ ] Nettoyer les gros fichiers à la racine (zips, vidéos, .crdownload —
      voir section Images, ~1 Go non utilisé par le site)
