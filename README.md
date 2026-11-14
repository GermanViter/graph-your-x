# Graph Your X

**Voyez tout ce qui vous sépare du cours ou du sujet que vous voulez apprendre.**

Projet réalisé pour **HackDécouverte 2026**.

Vous choisissez un objectif (ex. *Machine Learning*) et Graph Your X affiche un graphe de tous les
préalables à maîtriser avant : les préalables directs, mais aussi les préalables des préalables.
Vous cochez ce que vous avez déjà fait, et la carte vous montre ce que vous pouvez prendre maintenant.

Ça marche pour n'importe quel arbre de connaissances : un programme d'études, un arbre de compétences,
un parcours de certification ou une feuille de route d'apprentissage.

## Guide d'utilisation

### Se retrouver dans le site

Le site a deux pages, accessibles par le menu en haut :

| Page | Comment y aller | Ce qu'on y fait |
|---|---|---|
| **Accueil** (`/`) | Logo ou lien **Home** | Découvrir l'app avec une démo déjà remplie : le parcours vers *Machine Learning*, avec deux cours déjà faits. Les liens **How it works** et **Build your own** descendent vers les sections de la page. |
| **Graph** (`/graph`) | Bouton **Open graph** | Bâtir **votre** parcours et suivre votre progression. La page commence vide. |

La démo de l'accueil sert d'exemple : on peut cliquer dedans, mais rien n'y est sauvegardé.
Pour planifier pour vrai, allez sur **Graph**.

### Bâtir son parcours en 5 étapes

1. **Ouvrir la page Graph** avec le bouton **Open graph**.
2. **Choisir un objectif.** Cliquez sur **Manage path**, puis l'onglet **Catalog**. Les sujets
   (marqués *Topic*) sont en haut, suivis des notions une par une. Cochez un sujet, par exemple
   *Machine Learning* : l'app l'ajoute avec **toute sa chaîne de préalables**. Fermez le panneau
   avec **Close**.
3. **Explorer le graphe.** Les préalables sont à gauche et l'objectif à droite ; les flèches vont
   du préalable vers ce qui en dépend. Cliquez sur une notion pour la sélectionner : sa chaîne
   s'illumine et le panneau de droite affiche ses détails.
4. **Cocher ce qui est fait.** Dans le panneau de droite, cliquez sur **Mark as completed**.
   Les notions dont tous les préalables sont faits deviennent prêtes, la barre de progression
   avance et la liste **Ready to take now** se met à jour.
5. **Choisir quoi faire ensuite.** Cliquez sur une notion de **Ready to take now** pour la
   sélectionner dans le graphe. La ligne **Opens up** du panneau montre ce qu'elle débloque.

### Lire le graphe

| Couleur | Statut | Signification |
|---|---|---|
| Vert | **Completed** | Vous l'avez marquée comme faite |
| Ambre | **Ready to take** | Tous ses préalables obligatoires sont faits : vous pouvez la commencer |
| Gris | **Locked** | Il manque encore au moins un préalable |
| Contour accentué | **Selected** | La notion sélectionnée |

La légende sous le graphe rappelle ces couleurs. Seuls les préalables **obligatoires** bloquent
une notion. Les préalables **conseillés** apparaissent dans le panneau de détails
(*Recommended, not required*), mais ne bloquent rien.

### Le panneau de détails

En cliquant sur une notion, le panneau de droite affiche :

- son nom et sa description
- sa catégorie et sa difficulté (de 1 à 5)
- les préalables conseillés, s'il y en a
- son statut, et la liste des notions qu'il reste à faire avant elle
- **Opens up** : ce qu'elle débloque
- les boutons **Mark as completed** / **Mark as not completed** et **Clear all progress**

### Se déplacer dans le graphe

- **Glisser** avec la souris pour se déplacer. Au clavier : cliquer dans le graphe, puis les flèches.
- **−** et **+** pour zoomer, **Fit to screen** pour voir tout le graphe, **Reset to 100%** pour revenir
  à la taille normale.

### Modifier son parcours

Le bouton **Manage path** ouvre trois onglets :

