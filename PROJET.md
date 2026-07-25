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

## Système de design
- **Couleurs** (dans style.css `:root`) : vert de marque `#78A22F` (--oak),
  gris de marque `#A7ACB3` (--steel-light), anthracite `#191A1C` (--graphite),
  fond clair `#F4F5F2` (--birch). Palette directement extraite du logo réel.
- **Typographies** : Big Shoulders Display (titres, condensé/industriel),
  Work Sans (texte courant), IBM Plex Mono (labels techniques, chiffres).
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
- `actualites.html` — liste des actualités (cartes réutilisables)
- `actualite-nouveau-site.html` — premier article réel (annonce du site)
- `actualite-modele.html` — gabarit à dupliquer pour chaque nouvelle actu
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
