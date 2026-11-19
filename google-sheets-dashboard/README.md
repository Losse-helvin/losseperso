# Nouveau : démarrer avec un lien partagé (sans OAuth)

1. Décompressez le dossier et installez Python 3 si nécessaire.
2. Sous Windows, double-cliquez sur `launch.bat`. Sinon : `python serve.py`.
3. Dans la page locale, gardez **Lien partagé — sans connexion Google**.
4. Collez votre URL (votre lien est prérempli), cliquez sur **Connecter le fichier**, choisissez **Leads**, puis **Prévisualiser** et **Valider et analyser cet onglet**.

Aucun compte Google, Client ID, clé API ou publication Web n’est nécessaire dans ce mode. Le fichier doit être partagé avec **Tous les utilisateurs disposant du lien → Lecteur**, et le téléchargement doit être autorisé. Une connexion Internet reste nécessaire.

Le petit serveur Python fourni effectue uniquement des lectures HTTPS auprès de Google : liste des onglets via la vue HTML partagée, contenu de l’onglet via son export CSV authentification libre. Il ne stocke pas les données et n’utilise aucun service proxy tiers. Ce mode nécessite **ce serveur**, pas un simple double-clic sur index.html ni un serveur statique générique. Les endpoints de partage Google peuvent évoluer ; un refus est affiché explicitement, sans bascule silencieuse vers une autre source.

Le fuseau du fichier n’est pas fourni par l’export partagé : **le fuseau du navigateur est utilisé** pour les calculs temporels. Les valeurs sont celles de l’export CSV (valeurs affichées), pas les valeurs brutes de Sheets API. Vérifiez donc l’aperçu, les dates et le mapping. Le cache temporaire reste en mémoire (30 secondes), et le bouton Actualiser force une relecture. La taille maximale d’une réponse est de 25 Mo et 2 millions de cellules. Un nom d’onglet modifié sera actualisé lors d’une nouvelle connexion au fichier.

**Confidentialité :** ce partage permet à toute personne ayant le lien de lire les données, y compris les coordonnées éventuelles. L’application reste strictement en lecture seule. Aucun export n’est inclus dans cette archive ; seul le lien du fichier est prérempli. Pour un fichier sensible, repassez le partage en accès limité et utilisez le mode **Fichier privé — connexion Google OAuth**, décrit ci-dessous.

Vérification réelle sur le lien fourni : liste Sheet1/Leads, aperçu, analyse de 125 lignes sur Leads et rafraîchissement réussis, sans OAuth et sans écriture. Ce résultat est un instantané : la feuille peut ensuite changer.

---

# Clair — Google Sheets Analytics

Application web locale HTML/CSS/JavaScript ES6, sans framework ni backend métier. **Mode privé : aucune modification de Google Sheets** : appels HTTP GET à Sheets API v4, scope unique `https://www.googleapis.com/auth/spreadsheets.readonly`. Les fichiers n'ont jamais besoin d'être publics.

## Démarrage rapide

1. Installez **Python 3.9+** (cochez « Add Python to PATH » sous Windows).
2. Décompressez tout le dossier. Ne lancez pas `index.html` en double-cliquant : les modules ES6 et OAuth nécessitent un serveur HTTP.
3. Configurez votre Client ID selon la procédure Google Cloud ci-dessous dans `config/config.js`.
4. Double-cliquez **launch.bat**. Le serveur local ouvre automatiquement **http://localhost:8000**. Conservez sa fenêtre ouverte.
5. Cliquez **Connecter avec Google**, puis choisissez le compte ayant accès au fichier privé.
6. Collez son URL, cliquez **Connecter le fichier**, choisissez un onglet, puis **Prévisualiser**.
7. Vérifiez la ligne d'en-têtes et l'association de chaque champ. Cliquez **Valider et analyser cet onglet**.
8. Choisissez une synchronisation de **1, 5 ou 15 minutes**, ou actualisez manuellement.

Sur macOS/Linux : `python3 serve.py`. Sur Windows en terminal : `py -3 serve.py`.
Le port déjà utilisé est signalé sans tuer de processus. Le serveur écoute uniquement sur 127.0.0.1 par défaut et ne propose aucune route d'écriture. Pour changer le port : `python serve.py --port 8001` et ajoutez cette origine exacte dans Google Cloud.

## Configuration Google Cloud / OAuth 2.0

Les intitulés Google peuvent varier selon la version de la console.

