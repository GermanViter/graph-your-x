# Graph Your X

**Voyez tout ce qui vous sépare du cours ou du sujet que vous voulez apprendre.**

Projet réalisé pour **HackDécouverte 2026**.

Vous choisissez un objectif (ex. *Machine Learning*) et Graph Your X affiche un graphe de tous les
préalables à maîtriser avant : les préalables directs, mais aussi les préalables des préalables.
Vous cochez ce que vous avez déjà fait, et la carte vous montre ce que vous pouvez prendre maintenant.

Ça marche pour n'importe quel arbre de connaissances : un programme d'études, un arbre de compétences,
un parcours de certification ou une feuille de route d'apprentissage.

## Fonctionnalités

### Le graphe

- **Toute la chaîne de préalables** : en sélectionnant un cours, toute sa chaîne de préalables
  s'illumine, pas seulement les préalables directs.
- **Trois statuts** : *Completed* (fait), *Ready to take* (tous les préalables sont faits) et
  *Locked* (il manque encore des préalables). Une légende sous le graphe les explique.
- **Panneau de détails** : pour le cours sélectionné, on voit son statut, la liste des cours qu'il
  reste à faire avant et ce qu'il débloque (*Opens up*).
- **Navigation** : zoom et ajustement à l'écran.

### Le suivi de progression

- Marquer un cours comme fait (ou le décocher), ou effacer toute la progression.
- Une **barre de progression** : *X of Y courses completed*.
- La liste **Ready to take now** : les cours accessibles tout de suite. Un clic les sélectionne
  dans le graphe.
- La progression et le parcours sont **sauvegardés dans le navigateur** (`localStorage`).

### Gérer son parcours

Le bouton **Manage path** ouvre un éditeur avec trois onglets :

- **Catalog** : chercher dans le catalogue par code ou par nom, et cocher un cours pour l'ajouter
  avec tous ses préalables. Décocher un cours retire aussi ceux qui en dépendent. Filtre
  *Selected only* et bouton Undo.
- **Add a step** : créer une étape personnalisée et choisir ses préalables parmi les étapes existantes.
- **Edit text** : écrire le parcours en texte, une étape par ligne :

  ```
  HTML basics:
  CSS basics:
    Build a website: HTML basics, CSS basics
      Publish a website: Build a website
  ```

  Le côté droit vide veut dire « aucun préalable ». L'éditeur gère l'indentation (Tab / Shift+Tab),
  peut remettre le texte en forme et valide le contenu avant de l'appliquer : noms en double,
  format invalide, cycles. Supprimer une étape retire aussi les étapes qui en dépendent.

On peut annuler le dernier changement ou revenir au **parcours d'exemple** (15 cours d'informatique,
d'*Intro Programming* jusqu'à *Deep Learning*).

### Les pages

| Page | Contenu |
|---|---|
| `/` | Page d'accueil avec une démo en direct du graphe (Machine Learning sélectionné), les fonctionnalités et l'éditeur |
| `/graph` | Le visualiseur complet : progression, graphe, détails et gestion du parcours |

### L'API