- **Catalog** : chercher par nom ou par code, cocher pour ajouter (avec les préalables), décocher pour
  retirer. Décocher retire aussi les notions qui en dépendent, pour ne jamais garder une notion sans
  ses préalables. Le filtre **Selected only** montre ce qui est déjà choisi, et **Undo** annule.
- **Add a step** : créer une étape personnalisée (ex. un cours qui n'est pas dans le catalogue) et
  choisir ses préalables parmi les étapes déjà présentes.
- **Edit text** : écrire le parcours en texte, une étape par ligne, son nom avant les deux-points et
  ses préalables après :

  ```
  HTML basics:
  CSS basics:
    Build a website: HTML basics, CSS basics
      Publish a website: Build a website
  ```

  Un côté droit vide veut dire « aucun préalable ». L'indentation est seulement visuelle (Tab /
  Shift+Tab) : ce sont les noms après les deux-points qui créent les liens. **Format text** remet le
  texte en forme et **Apply changes** l'applique au graphe, après avoir vérifié qu'il n'y a pas de
  nom en double ni de boucle.

**Undo manual change** annule le dernier changement, et **Restore sample curriculum** recharge un
parcours d'exemple.

### Où sont sauvegardées mes données ?

Votre parcours et votre progression sont sauvegardés **dans votre navigateur** (`localStorage`).
Vous les retrouvez en revenant sur le site avec le même navigateur, mais ils ne sont pas liés à un
compte ni synchronisés entre appareils. Vider les données du navigateur les efface. Le catalogue
des sujets, lui, vient de la base de données du serveur, et vos modifications ne la changent pas.

### Si le catalogue ne charge pas

L'onglet *Catalog* affiche une erreur et un bouton pour réessayer. Vérifiez que le backend roule :
http://127.0.0.1:8000/api/health doit répondre `{"ok":true}`. En attendant, votre parcours et
l'édition manuelle restent utilisables.

## Stack

| Partie | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, graphe dessiné en SVG maison, Vitest |
| Backend | Python, FastAPI, Uvicorn, Pydantic, pytest |
| Base de données | SQLite |

## Structure du projet

```
graph-your-x/
├── apps/
│   ├── backend/                    # API FastAPI
│   │   ├── main.py                 # routes et CORS
│   │   ├── db.py                   # connexion SQLite, tables et requêtes
│   │   ├── models.py               # types du JSON (Pydantic)
│   │   ├── seed.py                 # sujets de départ
│   │   ├── tests/                  # tests pytest (API et base de données)
│   │   ├── requirements.txt
│   │   └── requirements-dev.txt    # dépendances des tests
│   └── frontend/                   # app React + Vite
│       ├── BACKEND_INTEGRATION.md  # détails du branchement front ↔ API
│       ├── JUDGES_GUIDE.md         # guide de démo et questions des juges
│       └── src/
│           ├── pages/              # accueil (/) et graphe (/graph)
│           ├── components/         # graphe, détails, légende, éditeur de parcours, layout
│           ├── hooks/              # usePrereqPlanner : tout l'état du planificateur
│           ├── services/           # appels à l'API, édition du parcours (+ tests)
│           └── global.css          # thème (couleurs, polices)
├── scripts/start-backend.mjs       # lance l'API depuis npm run dev
├── CLAUDE.md                       # conventions du projet
└── package.json                    # npm run dev lance le backend et le frontend ensemble
```

## Lancer le projet

Il faut **Python 3.10+** et **Node.js 20+**.

### Installation (une seule fois)

Depuis la racine du repo :

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r apps/backend/requirements.txt
.\.venv\Scripts\python.exe apps/backend/seed.py
npm install
npm install --prefix apps/frontend
```

Sur macOS / Linux, remplacez `.\.venv\Scripts\python.exe` par `.venv/bin/python`.

`seed.py` crée `apps/backend/app.db` et ajoute les sujets de départ. Il peut être relancé sans
créer de doublons.

### Démarrer

```powershell
npm run dev
```

Cette commande démarre l'API sur le port 8000 et le site sur le port 5173. **Ctrl+C** arrête
les deux. Ouvrez http://localhost:5173.

Pour les lancer dans deux terminaux séparés : `npm run backend` et `npm run frontend`.

Pendant le développement, Vite redirige les appels `/api` vers l'API sur le port 8000. La
documentation interactive de l'API est sur http://localhost:8000/docs. Les détails du
branchement et du déploiement sont dans
[`apps/frontend/BACKEND_INTEGRATION.md`](apps/frontend/BACKEND_INTEGRATION.md).

## Tests

```powershell
# Backend (depuis apps/backend)
pip install -r requirements-dev.txt
python -m pytest