1. Ouvrez https://console.cloud.google.com/ et créez un **projet**, ou choisissez un projet dédié.
2. Dans **API et services → Bibliothèque**, recherchez **Google Sheets API** puis cliquez **Activer**.
3. Dans **Google Auth Platform** (ou **API et services → Écran de consentement OAuth**), renseignez le nom de l'application, l'adresse d'assistance et le contact développeur.
4. Choisissez **Interne** si votre organisation Google Workspace le permet, sinon **Externe**. Pour usage personnel, laissez l'application en **Testing / Test** et ajoutez votre compte à la liste des **utilisateurs test**.
5. Dans **Data Access / Accès aux données**, ajoutez **exclusivement** :
   `https://www.googleapis.com/auth/spreadsheets.readonly`
   N'ajoutez ni Drive, ni email, ni profile, ni droit d'écriture. Une distribution externe en production peut nécessiter une vérification Google pour ce scope sensible.
6. Dans **Clients / Identifiants → Créer un identifiant OAuth 2.0**, choisissez **Application Web**, pas « Application de bureau ».
7. Dans **Origines JavaScript autorisées**, ajoutez exactement :
   `http://localhost:8000`
   Pas de chemin, pas de `/index.html`, pas de barre finale. Si vous utilisez `127.0.0.1`, ajoutez aussi `http://127.0.0.1:8000`.
8. Aucun URI de redirection n'est nécessaire : l'application utilise le **modèle token en popup Google Identity Services**.
9. Copiez le **Client ID** (qui se termine généralement par `.apps.googleusercontent.com`). Ne copiez pas de client secret.
10. Dans `config/config.js`, renseignez :

   ```js
   window.APP_CONFIG = {
     clientId: 'VOTRE_CLIENT_ID.apps.googleusercontent.com',
     defaultSheetUrl: '',
     maxCells: 2000000
   };
   ```

   `config/config.example.js` fournit le modèle. Le Client ID est un identifiant public, pas un secret. Ne placez aucun jeton, secret ou mot de passe dans ces fichiers.
11. Patientez si Google n'a pas encore propagé la configuration, puis rechargez la page. Autorisez les popups Google.

### Aperçu hébergé dans cette conversation

Le projet peut être prévisualisé ici en démonstration. **Cela ne signifie pas qu'OAuth réel a été testé avec votre compte.** Pour l'authentification dans un aperçu distant, il faudrait autoriser son origine HTTPS exacte dans votre client OAuth et ouvrir l'aperçu dans un onglet autonome ; les popups peuvent être bloquées dans un iframe. Préférez le lancement local prévu ci-dessus. Ne réutilisez pas une origine d'aperçu temporaire pour une diffusion publique.

## Blocs repliables (ajout)

Le dashboard était long à parcourir. Deux **boutons de révélation** sont placés au-dessus des
tendances ; ils affichent le contenu **dans la page courante** :

- **Décisions & améliorations** : décisions formulaires, décisions sources et
  « Ce que disent vos données » ;
- **La donnée derrière les chiffres** : les 100 premières lignes filtrées.

Les deux zones sont masquées au chargement (`hidden`), s'ouvrent par le bouton (défilement doux
jusqu'au contenu), se referment par ✕ ou `Échap`. Elles restent à jour à chaque changement de
filtre et se referment quand la source de données est réinitialisée. En impression, les zones
masquées sont réintégrées afin de ne rien perdre du rapport.

## Performance (ajout)

- Le **référentiel postal** (5 800 codes, ~580 Ko) n'est plus importé avec le module de traitement :
  il est stocké en `js/postal-reference.json` et **téléchargé à la demande**, uniquement si une
  colonne code postal est effectivement mappée. Sans colonne code postal, zéro octet chargé.
- Si le référentiel est indisponible, l'analyse continue : les villes simplement ne sont pas
  déduites du code postal, avec un message explicite (aucune ville inventée).
- Les tests injectent le référentiel via `setPostalReference()` au lieu de l'importer.
- Logo servi en **WebP** quand le navigateur l'accepte, avec repli PNG. La barre latérale étant
  toujours sombre, seul le requin blanc du logo y est visible — effet volontaire, ne pas ajouter
  de plaque claire ni de variante recolorée.

## Fonctionnalités

