# Graph Your X

**Voyez tout ce qui vous sépare du cours ou du sujet que vous voulez apprendre.**

Projet réalisé pour **HackDécouverte 2026**.

Vous choisissez un objectif (ex. *Machine Learning*) et Graph Your X affiche un graphe de tous les
préalables à maîtriser avant : les préalables directs, mais aussi les préalables des préalables.
Vous cochez ce que vous avez déjà appris et la carte vous montre ce que vous pouvez attaquer
maintenant.

## Fonctionnalités

- **Toute la chaîne de préalables** : on voit le vrai nombre d'étapes avant d'atteindre l'objectif.
- **Obligatoire ou conseillé** : l'API indique pour chaque lien si le préalable est bloquant ou juste utile.
- **Suivi de progression** : on marque ce qui est appris, et ce qui est accessible ensuite change de couleur.
- **Ce que chaque concept débloque** : on voit quels sujets dépendent de celui qu'on regarde.
- **Navigation dans le graphe** : zoom et ajustement à l'écran.
- **Construire son propre parcours**, de trois façons :
  - **Catalog** : ajouter un cours du catalogue, avec tous ses préalables d'un coup.
  - **Add a step** : créer une étape et choisir ses préalables parmi celles qui existent déjà.
  - **Edit text** : écrire le parcours en texte, une étape par ligne (`Étape : préalable, préalable`),
    avec indentation, mise en forme automatique et validation (noms en double, cycles).
- **Annuler et recommencer** : annuler le dernier changement ou revenir au parcours d'exemple.

## Stack

| Partie | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router (pages `/` et `/graph`) |
| Backend | Python, FastAPI, Uvicorn |
| Base de données | SQLite |

## Structure du projet

```
graph-your-x/
├── apps/
│   ├── backend/            # API FastAPI
│   │   ├── main.py         # routes et CORS
│   │   ├── db.py           # connexion SQLite, tables et requêtes
│   │   ├── models.py       # types du JSON (Pydantic)
│   │   ├── seed.py         # données de départ
│   │   └── requirements.txt
│   └── frontend/           # app React + Vite
├── CLAUDE.md               # conventions du projet
└── package.json            # scripts pour lancer le front depuis la racine
```

## Lancer le projet

Il faut **Python 3.10+** et **Node.js 20+**. Le backend et le frontend roulent en même temps,
dans deux terminaux séparés.

### Backend (port 8000)

```bash
cd apps/backend
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
python seed.py                 # crée app.db et ajoute les sujets de départ
uvicorn main:app --reload
```

L'API roule sur http://localhost:8000 et la documentation interactive est sur
http://localhost:8000/docs.

### Frontend (port 5173)

```bash
cd apps/frontend
npm install
npm run dev
```

L'app est sur http://localhost:5173 : la page d'accueil sur `/` et le graphe sur `/graph`.

Par défaut, le frontend utilise le catalogue d'exemple `apps/frontend/data.json`. Pour lui faire
lire un catalogue servi par une API, définissez `VITE_COURSES_API_URL` dans `apps/frontend/.env`.

## Tests

```bash
# Backend (depuis apps/backend)
pip install pytest httpx
python -m pytest

# Frontend (depuis apps/frontend)
npm test
```

Le backend teste les routes de l'API et les requêtes de la base (`apps/backend/tests/`).
Le frontend teste les services `api.ts` et `catalog.ts` avec Vitest (`src/services/__tests__/`).

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
- `topics` : les objectifs proposés dans le sélecteur

Le graphe complet d'un sujet est obtenu avec une requête récursive (`WITH RECURSIVE`).
Les concepts sont partagés entre les sujets : *Python* sert autant au Machine Learning qu'au reste.

Sujets inclus au départ : **Machine Learning**, **Web Development**, **Cybersecurity**.
Pour en ajouter, modifiez `apps/backend/seed.py` puis relancez `python seed.py`
(le script peut être relancé sans créer de doublons).

## Pistes pour la suite

- Brancher le graphe du frontend sur l'API au lieu du catalogue d'exemple.
- Générer avec une IA les préalables d'un sujet qui n'est pas encore dans la base, puis les valider
  (pas de cycles, tous les concepts reliés à l'objectif) avant de les sauvegarder.
  La base est déjà prête : `db.py` sait sauvegarder une roadmap validée (`save_roadmap`)
  et lister les concepts existants pour que l'IA les réutilise (`list_concepts`).
- Sauvegarder la progression de l'utilisateur.
- Comptes utilisateurs.

## Équipe

- GermanViter
- Fckmads07
- dav-cip
- mohammadnasrhasmi-beep