Un backend FastAPI sert les sujets et leurs graphes de préalables à partir d'une base SQLite
(voir [API](#api)). Chaque lien y est marqué **obligatoire** (`required`) ou **conseillé**
(`recommended`), et chaque concept a une catégorie et une difficulté de 1 à 5.

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
│   ├── backend/                # API FastAPI
│   │   ├── main.py             # routes et CORS
│   │   ├── db.py               # connexion SQLite, tables et requêtes
│   │   ├── models.py           # types du JSON (Pydantic)
│   │   ├── seed.py             # sujets de départ
│   │   ├── tests/              # tests pytest (API et base de données)
│   │   └── requirements.txt
│   └── frontend/               # app React + Vite
│       ├── data.json           # catalogue de cours d'exemple
│       └── src/
│           ├── pages/          # accueil (/) et graphe (/graph)
│           ├── components/     # graphe, détails, légende, éditeur de parcours, layout
│           ├── hooks/          # usePrereqPlanner : tout l'état du planificateur
│           ├── services/       # chargement du catalogue, édition du parcours (+ tests)
│           └── global.css      # thème (couleurs, polices)
├── Dockerfile                  # image unique : frontend compilé + API
├── compose.yaml                # `docker compose up --build`
├── CLAUDE.md                   # conventions du projet
└── package.json                # scripts pour lancer le front depuis la racine
```

## Lancer le projet

### Avec Docker (le plus simple)

Il faut seulement [Docker](https://docs.docker.com/get-started/get-docker/). Une seule commande,
à la racine du projet, construit et lance toute l'application (frontend et backend) :

```bash
docker compose up --build
```

L'app est sur http://localhost:8000 (et la documentation de l'API sur http://localhost:8000/docs).
`Ctrl+C` arrête l'application.

- Le port 8000 est déjà pris ? `APP_PORT=3000 docker compose up --build`, puis ouvrez
  http://localhost:3000.
- Sans Docker Compose :
  `docker build -t graph-your-x . && docker run --rm -p 8000:8000 graph-your-x`
- La base SQLite est créée et remplie au démarrage du conteneur. La progression de l'utilisateur
  reste dans le navigateur (`localStorage`).

Dans l'image, le frontend est compilé en fichiers statiques et c'est FastAPI qui sert à la fois
ces fichiers et l'API, sur un seul port (voir `Dockerfile`).

### Sans Docker (pour développer)

Il faut **Python 3.10+** et **Node.js 20+**. Le backend et le frontend roulent en même temps,
dans deux terminaux séparés.

#### Backend (port 8000)

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

#### Frontend (port 5173)

```bash
cd apps/frontend
npm install
npm run dev
```

L'app est sur http://localhost:5173.

Par défaut, le catalogue de l'onglet *Catalog* vient de `apps/frontend/data.json`. Pour le charger
depuis une API, définissez `VITE_COURSES_API_URL` dans `apps/frontend/.env`. L'adresse doit renvoyer
une liste au format `[{ "id": "...", "name": "...", "prereqs": ["..."] }]`.

## Tests

```bash
# Backend (depuis apps/backend)
pip install pytest httpx
python -m pytest

# Frontend (depuis apps/frontend)
npm test
```

- **Backend** (`apps/backend/tests/`) : les routes de l'API (contrat JSON, 404, CORS) et la base de
  données (chaîne de préalables complète, arrêt sur des données cycliques, sauvegarde sans doublons,
  contraintes du schéma, rollback en cas d'erreur).
- **Frontend** (`src/services/__tests__/`) : le chargement et la validation du catalogue (`api.ts`)
  et l'ajout et le retrait de cours avec leurs dépendances (`catalog.ts`), avec Vitest.

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

Le graphe complet d'un sujet est obtenu avec une requête récursive (`WITH RECURSIVE`), qui s'arrête
même si les données contiennent un cycle. Les concepts sont partagés entre les sujets :
*Python* sert autant au Machine Learning qu'au reste.

Sujets inclus au départ : **Machine Learning**, **Web Development**, **Cybersecurity**.
Pour en ajouter, modifiez `apps/backend/seed.py` puis relancez `python seed.py`
(le script peut être relancé sans créer de doublons).

## Pistes pour la suite

- Brancher le graphe du frontend sur l'API au lieu du catalogue d'exemple.
- Générer avec une IA les préalables d'un sujet qui n'est pas encore dans la base, puis les valider
  (pas de cycles, tous les concepts reliés à l'objectif) avant de les sauvegarder.
  La base est déjà prête : `db.py` sait sauvegarder une roadmap validée (`save_roadmap`)
  et lister les concepts existants pour que l'IA les réutilise (`list_concepts`).
- Afficher dans le graphe la différence entre préalables obligatoires et conseillés.
- Importer de vrais catalogues de cours de cégeps et d'universités.
- Comptes utilisateurs pour retrouver sa progression sur plusieurs appareils.

## Équipe

- GermanViter
- Fckmads07
- dav-cip
- mohammadnasrhasmi-beep