- Métadonnées du classeur et liste de ses onglets, chargement par blocs de 2 000 lignes.
- Aperçu de 5 lignes × 12 colonnes et choix de la ligne d'en-têtes parmi les 30 premières ; mapping manuel des champs.
- KPI : lignes/leads filtrés, comparaison de périodes, formulaires distincts, moyenne par jour, volumes aujourd'hui/semaine/mois.
- Courbe quotidienne/hebdomadaire/mensuelle ; MM7 quotidienne ; comparaison alignée à la période courante.
- Formulaires (top 12, comparaison de volumes), sources (top 8 + Autres), campagnes (top 10), villes/régions (top 10).
- Couleur déterministe par libellé, identique lors des filtres et rafraîchissements ; des collisions de couleurs sont possibles avec de nombreuses catégories.
- Filtres conjoints date, formulaire, source, campagne, ville et solution ; solutions multiples séparées par virgule, point-virgule, retour à la ligne ou `|`.
- Insights calculés, variation inhabituelle sur le dernier jour complet si au moins 14 jours complets.
- Projections MM7 à 7/30 jours ; scénario linéaire seulement après 14 jours complets ; blocage des projections d'un formulaire sélectionné avant 28 jours complets et 30 leads.
- Synchronisation 1/5/15 min ; prévention des appels qui se chevauchent, cache mémoire 30 s pour la lecture d'aperçu, retry limité sur quotas/erreurs transitoires.
- Export CSV **analytique sans coordonnées ni ID lead**, PNG par graphique, PDF multipage et impression.
- Mode clair/sombre par `data-theme` sur `<html>`, appliqué avant le premier rendu : choix mémorisé
  dans `localStorage['losse-theme']`, partagé avec le hub et GestiProj, suivi du système par défaut.
  Le réglage est accessible dans la barre latérale et, sur mobile, dans la barre supérieure.
- Responsive (barre latérale repliée sous 800 px).
- Démonstration locale fictive, sans appel à Google Sheets.

## Définition des métriques et limites statistiques

- **Un lead = une ligne non vide après les en-têtes**. Les identifiants répétés et vides sont comptés comme des lignes et signalés, jamais supprimés ni dédupliqués. Sans colonne id_lead, il s'agit de lignes, non de personnes uniques.
- Champs reconnus : horodatage/timestamp/date/created_at, id_lead/lead_id, form_id, source, utm_campaign, ville/city, region/state, solution. Le mapping permet d'adapter les autres noms.
- Dates acceptées : nombres de série Sheets (réponse API non formatée), `YYYY-MM-DD`, dates françaises `JJ/MM/AAAA` ou `JJ.MM.AAAA`, avec heure optionnelle. Les chaînes ambiguës ou impossibles sont rejetées. Les dates textuelles sont prises au jour écrit ; pas de conversion implicite des offsets des timestamps. Les dates série Sheets suivent le fuseau du classeur. « Aujourd'hui » utilise le fuseau déclaré par Google Sheets.
- Sans filtre de dates, toutes les lignes sont comptées, même celles sans date ; celles-ci ne figurent pas dans les graphiques temporels. Les dates futures ne figurent pas dans la période implicite terminant aujourd'hui. Choisissez une date de fin explicite pour analyser un jeu futur. Les KPI agrégés peuvent donc différer des sommes temporelles si des dates sont absentes/futures : contrôler la qualité.
- Par défaut : première date observée → aujourd'hui. Avec filtres : dates inclusives choisies. Semaine à partir du lundi. Période précédente immédiatement antérieure de même durée, avec les mêmes filtres non temporels. La comparaison ne prouve pas que la collecte existait durant la période précédente.
- Moyenne quotidienne calculée sur les jours calendaires, zéros inclus. Maximum 3 660 jours par analyse.
- Formulaires distincts : valeurs renseignées uniquement. Les autres répartitions montrent les valeurs manquantes, sauf campagnes et géographie où les non-renseignés sont exclus.
- **Aucun taux de conversion ou de complétion de formulaire n'est inventé.** Sans abandons ni schéma des champs obligatoires, seul un indicateur de remplissage de cellules est calculé et explicitement nommé. Aucun CPL, ROAS ni rentabilité.
- Solutions multiples : une ligne peut contribuer à plusieurs solutions. Les séparateurs dans une désignation unique doivent être adaptés dans `splitSolutions` si besoin.
- Les régions ne sont jamais déduites arbitrairement des villes ou des codes postaux. Si la colonne région manque, le graphique « Régions » reste vide.
- Prévisions : jours complets seulement, capture supposée continue, campagnes supposées stables ; les jours sans lignes valent zéro, mais aucune interruption de tracking n'est identifiable automatiquement. Historique complet de la période sélectionnée pour la régression, 7 derniers jours complets pour la MM7. Scénario linéaire non retenu comme prévision principale.
- Bornes **journalières indicatives**, moyenne ± 1,96 √(max(variance empirique des 7 jours, moyenne) × 8/7), plancher zéro. Ce n'est pas un intervalle calibré : aucun backtest, aucune saisonnalité ni changement de campagne pris en compte. Ne pas sommer les bornes pour obtenir un intervalle mensuel. Sur une sélection passée, les projections suivent la dernière journée complète de cette sélection, pas aujourd'hui.
- Une moyenne quotidienne n'est pas ajustée à la fraction écoulée d'aujourd'hui. Les semaines/mois en cours peuvent être partiels.
- L'onglet doit être tabulaire. Limite de sécurité : 2 millions de cellules **allouées** par onglet, configurable. Pas de pagination serveur Google des lignes : lecture par blocs, pas de troncature silencieuse. Pour un énorme fichier, créez un onglet analytique dédié par vos propres moyens.

