# GestiProj — Gestion de projets & progression

Application web **classique et 100 % locale** (HTML + CSS + JavaScript pur, aucune dépendance, aucune installation, fonctionne hors ligne).

Chaque projet possède : **un nom, une durée, des étapes, une priorité**, mais aussi un responsable, une date de début, une description, une **progression calculée automatiquement** et un **statut calculé automatiquement**.

---

## 1. Démarrage rapide (10 secondes)

1. Dézippez `GestiProj.zip`.
2. **Double-cliquez sur `index.html`** → l'application s'ouvre dans votre navigateur.
3. C'est tout : **vos 10 projets réels sont déjà chargés** (issus de l'export `gestiproj-2026-11-19.csv`).

> Les données réelles vivent dans `data/projets.js`. Elles ne sont chargées **qu'au premier démarrage**,
> quand le navigateur ne contient encore aucune donnée. Ensuite, le `localStorage` fait foi : pour
> réimporter un nouvel export, utilisez **⬆ Importer CSV** dans l'application, ou régénérez le fichier avec
> `python3 tools/import-gestiproj.py votre-export.csv` (depuis la racine du dépôt) puis videz le stockage du site.

> Tout fonctionne en `file://` : aucune bibliothèque externe, aucun serveur, aucun compte.
> Les données sont sauvegardées dans le **localStorage du navigateur** (elles restent après fermeture).
>
> *Option* : si votre navigateur bloque le stockage local en `file://`, lancez `serveur-local.sh` (Mac/Linux) ou `serveur-local.bat` (Windows), puis ouvrez `http://localhost:8000`.

---

## 2. Fonctionnalités

| Fonction | Détail |
|---|---|
| **Tableau type Google Sheets** | Cellules éditables directement au clic (nom, priorité, responsable, début, durée). En-têtes cliquables pour trier. |
| **Étapes / tâches** | Cliquez sur « 2/4 étapes ▸ » : un panneau latéral permet d'ajouter, renommer, cocher, décocher et supprimer les étapes. |
| **Progression automatique** | `progression = étapes cochées / étapes totales`. Barre de progression + pourcentage, recalculés instantanément. |
| **Statut automatique** | `Terminé` (100 %), `En retard` (date de fin dépassée), `À venir` (début futur), sinon `En cours`. |
| **Chronologie (Gantt)** | Onglet « Chronologie » : durée de chaque projet, avancement réel, ligne rouge = aujourd'hui. |
| **Tableau de bord** | 5 indicateurs : projets, terminés, en retard, étapes réalisées, progression moyenne. |
| **Recherche & filtres** | Recherche plein texte (projet, responsable, étapes…) + filtre priorité + filtre statut. |
| **Import / Export CSV** | Compatible Excel et **Google Sheets** (séparateur `;`, BOM UTF-8 pour les accents). |
| **Coller de Sheets** | Copiez une plage de cellules dans Google Sheets (`Ctrl/Cmd+C`), cliquez sur « 📋 Coller de Sheets », collez (`Ctrl/Cmd+V`), puis « Fusionner » ou « Remplacer ». |
| **Sauvegarde JSON** | Export/restauration complète (idéal pour changer de navigateur). |
| **Thème clair / sombre** | Bouton 🌙 en haut à droite. |
| **Duplication / suppression** | Icônes ✎ ⧉ 🗑 sur chaque ligne. |

### Basculer vers Clair
Le bouton **Clair · Analytics** en haut à droite ouvre l'autre application du dépôt
(`google-sheets-dashboard/`) dans une **fenêtre séparée**, sans fermer GestiProj.
Les deux outils restent donc côte à côte. Si le navigateur bloque la fenêtre,
un onglet est ouvert à la place.

### Raccourcis
- `Entrée` dans « Nom » → enregistre le projet.
- `Entrée` dans « Ajouter une étape » → ajoute l'étape.
- `Échap` → ferme la fenêtre ou le panneau ouvert.

---

## 3. La « base de données Google Sheet » — deux méthodes

### Méthode A — Simple, sans configuration (recommandé pour débuter)

L'application se comporte comme un tableur : votre Google Sheet *est* la base de données.

1. Dans l'application : **⬇ Exporter CSV** → vous obtenez `gestiproj-2026-10-26.csv`.
2. Dans Google Sheets : `Fichier > Importer > Importer le fichier`, séparateur **point-virgule**.
3. Modifiez vos lignes dans Sheets, sélectionnez la plage (en-têtes inclus), `Ctrl/Cmd+C`.
4. Dans l'application : **📋 Coller de Sheets** → `Ctrl/Cmd+V` → **Fusionner / mettre à jour** (ou **Remplacer tout**).

Le fichier `exemple-projets.csv` fourni montre le format attendu.

**Colonnes reconnues** (les noms sont tolérants : `Nom`, `Projet`, `Titre`, `Name`… ; accents et casse ignorés) :