# Frontend (depuis apps/frontend)
npm test
```

- **Backend** (`apps/backend/tests/`) : les routes de l'API (contrat JSON, 404, CORS) et la base de
  données (chaîne de préalables complète, arrêt sur des données cycliques, sauvegarde sans doublons,
  contraintes du schéma, rollback en cas d'erreur).
- **Frontend** (`src/services/__tests__/`) : la lecture et la validation des réponses de l'API, la
  construction du catalogue, et l'ajout et le retrait de notions avec leurs dépendances, avec Vitest.
  Un test optionnel appelle la vraie API à travers Vite : lancez `npm run dev`, puis
  `$env:LIVE_API_URL='http://localhost:5173/api'` avant `npm test`.

## API

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Vérifie que le serveur répond |
| `GET` | `/api/topics` | Liste des sujets disponibles |
| `GET` | `/api/roadmap/{topic}` | Graphe des préalables d'un sujet |

Exemple de réponse de `/api/roadmap/machine-learning` (raccourcie) :

```json
{
  "goal": "machine-learning",
  "nodes": [
    {
      "id": "linear-algebra",
      "label": "Linear Algebra",
      "description": "Study of vectors, matrices and linear transformations.",
      "category": "math",
      "difficulty": 3
    }
  ],
  "edges": [
    { "from": "linear-algebra", "to": "numpy", "type": "required" }
  ]
}
```

- `from` est le préalable, `to` est le concept qui en dépend.
- `type` vaut `required` (obligatoire) ou `recommended` (conseillé).
- `category` vaut `math`, `programming`, `theory`, `tools` ou `domain`.
- `difficulty` va de 1 (débutant) à 5 (avancé).

Un sujet inconnu renvoie une erreur `404`.

## Données

La base SQLite (`apps/backend/app.db`) contient trois tables :

- `concepts` : un concept par ligne (`id`, `label`, `description`, `category`, `difficulty`)
- `prerequisites` : un lien par ligne (`concept_id` requiert `requires_id`, avec un `type`)
- `topics` : les objectifs proposés dans le Catalog

Le graphe complet d'un sujet est obtenu avec une requête récursive (`WITH RECURSIVE`), qui s'arrête
même si les données contiennent un cycle. Les concepts sont partagés entre les sujets :
*Python* est un seul nœud, peu importe combien de sujets en ont besoin.

Sujets inclus au départ : **Machine Learning**, **Web Development**, **Cybersecurity**
(26 concepts au total). Pour en ajouter, modifiez `apps/backend/seed.py` puis relancez-le.

## Limites actuelles

- Pas de comptes : le parcours et la progression restent dans le navigateur.
- Le site lit la base de données, mais n'y écrit pas : les parcours personnalisés ne sont pas partagés.
- La progression est déclarée par l'utilisateur ; rien ne vérifie un relevé de notes.
- Le modèle ne couvre pas toutes les règles réelles d'inscription (notes minimales, cours alternatifs,
  co-requis, sessions où un cours est offert).

## Pistes pour la suite

- Générer avec une IA les préalables d'un sujet qui n'est pas encore dans la base, puis les valider
  (pas de cycles, tous les concepts reliés à l'objectif) avant de les sauvegarder.
  La base est déjà prête : `db.py` sait sauvegarder une roadmap validée (`save_roadmap`)
  et lister les concepts existants pour que l'IA les réutilise (`list_concepts`).
- Importer de vrais catalogues de cours de cégeps et d'universités.
- Comptes utilisateurs pour retrouver sa progression sur plusieurs appareils.

## Équipe

- GermanViter
- Fckmads07
- dav-cip
- mohammadnasrhasmi-beep