## Confidentialité et sécurité

- Aucun backend applicatif, aucune télémétrie ; seuls les services Google (API ou export partagé selon le mode) et Google Fonts (polices optionnelles) sont contactés. Ni CSV public, ni publication Web, ni proxy externe.
- Jeton OAuth uniquement en variable mémoire ; renouvellement uniquement sur action de l'utilisateur (pas de refresh token). Expiration anticipée d'une minute : reconnexion requise. Déconnexion : révocation du jeton et suppression des données/caches de l'application.
- Le scope readonly permet de lire les classeurs accessibles au compte, pas uniquement l'URL sélectionnée : le choix de l'URL limite le comportement de cette application, pas la portée du consentement OAuth.
- Les valeurs des cellules sont rendues via `textContent`, jamais comme du HTML. Le CSV protège les valeurs qui pourraient être interprétées comme des formules.
- L'aperçu privé peut afficher des informations personnelles puisqu'il sert à vérifier le tableau source. Le dashboard et le CSV ne reprennent pas les coordonnées ni les ID lead. **Les dimensions libres** (nom de campagne, solution, ville…) pourraient elles-mêmes contenir des informations personnelles : vérifiez leur contenu avant tout export ou partage.
- Les bibliothèques Chart.js 4.4.8, Lucide 0.468.0 et jsPDF 2.5.2 sont incluses dans `assets/vendor/`, avec leurs licences. La démonstration, les graphiques et les exports ne dépendent donc pas des CDN. Google Fonts est optionnel (polices système de secours). La connexion et la lecture de Google Sheets nécessitent Internet. Auditez les dépendances pour une politique de sécurité renforcée.
- Pas de mode hors-ligne complet et pas de stockage persistant de données. Ne partagez pas le poste/session navigateur tant que les données sont affichées. Le serveur local par défaut n'est pas exposé au réseau.

## Dépannage

| Problème | Action |
|---|---|
| Client ID manquant | Modifier config/config.js, enregistrer et recharger |
| origin_mismatch | Vérifier l'origine exacte, port compris, et le type Application Web |
| access_denied / utilisateur test | Ajouter le compte dans l'audience de test et vérifier les règles Workspace |
| API 403 | Activer Sheets API, vérifier les permissions du fichier et les règles de l'organisation |
| API 404 | Vérifier l'URL et le compte autorisé |
| API 429 | Espacer la synchronisation ; 3 tentatives maximum par requête |
| Session expirée | Recliquer sur Connecter avec Google ; aucune reconduction en arrière-plan |
| Aucun graphique | Vérifier les fichiers `assets/vendor/` et les bloqueurs ; les tableaux/calculs restent utilisables |
| Date non reconnue | Corriger le mapping ; utiliser date native Sheets ou format pris en charge |
| En-têtes modifiés | La synchro se suspend : vérifier et revalider l'aperçu |
| Onglet renommé | Le rafraîchissement suit son sheetId et lit son titre actuel |
| Onglet supprimé | Reconnecter le fichier et sélectionner un autre onglet |
| Port 8000 occupé | Fermer l'autre serveur ou changer le port et l'origine OAuth |

## Architecture

`index.html` ; `launch.bat` ; `serve.py` ; `config/config.example.js` et `config/config.js` ; `css/style.css`, `dashboard.css`, `responsive.css` ; `js/app.js`, `google-auth.js`, `google-sheets.js`, `data-processor.js`, `analytics.js`, `predictions.js`, `charts.js`, `filters.js`, `exports.js` ; `assets/` ; `tests/`.

