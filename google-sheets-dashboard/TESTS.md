# Vérifications de livraison

## Ajout : lien partagé réel
- Accès anonyme au lien fourni : réussi.
- Liste des deux onglets Sheet1 et Leads : réussie.
- Présélection de Leads via gid du lien : réussie.
- Aperçu, validation et analyse réelle : 125 lignes chargées, 8 formulaires, 0 date invalide, 0 identifiant répété ou vide. Aucun contenu personnel copié dans les fichiers du projet.
- Actualisation forcée sans OAuth : réussie. Aucune erreur JavaScript non interceptée pendant le parcours.
- Aucun appel d’écriture Google ; seules des requêtes de lecture anonyme ont été effectuées.
- Ce nouveau mode repose sur le serveur Python fourni, utilisé comme relais local en mémoire.


Vérifications réalisées le 19 novembre 2026, sous Linux, Node.js 20 et Chromium headless via Playwright.

## Réussies
- `npm test` : 9 tests unitaires réussis (dates, URL/ID, en-têtes/vides, calendrier, filtres, variation sans base, seuils des prévisions, régression/bornes, neutralisation des formules CSV).
- Vérification syntaxique des modules JavaScript.
- Ouverture HTTP locale et chargement du mode démonstration : 643 lignes fictives, 3 formulaires ; filtre SEO : 181 lignes.
- Filtrage formulaire/source, réinitialisation et bascule sombre.
- Chargement de Chart.js ; téléchargements CSV, PDF et PNG déclenchés avec les noms attendus. Le contenu de chaque fichier n'a pas fait l'objet d'une validation automatisée exhaustive.
- Largeurs 1440 et 390 pixels : pas de débordement horizontal global, y compris après redimensionnement. Les zones de tableaux et navigation restent défilables.
- Aucune erreur JavaScript non interceptée pendant ce parcours.

## Non vérifiées en conditions réelles
- OAuth Google, consentement, lecture d'une feuille privée, quotas, expiration/révocation et rafraîchissement d'une source réelle : nécessitent votre Client ID et un compte autorisé.
- Exécution de `launch.bat` sous Windows (environnement de vérification Linux).
- Safari, Firefox, impression physique et exhaustivité de toutes les combinaisons de données.

Le mode démonstration utilise uniquement des données synthétiques et n'appelle pas Sheets API. Aucune feuille Google n'a été modifiée pour ce projet.

## Reproduire
`npm test` ne demande aucune dépendance npm. Pour le parcours navigateur facultatif : installer Playwright dans un environnement de test (`npm install --no-save playwright`, puis `npx playwright install chromium`), lancer le serveur sur le port 8000 et exécuter `node tests/browser-smoke.cjs`. Ce script produit des captures locales et affiche les observations ; il ne teste pas la connexion Google.

## Mise à jour appareils / codes postaux
- 11 tests unitaires réussis, dont classification des appareils, User-Agent vide/robot/iPad, codes postaux ambigus, invalides et zéro initial.
- Parcours Chromium sur la feuille réelle : mapping automatique `user_agent` colonne 41 et `code_postal` colonne 10 (numérotation humaine).
- Au moment de ce nouveau test : 127 leads (la feuille évolue), PC/ordinateur 53, Android 47, iPhone 20, inconnus 6, iPad/tablette 1. Somme = 127.
- Tableau géographique : 124 catégories, volumes totalisant 127 ; graphique limité aux 10 premières. Aucun classement de commune unique à partir d’un code partagé.
- Filtre SEO : 4 leads et somme des catégories appareil = 4. Aucune erreur JavaScript non interceptée.
- Parcours démonstration ordinateur/mobile, CSV/PDF/PNG et absence de débordement horizontal : réussis après modification.

## Mise à jour statistiques / conseils / couleurs
- 14 tests unitaires réussis, dont absence de données, attribution absente, faible volume, absence de base, filtre unique, variation et concentration.
- Chromium sur la source réelle : tableaux alimentés pour les 6 blocs (10 périodes, 8 formulaires, 4 sources, 5 catégories d’appareils, 124 catégories géographiques et 30 dates de projection au moment du test).
- Conseils formulaires/sources générés ; filtre source unique correctement signalé ; sélection sans lead affiche Données insuffisantes au lieu d’une recommandation de croissance.
- Vérification des accents des cartes et parcours démonstration : filtre, thème sombre, export CSV/PDF/PNG, affichage 1440/390 pixels sans débordement global ; aucune erreur JavaScript non interceptée.
- Pas de mesure d’impact commercial des recommandations : ce sont des hypothèses d’amélioration à tester, pas des gains démontrés.
