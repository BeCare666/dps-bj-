# Intégration des grilles officielles ARS dans le module Auto-évaluation

Date : 12/10/2026. Point 4.7 de `ROADMAP_CONFORMITE_CDC.md`.

## 1. Sources

| Fichier fourni | Rôle dans l'intégration |
|---|---|
| `GRILLE AUTOEVALUATION DES CRITERES ESSENTIELS EH.pdf` (21 p.) | Source du contenu de la grille EH |
| `GRILLE D’AUTO-EVALUATION DES CRITERES ESSENTIELS DES ESPC A3.pdf` (15 p.) | Source du contenu de la grille ESPC |
| `MANUEL sécu des patients EH_vfinale.pdf` (270 p.) | Règle de notation, contrôle des effectifs, libellés manquants ou illisibles dans la grille EH |
| `Manuel sécu des patients ESPC_vfinale.pdf` (176 p.) | Même usage pour la grille ESPC |

Règle suivie : **les grilles font foi** pour les critères et les éléments mesurables. Les manuels servent uniquement à :
- confirmer la règle de notation ;
- trancher une ambiguïté de mise en page ;
- compléter un libellé absent ou illisible dans la grille.

Toute différence entre une grille et son manuel est signalée en section 5. Aucune n'a été corrigée d'office.

## 2. Méthode d'extraction

- Les cellules des tableaux ont été reconstituées à partir des traits du PDF. Chaque élément mesurable est ainsi rattaché à sa méthode (document, entretien, observation) et à son critère.
- Les 36 pages ont été contrôlées visuellement, page par page.
- Les lignes coupées d'une page à l'autre ont été recollées.
- Une cellule « Méthode » vide reprend la méthode de la ligne précédente : la cellule de la grille couvre ces lignes.

## 3. Notation : la plateforme applique déjà la règle des manuels

- **Manuel EH, § 2.2.1** et **manuel ESPC, « Les critères essentiels »** : un critère essentiel est noté « respecté = 1 » ou « non respecté = 0 », sans palier intermédiaire.
- Chaque fiche de critère précise : « Si l'établissement justifie des N éléments mesurables / preuves indiqués, le critère est respecté ; sinon il n'est pas respecté ».
- Les manuels exigent 100 % des critères essentiels pour atteindre le premier niveau de conformité.

C'est exactement la règle du CDC (§ 6.3), déjà en place :
- un critère n'est validé que si tous ses « documents à examiner » ont la réponse Oui ;
- les entretiens et les observations sont posés mais n'entrent pas dans le score ;
- le score est le pourcentage de critères validés.

**Aucune modification du calcul n'a été nécessaire.**

Contrôle pour la grille EH : sur 25 critères, 22 ont exactement le nombre de documents exigé par le manuel. Les 3 autres sont traités en section 5.1.

## 4. Résultat

| Grille | Domaines | Normes | Critères essentiels | Éléments | dont documents (score) |
|---|---|---|---|---|---|
| EH | 5 | 12 | **25** (= manuel EH) | 152 | 100 |
| ESPC | 5 | 13 | **30** (= manuel ESPC) | 194 | 113 |

Ce qui a été mis en place :
- Les deux grilles sont publiées en version 1, sous le nom de leur PDF.
- Les grilles « placeholder » sont archivées. Leurs sessions existantes restent consultables.
- Chaque établissement voit la grille de son type (EH ou ESPC).

### Modifications de la plateforme

| Modification | Raison |
|---|---|
| Nouveau champ `registre` sur le critère | Garder la mention « Registre CQSP », « Registre SP », etc. des 30 critères ESPC. Elle est reprise telle quelle, les manuels n'en donnant pas le sens. Elle s'affiche dans le questionnaire, le visualiseur et l'éditeur admin. |
| Libellés des normes, critères et éléments passés de 191 caractères à TEXT | Certains textes officiels font jusqu'à 645 caractères : rien n'a été tronqué. |

### Où se trouvent les données

- Données : `apps/api/prisma/grilles-ars/eh.json` et `espc.json`.
- Import : idempotent. Il est appelé par le seed et par `npx tsx prisma/import-grilles-ars.ts`.
- Test : `src/grilles/grilles-ars.spec.ts`. Il vérifie les effectifs et la structure, et que l'éditeur admin accepte les deux grilles.

## 5. Points à faire valider par le client / l'ARS

### 5.1 Grille EH