Aucun npm requis pour l'utilisateur. Pour les tests unitaires (développeur, Node 20+) : `npm test`.

## Validation livrée

Voir `TESTS.md` pour les contrôles réellement exécutés. Le parcours réel OAuth dépend de votre Client ID et de votre consentement, il ne peut pas être validé avec une configuration vide.

## Mise à jour : appareils et géographie postale

- Le bloc « Campagnes marketing » devient **Appareils connectés** : classement Android, iPhone, PC / ordinateur (Windows, macOS, Linux, ChromeOS), iPad / tablette, robots identifiables et autres/inconnus. Source prioritaire : `user_agent`, sinon colonne appareil déclarée. Classification indicative : ces chaînes peuvent être masquées ou falsifiées. Les appareils génériques « mobile » ne sont pas arbitrairement classés Android.
- Graphique + tableau complet des volumes et parts du total filtré. Les inconnus sont inclus dans le dénominateur, les arrondis peuvent ne pas totaliser exactement 100 %.
- Le bloc géographique devient **Villes et codes postaux**. Mapping automatique de `code_postal` et `ville`. Ville déclarée prioritaire ; sinon résolution uniquement si le code correspond à une seule commune. Plusieurs communes possibles = ambiguïté signalée, aucune commune choisie arbitrairement. Les codes à 4 chiffres sont complétés avec un zéro initial pour le référentiel français ; un code non français n'est pas géolocalisé.
- Référentiel intégré : API Découpage administratif, https://geo.api.gouv.fr/communes?fields=nom,codesPostaux&format=json ; copie consultée le 19 novembre 2026, 6 310 codes. Source : service public geo.api.gouv.fr, données communes/codes postaux ; Licence Ouverte 2.0, https://www.etalab.gouv.fr/licence-ouverte-open-licence/. Aucune adresse ni donnée de lead n’est envoyée à ce service lors de l’utilisation : le rapprochement est local. Les changements de communes/codes après cette copie ne sont pas automatiquement reflétés.
- Le graphique montre les 10 premières catégories géographiques ; le tableau défilant contient toutes les catégories, volumes et parts. Sélecteur alternatif par ville identifiée. Un code postal partagé ne permet pas de connaître la ville réelle du lead.
- CSV enrichi avec appareil, code postal et libellé géographique. Les deux graphiques restent exportables en PNG et dans le rapport PDF. Les campagnes restent disponibles comme filtre et dans les données exportées.

## Mise à jour : statistiques détaillées, décisions et couleurs

Les six blocs analytiques disposent désormais d’un graphique et d’un tableau : évolution temporelle (volume et précédente alignée), formulaires (volume, part, précédente et variation), sources (mêmes indicateurs), appareils, codes postaux/villes et projection (30 dates, estimation et bornes journalières). Les tableaux défilent pour conserver une page utilisable ; les graphiques conservent leurs limites top 10/12/8 annoncées et les tableaux de catégories affichent toutes les catégories actuellement présentes. Une catégorie uniquement présente dans la période précédente n’est donc pas listée dans le tableau actuel. Les calculs restent liés aux filtres partagés.

Sous les formulaires et sources, deux espaces **Décisions & améliorations** présentent : premier volume et part, évolution de même durée si base disponible, prudence pour moins de 30 leads, filtre unique, attribution manquante, concentration d’au moins 70 %, actions concrètes à tester et mesures à ajouter. Les seuils sont des règles de vigilance explicites, pas des tests de significativité. Les conseils sont calculés localement par règles transparentes (`js/decisions.js`), sans service d’IA externe ni envoi de données. Aucune promesse d’augmentation : vues, sessions, dépenses, abandons et qualité commerciale ne sont pas disponibles. Les conseils recommandent de mesurer ces éléments avant de généraliser un test ou d’augmenter les budgets. Ils figurent aussi dans les insights et le PDF.

Accents distincts par bloc : bleu (rythme), violet (formulaires), vert (sources), rose (appareils), cyan (géographie), ambre (projection). Des repères de catégories colorés reprennent la fonction de couleur des graphiques ; les libellés, nombres et pourcentages restent lisibles indépendamment de la couleur. Les couleurs de catégories sont déterministes, mais pas une garantie d’unicité pour des milliers de libellés. Modes clair/sombre conservés.
