# Logo Losse

Logo fourni par le propriétaire du dépôt : **deux requins-marteaux en formation yin-yang**.
Fichier source `Requin_yin-yang_noir_et_blanc__1_-removebg-preview.png` (fond déjà détouré,
vrai canal alpha). Il a été simplement recadré et décliné, **sans retouche de l'œuvre**.

## Deux variantes, pour deux fonds

Le logo étant noir et blanc, le requin noir disparaît sur un fond sombre. Deux jeux de fichiers
sont donc fournis :

| Variante | Fond | Fichiers |
|---|---|---|
| **Standard** | clair | `losse-logo-*.png` / `.webp` |
| **Claire** | sombre — corps noir éclairci, contours conservés | `losse-logo-light-*.png` / `.webp` |

Le choix est automatique selon le thème (voir `applyLogo()` dans `index.html`,
`applyTheme()` dans GestiProj, `applyBrandLogo()` dans Clair). **Ne pas afficher la variante
standard sur un fond sombre** : le requin noir y devient invisible.

## Fichiers

| Fichier | Taille | Usage |
|---|---|---|
| `losse-logo.png` | 1024 px | source haute résolution (hors ligne, partage) |
| `losse-logo-512.png` / `.webp` | 512 px | usage large / print |
| `losse-logo-256.png` / `.webp` | 256 px | hero de la page d'accueil |
| `losse-logo-192.png` | 192 px | icône de partage, logo de Clair |
| `losse-logo-96.png` | 96 px | en-tête de GestiProj, marque du hub |
| `losse-logo-light-*` | mêmes tailles | variante pour les thèmes sombres |
| `losse-mark*.png` | 512 / 64 | version carrée centrée |
| `favicon.ico` | 16/32/48/64 | onglet du navigateur |
| `apple-touch-icon.png` | 180 px | écran d'accueil iOS/macOS |

Les `.webp` sont servis en priorité par le hub quand le navigateur les accepte (poids divisé
par ~3), avec repli automatique en PNG.

## Couleurs

Noir profond et gris bleuté (`#e9eef5`). Contraste vérifié sur fond clair comme sur fond sombre.