- **B.3.1.1 et E.1.1.1** : deux documents étaient écrits dans une même cellule, séparés par « - ». Ils ont été scindés en deux, comme dans le manuel, qui annonce 7 et 5 éléments.
- **C.1.1.3** : sous l'intitulé « Procédures de surveillance des patients », la grille pose 4 sous-procédures (le manuel compte 1 élément). Chacune est une question. Le résultat est le même : le critère n'est validé que si les 4 existent.
- **E.1.1.1, règle propre au manuel** : « respecté si 80 à 100 % du personnel suit un programme de formation centré sur la sécurité des patients ». La grille ne contient pas cette question : la plateforme applique la règle générale, c'est-à-dire tous les documents à Oui. **À trancher.** On peut ajouter une question chiffrée si l'ARS le souhaite.
- **C.4.1.2** : la fiche du manuel contient une ligne « partiellement respecté », ce qui contredit le § 2.2.1 (pas de palier partiel pour un critère essentiel). La notation reste binaire.
- **Questions d'entretien et d'observation dupliquées dans la grille.** Elles semblent copiées depuis le critère précédent et ne portent pas sur le bon sujet. Elles sont reprises telles quelles et n'entrent pas dans le score :

  | Critère | Question ou observation dupliquée |
  |---|---|
  | C.1.1.5 | « …détérioration clinique ? » / « tableau d'observation… » |
  | C.2.1.3 | « …nettoyage, désinfection et stérilisation… » |
  | C.4.1.1 | « …sécurité transfusionnelle ? » |
  | C.4.1.2 | « …sécurité pré-transfusionnelle… » |

- **Libellés de norme** :
  - la norme C.4 de la grille (« injections, perfusions et vaccinations ») diffère de celle du manuel (« sécurité des médicaments ») ; le libellé de la grille est conservé ;
  - le libellé E.1 de la grille était illisible (mots anglais mêlés) ; il a été remplacé par celui du manuel.

### 5.2 Grille ESPC

- **Comparaison preuve par preuve avec le manuel** (refaite le 12/10/2026 sur les 55 critères, à partir des PDF ; chaque écart vérifié sur la page de la grille).
  - **Grille EH** : aucune preuve du manuel ne manque dans la grille.
  - **Grille ESPC** : souvent plus détaillée que le manuel, par exemple « Documents qui montrent les rôles… du : » suivi de 4 personnes. La grille a été suivie. En revanche, **5 preuves exigées par le manuel n'apparaissent nulle part dans la grille**. Elles n'ont pas été ajoutées :

    | Critère | Preuve du manuel absente de la grille |
    |---|---|
    | C.2.1.1 | « Plan d'actions de prévention et le contrôle des infections » |
    | C.2.1.1 | « Procédures fondées sur des données probantes, adaptées aux établissements et basées sur les lignes directrices nationales en matière de PCI » |
    | C.2.1.1 | « Stratégies multimodales de prévention pour les interventions de PCI prioritaires » |
    | C.2.1.2 | « Lignes directrices de l'OMS sur les composantes essentielles et les exigences minimales en matière de la PCI » |
    | D.2.1.1 | « e… apporte la preuve : de la disponibilité d'eau courante propre » (les 3 autres points du rapport de visite sont dans la grille) |

  - **Preuves présentes dans la grille, mais placées autrement que dans le manuel** :

    | Critère | Écart |
    |---|---|
    | A.1.1.2 | « Objectifs de sécurité des patients à court et à long terme » : preuve de A.1.1.2 dans le manuel, mais rangée sous A.1.1.3 dans la grille. |
    | D.2.1.3 | « Déchets placés dans un lieu dédié… » : preuve dans le manuel, mais **Observation** dans la grille, donc hors score. |
    | E.1.1.1 | Le manuel demande une « Procédure de gestion des blessures par piqûre d'aiguille ». La grille demande une « Procédure de gestion des accidents d'exposition au sang » (ligne surlignée en vert). L'équivalence n'est pas tranchée ici. |
    | A.1.1.1 | La 2e preuve du manuel ne vise que « le responsable de l'offre de soins ». La grille en demande davantage. |
- **Questions placées sous « Exploitation documentaire »** : trois questions « Avec le Responsable… : … ? » (A.1.1.4, B.3.1.2, C.4.1.4) ont été classées en entretien, hors score. Le manuel ne les compte pas parmi les preuves : par exemple, A.1.1.4 exige 5 preuves, soit exactement les 5 documents de la grille.
- **Cellules fusionnées scindées** :
  - D.2.1.4 : « Régistre de formation… » (document), « Rapport d'évaluation… » (document) et une question d'entretien ;
  - D.1.1.1 : « Calendrier des formations… » et « Listes de contrôle… ».
