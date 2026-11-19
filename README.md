# Losse Hub — point d'entrée des deux applications

Ce dépôt contient **deux applications web indépendantes**. La page `index.html` à la racine
les regroupe pour éviter d'avoir à chercher le bon dossier et le bon mode de lancement.

| Application | Dossier | Rôle | Mode |
|---|---|---|---|
| **GestiProj** | `GestiProj/` | Gestion de projets, étapes, progression, chronologie | 100 % local, `file://` suffit |
| **Clair** | `google-sheets-dashboard/` | Analytique d'un Google Sheets, lecture seule | Serveur HTTP requis |

## Démarrage en une commande

```bash
python3 launch.py                 # http://localhost:8000
python3 launch.py --port 8001     # autre port
python3 launch.py --host 0.0.0.0  # accessible sur le réseau local
```

Sous Windows : double-cliquez `launch.bat` (ou `launch.sh` sous macOS/Linux).
Python 3.9+ suffit, **aucune dépendance à installer**. Le navigateur s'ouvre sur la page d'accueil.

Le serveur sert depuis la racine du dépôt :

- `/` → page d'accueil ;
- `/GestiProj/index.html` → GestiProj ;
- `/google-sheets-dashboard/index.html` → Clair ;
- `/api/public-sheet` → relais Google du mode « lien partagé » de Clair ;
- `/api/health` → contrôle d'état utilisé par la page d'accueil ;
- raccourcis `/gestiproj` et `/clair`.

Si le port demandé est occupé, le lanceur essaie les suivants (jusqu'à 10) et affiche l'adresse retenue.
Pensez à ajouter cette origine exacte dans Google Cloud si vous utilisez OAuth.

## Données réelles et navigation entre les applications

- **GestiProj démarre avec vos données réelles** : `GestiProj/data/projets.js` contient les 10 projets
  de l'export `gestiproj-2026-11-19.csv`. Ce fichier n'est lu que si le navigateur est vierge ;
  ensuite le `localStorage` fait foi.
  Pour régénérer ce fichier depuis un nouvel export :
  `python3 tools/import-gestiproj.py gestiproj-2026-11-19.csv`
  (séparateur `;` ou `,`, colonnes reconnues par leur nom). Dans un navigateur déjà utilisé,
  passez plutôt par **⬆ Importer CSV** dans GestiProj.
- **Bascule entre les deux applications** : GestiProj affiche un bouton **Clair · Analytics**
  dans son en-tête ; Clair affiche un bouton **GestiProj** dans sa barre latérale. Chacun ouvre
  l'autre application dans une **fenêtre séparée** — les deux restent donc utilisables côte à côte.
  Si le navigateur bloque les fenêtres, un onglet est ouvert à la place.
  La logique commune vit dans `assets/hub-nav.js`.

## Blocs repliables de Clair

Deux boutons, placés au-dessus des tendances, **affichent dans la même page** deux contenus
volumineux qui allongeaient beaucoup le dashboard :

| Bouton | Contenu révélé sur place |
|---|---|
| **Décisions & améliorations** | décisions formulaires, décisions sources et « Ce que disent vos données » |
| **La donnée derrière les chiffres** | tableau des 100 premières lignes filtrées |

- Contenus **masqués au chargement** : la page reste courte tant qu'on ne les demande pas.
- Révélation **dans la page courante** (défilement automatique jusqu'au contenu), avec un bouton ✕
  et la touche `Échap` pour refermer. Aucune fenêtre, aucun onglet, aucun rechargement.
- L'état `aria-expanded` est tenu à jour et le focus revient au bouton à la fermeture.
- À l'impression, les contenus masqués sont **réintégrés** pour que le rapport reste complet.

## Design et accessibilité

- **Logo en deux variantes** : la version standard sur fond clair, une version au requin noir
  éclairci sur fond sombre, choisie automatiquement selon le thème. Servi en **WebP** (poids /3)
  avec repli PNG.
- Focus clavier toujours visible, cibles tactiles de 40 px minimum, `aria-*` renseignés sur les
  boutons de révélation, information jamais portée par la seule couleur.
- Respect de `prefers-reduced-motion` : animations et défilement doux désactivés si l'utilisateur
  l'a demandé.
- Dimensions intrinsèques déclarées sur les images (pas de décalage de mise en page au chargement).
- Feuille d'impression dédiée : seuls les contenus utiles sont imprimés.

## Sans le lanceur

Rien n'est cassé : chaque application reste utilisable comme avant.

- **GestiProj** : ouvrez `GestiProj/index.html` par double-clic. Aucun serveur, aucune dépendance.
- **Clair** : `cd google-sheets-dashboard && python3 serve.py`. Les modules ES6 et le mode
  lien partagé exigent ce serveur, un simple double-clic sur `index.html` ne suffit pas.

> La page d'accueil détecte si elle est ouverte en `file://` et affiche alors un avertissement
> pour Clair. GestiProj reste pleinement fonctionnel dans ce cas.

## Ce qui n'a pas changé

- Les deux dossiers gardent leurs fichiers, leurs serveurs, leurs README et leurs tests.
- `google-sheets-dashboard/serve.py` a seulement vu son relais Google extrait dans une fonction
  réutilisable `public_sheet_data()`, appelée à l'identique par sa propre route. Comportement inchangé.
- Aucune donnée n'est partagée entre les deux applications : GestiProj utilise `localStorage`,
  Clair ne conserve rien en mémoire longue durée.

## Tests

```bash
cd google-sheets-dashboard && npm test     # tests unitaires de Clair (Node 20+, sans dépendance)
python3 -c "import ast,pathlib; [ast.parse(p.read_text()) for p in map(pathlib.Path, ['launch.py','google-sheets-dashboard/serve.py','tools/import-gestiproj.py'])]"
```
