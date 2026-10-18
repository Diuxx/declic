# Déclic — Interface de correction

Version découpée depuis `correction_ok.html`, avec les deux présentations validées :
correcteur clair et article discret. En mode discret, le même bloc de saisie et de
résultat est déplacé après le premier paragraphe. La saisie, le résultat et la case
à cocher sont conservés lors de la bascule.

## Ouvrir l’application

Décompresser l’archive puis ouvrir `index.html` dans un navigateur récent.
Garder les dossiers `css` et `js` à côté de ce fichier. Aucune installation,
compilation ni dépendance front n’est nécessaire.

Pour servir les fichiers en HTTP pendant le développement, depuis ce dossier :

```bash
python -m http.server 8080 --bind 127.0.0.1
```

Ouvrir ensuite http://localhost:8080. Sur Windows, `py -m http.server 8080 --bind
127.0.0.1` peut remplacer la commande ci-dessus.

La copie utilise le presse-papiers du navigateur. Selon son contexte et ses
permissions, elle peut être refusée : l’application indique alors de sélectionner
le texte pour le copier manuellement.

## Où modifier quoi ?

| Fichier | Responsabilité |
| --- | --- |
| `index.html` | Structure de la page, contenu de l’article et emplacements du formulaire |
| `css/base.css` | Présentation claire, styles communs, adaptation mobile |
| `css/camouflage.css` | Styles appliqués uniquement en mode discret |
| `js/correction-service.js` | Règles de démonstration et point de raccordement du backend |
| `js/editor-view.js` | Affichage, libellés, déplacement du bloc, hauteur de saisie, événements DOM |
| `js/app.js` | Soumission, validation du résultat, traitement des erreurs et copie |
| `tests/` | Tests des règles et des comportements de l’application |
| `package.json` | Commandes de vérification ; aucune dépendance à installer |

Les scripts sont chargés avec `defer`, dans l’ordre service → vue → application.
Ils partagent uniquement l’objet `globalThis.Declic` ; leurs variables internes
restent privées. Ce choix permet de conserver l’ouverture directe de `index.html`,
sans bundler ni serveur obligatoire pour des modules JavaScript.

La vue reçoit `document` et `window` explicitement. Le contrôleur dépend de la vue
et du service ; les règles de correction ne dépendent pas du DOM. Les textes
variables des deux présentations sont regroupés au début de `editor-view.js`.

## Modifier une règle de démonstration

Modifier `CORRECTION_RULES` dans `correction-service.js`. Chaque règle contient :

- `pattern` : expression régulière de recherche ;
- `replacement` : remplacement attendu ;
- `explanation` : information affichée dans les détails.

Le service conserve les espaces et les retours à la ligne. Il maintient la
majuscule initiale du texte remplacé, comme dans le fichier validé. Les règles
sont exécutées dans l’ordre de la liste ; les détails suivent cet ordre.

Il s’agit d’un correcteur de démonstration limité à quelques expressions.
L’absence de modification ne garantit pas l’absence de fautes. La règle
« je suis aller » conserve la proposition masculine « je suis allé » de la
version validée, sans déterminer l’accord à partir du contexte.

## Brancher le backend

Remplacer le corps de `correctText(text)` dans `js/correction-service.js` par un
appel à ton API. Le reste de l’interface attend une promesse contenant ce contrat :

```json
{
  "correctedText": "Bonjour, je peux écrire.",
  "corrections": [
    {
      "before": "je peut",
      "after": "je peux",
      "explanation": "Conjugaison du verbe pouvoir avec je."
    }
  ]
}
```

`app.js` vérifie ce contrat avant d’afficher le résultat. Une erreur réactive la
saisie et affiche un échec. Les doubles soumissions sont ignorées pendant une
correction. Les sorties utilisent `textContent` pour traiter le texte comme du
texte et éviter son interprétation HTML.

Le backend n’est pas implémenté dans ce projet. Lors du raccordement, prévoir un
délai d’attente, traiter les statuts HTTP et appliquer les contrôles d’accès et
quotas côté serveur. Ne mettre aucune clé API dans les fichiers du navigateur.
Aucune requête réseau ni aucun enregistrement du texte n’est effectué ici.

## Vérifications

Avec Node.js 18 ou plus récent, depuis le dossier du projet :

```bash
npm test
npm run check
```

Aucun `npm install` n’est nécessaire. Alternatives sans npm :

```bash
node --test tests/application.test.cjs tests/correction-service.test.cjs
node --check js/correction-service.js
node --check js/editor-view.js
node --check js/app.js
```

Les 15 tests couvrent les règles de correction, le mode discret, la conservation
du bloc et de son état, les détails, le compteur, la hauteur des notes, les entrées
vides, les doubles soumissions, la bascule pendant une requête, les échecs, la
validation de réponse, l’affichage de texte HTML et la copie.

Les tests d’interface utilisent un DOM minimal et ne vérifient pas le rendu CSS
ni les permissions réelles du presse-papiers. Le contenu HTML a été comparé au
fichier validé ; les styles en ont été extraits, avec suppression des règles
inutilisées et des anciennes déclarations entièrement remplacées.

Avant publication, vérifier dans les navigateurs cibles les deux modes, une note
longue, une fenêtre mobile, les focus clavier et la copie. Aucun contrôle visuel
dans un navigateur réel n’a été exécuté pendant ce découpage.