- **Libellés absents de la grille, repris du manuel** :
  - domaine B (« Implication des patients et de la communauté ») ;
  - domaine D (« Environnement sécurisé ») ;
  - titre du critère D.2.1.3 ;
  - catégorie des critères A.1.1.1 et D.2.1.3 (cellules vides). Ces deux critères figurent parmi les 30 critères essentiels du manuel.
- **Mentions parasites retirées** :
  - « Avec le Responsble de l'ESPC: » en tête du titre de A.1.1.2 ;
  - « G4 » et la liste répétée dans la 1re cellule de E.1.1.1.
- **Note du manuel non reprise comme recommandation** : pour A.5.1.1, le manuel demande, lorsque le critère n'est pas respecté, de « documenter la bonne foi de l'établissement à recruter du personnel ». Elle peut être saisie dans le champ « Recommandation » si l'ARS le souhaite.
- **Lignes surlignées en vert** dans la grille (E.1.1.1 : « Procédure de gestion des risques… », « Procédure de gestion des accidents d'exposition au sang ») : intégrées comme les autres documents. Le sens du surlignage n'est pas indiqué.

### 5.3 Communs aux deux grilles

- **Coquilles conservées telles quelles** : « Responsble », « Régistre », « budgetisé », « pour les les situations », « les es cinq diagnostics ». Elles sont corrigeables à tout moment par l'éditeur admin dans une nouvelle version.
- **Coquilles corrigées dans les libellés de normes EH** : « patientse », « L'hôpial », « sécuritédes », mot parasite « system. ».
- **Colonnes de plan d'action non implémentées** : la grille comporte aussi les colonnes « Pages », « Écart », « Personne responsable/équipe », « Action mise en place », « Délai » et « Suivi ». Le CDC § 6 ne prévoit pour ce module :
  - ni plan d'action par critère ;
  - ni saisie de l'écart par critère.

  Il prévoit seulement les recommandations (§ 6.4), déjà gérées. Une évolution est possible sur demande.
- **Sens des mentions « Registre … »** (CQSP, SP, EFE, RH, DM/IPP, PCI, MV, HSE, GDM/OPCT) : non défini dans les documents fournis.

## 6. Journal des corrections appliquées (exhaustif)

### EH

| Élément | Correction |
|---|---|
| Norme A.2 | Coquille « patientse » corrigée. |
| Norme A.5 | Espace manquant (« sécuritédes ») ajouté. |
| Norme C.3 | Coquille « L'hôpial » corrigée. |
| Norme D.2 | Mot anglais parasite « system. » retiré. |
| Norme E.1 | Texte corrompu dans la grille ; libellé repris du manuel EH (tableau des normes). |
| A.5.1.1 (titre et élément « Preuves de qualification… ») | Texte espacé lettre par lettre dans le PDF ; reconstitué, identique au manuel. |
| B.3.1.1 | Cellule scindée en deux documents, conformément au manuel. |
| E.1.1.1 | Cellule scindée en deux documents, conformément au manuel. |
| C.1.1.2 | Guillemet isolé retiré en tête de question. |
| C.1.1.3 | 4 sous-procédures, chacune préfixée par « Procédures de surveillance des patients : ». |
| D.2.1.1 et E.1.1.1 | Catégorie « Essentielle » normalisée en « Essentiel ». |
| Domaine B | Libellé repris du manuel EH, § 2.7.4. |
| Domaine E | Libellé, répété deux fois dans la cellule, dédoublonné. |

### ESPC

| Élément | Correction |
|---|---|
| Norme E.1 | Double point final ramené à un point. |
| A.1.1.1, A.1.1.2, B.2.1.1 (×2), C.1.1.2, C.1.1.3, C.4.1.1, C.4.1.2, D.1.1.1, D.2.1.1, D.2.1.3 (×2), E.1.1.1 | « Intitulé : » suivi de sous-éléments en italique : chaque sous-élément devient une question préfixée par l'intitulé. L'intitulé seul n'est pas une question. |
| A.1.1.2 | Mention parasite retirée du titre. |
| A.1.1.4, B.3.1.2, C.4.1.4 | Question classée en entretien. |
| D.1.1.1 | Cellule fusionnée scindée. |
| D.2.1.4 | Cellule fusionnée scindée. |
| D.2.1.3 | Titre repris du manuel ESPC (tableau 4, critère n° 28). |
| A.1.1.1 et D.2.1.3 | Catégorie vide : « Essentiel ». |
| E.1.1.1 | Liste répétée et artefact « G4 » retirés de la 1re cellule. |
| Domaines B et D | Libellés repris du manuel ESPC (tableau 4). |