| Colonne | Obligatoire | Format |
|---|---|---|
| `ID` | non | Identifiant stable ; permet la mise à jour lors d'une fusion |
| `Nom` | **oui** | Texte |
| `Priorité` | non | `Haute`, `Moyenne`, `Basse` |
| `Responsable` | non | Texte |
| `Début` | non | `AAAA-MM-JJ` ou `JJ/MM/AAAA` |
| `Durée` | non | Nombre de jours (si absent, calculé depuis `Début` et `Fin`) |
| `Fin` | non | Calculée automatiquement = Début + Durée − 1 |
| `Étapes` | non | `[x] Étape faite \| [ ] Étape à faire` (séparateur `\|`) |
| `Progression`, `Statut` | non | Ignorés à l'import (recalculés) |
| `Description` | non | Texte libre |

### Méthode B — Synchronisation directe avec une vraie Google Sheet (optionnel)

Permet les boutons **⬆ Envoyer** et **⬇ Recevoir** depuis l'application.

1. Créez une **nouvelle Google Sheet** (ou ouvrez-en une).
2. `Extensions > Apps Script`. Supprimez le contenu de `Code.gs`, collez le contenu de **`google-sheets/Code.gs`** fourni dans ce ZIP.
3. Modifiez la ligne `var TOKEN = 'CHANGEZ-MOI-12345';` → mettez votre propre phrase secrète. Enregistrez (💾).
4. `Déployer > Nouveau déploiement` → type **Application web** :
   - **Exécuter en tant que :** *Moi*
   - **Qui a accès :** *Tout le monde* ← indispensable
   - Autorisez les permissions demandées (Google affiche une alerte « application non vérifiée » → `Avancé > Continuer`).
5. Copiez l'**URL de l'application web** (elle se termine par `/exec`).
6. Dans GestiProj : **🔄 Sync Google Sheet** → collez l'URL + le même TOKEN → **Tester** (doit afficher `✅ Connexion OK`).
7. Utilisez **⬆ Envoyer** pour pousser vos projets vers la Sheet, **⬇ Recevoir** pour les récupérer.

> Le script crée automatiquement l'onglet `Projets` avec les bonnes colonnes.
> La lecture passe par JSONP (balise `<script>`), l'écriture par un POST simple : cela évite les blocages CORS depuis un fichier local.
> **Attention** : « ⬇ Recevoir » remplace les données locales — faites d'abord une sauvegarde JSON si besoin.

---

## 4. Structure du projet

```
GestiProj/
├── index.html                 ← L'APPLICATION COMPLÈTE (HTML + CSS + JS intégrés)
├── data/
│   └── projets.js             ← Données réelles chargées au premier démarrage
├── exemple-projets.csv        ← Exemple de base de données compatible Google Sheets
├── README.md                  ← Ce fichier
├── google-sheets/
│   └── Code.gs                ← Script Apps Script pour la synchronisation (optionnel)
├── serveur-local.sh           ← Serveur local optionnel (Mac / Linux)
└── serveur-local.bat          ← Serveur local optionnel (Windows)
```

Tout tient dans un seul fichier HTML : vous pouvez le copier, l'envoyer par e-mail, le mettre sur une clé USB — il fonctionnera partout.

---

## 5. Dépannage

| Problème | Solution |
|---|---|
| Les données disparaissent | Elles sont liées au **navigateur + au domaine**. Ouvrez toujours le même fichier avec le même navigateur, ou utilisez **💾 Sauvegarde JSON**. Ne naviguez pas en mode privé. |
| Accents cassés à l'import | Le CSV exporté contient un BOM UTF-8 : privilégiez ⬇ Exporter CSV puis réimportez ce même fichier. |
| « Connexion KO » dans la sync | Vérifiez : URL qui finit par `/exec`, déploiement accessible à **Tout le monde**, TOKEN identique des deux côtés, nouveau déploiement après chaque modification du script. |
| La Google Sheet ne se met pas à jour | Le navigateur ne peut pas lire la réponse du POST (mode `no-cors`). Attendez 2 s, rafraîchissez la Sheet, puis faites **Tester** (le compteur de lignes doit avoir changé). |
| Je veux repartir de zéro | Bouton **Réinitialiser la démo** en bas du tableau, ou videz le localStorage (`F12 > Application > Local Storage`). |

---

## 6. Personnalisation rapide

Dans `index.html`, repérez ces constantes au début du `<script>` :

```js
const KEY = 'gestiproj.v1';                       // clé de stockage
const PRIORITIES = ['Haute','Moyenne','Basse'];  // vos priorités
const STATUSES   = ['Terminé','En cours', …];    // vos statuts
```

Pour changer les couleurs, modifiez les variables CSS `--accent`, `--red`, `--amber`, `--blue` dans le bloc `:root` du `<style>`.

---

**Bonne gestion de projets !** 🚀
