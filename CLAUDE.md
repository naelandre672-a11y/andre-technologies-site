# André Technologies — site vitrine

**Lis `PROJET.md` avant toute modification.** C'est la mémoire du projet : système
de design et règles typographiques, décisions prises *et leurs raisons*, journal
des bugs corrigés, et la liste de ce qu'il reste à faire. Ce fichier-ci ne fait
que résumer le fonctionnement pratique.

## Ce que c'est
Site statique HTML / CSS / JS, 11 pages à la racine. **Aucune dépendance, aucun
build, aucun framework** — c'est un choix délibéré : Nael André gère seul le
contenu et doit pouvoir modifier une page sans chaîne d'outils. Ne pas introduire
de bundler, de CMS ni de librairie sans que ce soit demandé.

## Développer en local
```bash
node serve.mjs        # puis http://localhost:4321
```
Un double-clic sur `index.html` ne marche pas : les scripts de la scène 3D sont
en `type="module"`, que les navigateurs refusent de charger depuis `file://`.

## Mise en ligne
Hébergé sur Netlify (`andretechnologies.netlify.app`), en déploiement continu :
**tout `git push` sur `main` met le site en ligne en quelques minutes.** Donc pas
de push tant qu'une modification n'est pas vérifiée dans le navigateur.
Les redirections d'anciennes URL vivent dans `_redirects`.

## Conventions
- **Tout est en français** : contenu, commentaires, messages de commit.
- Messages de commit à l'indicatif présent, comme l'historique existant :
  « Corrige le décalage scène 3D / texte », « Ajoute les vraies photos ».
- Couleurs et polices **uniquement** via les variables de `style.css` (`:root`) —
  jamais de valeur en dur. Les trois voix typographiques ont chacune un rôle
  strict, décrit dans `PROJET.md` ; s'y tenir.
- `logo-v2.png` s'utilise tel quel (fond transparent, ne pas lui ajouter de pastille).
- Une modification de navigation ou de pied de page doit être répercutée sur
  **les 11 pages**, il n'y a pas de gabarit partagé.
- Après un changement structurant ou un bug résolu, **mettre à jour `PROJET.md`** :
  c'est ce qui permet de reprendre le projet des mois plus tard.

## Points ouverts (détail et liste complète en fin de `PROJET.md`)
- Écrire les vraies entrées de veille et supprimer l'exemple — bloquant avant publication.
- Formulaire de contact non branché (`FORM_ENDPOINT` dans `contact.html`).
- Inscription à la veille non branchée (`SUBSCRIBE_ENDPOINT` dans `veille.html`).
- Domaine `andre-technologies.fr` pas encore relié à Netlify.
- Logo à revectoriser en `.svg` (le PNG actuel est à sa limite de résolution).
