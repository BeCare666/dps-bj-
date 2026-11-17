# Roadmap — Rapports statistiques (transmission aux autorités sanitaires)

Ajout à l'existant, **hors CDC v0.2**, demandé le 06/10/2026. Source unique : les 11 photos du dossier `statistique/` (formulaires papier remplis par la Clinique du Boulevard Eniola, avril 2026). Rien n'est inventé : ce qui n'est pas lisible ou pas défini est marqué `[!]`.

## Décisions du client (07/10/2026)

1. Transmission : les destinataires (zone sanitaire, direction départementale, ministère) ont des **comptes DSP** et consultent les rapports dans la plateforme. Pour l'instant, **comptes fictifs** créés par le seed.
2. Formulaires **identiques pour tous les établissements** ; seul le département change.
3. Totaux **calculés automatiquement**.
4. Soumission par un compte nommé (date et heure) ; seul le **responsable du compte** remplit et soumet.
5. En-tête **pré-rempli** depuis les informations données à l'inscription (département, commune, arrondissement, zone sanitaire) ; ce qui manque est saisi dans le rapport.
6. Module **gratuit** (pas d'abonnement).

## Règles de travail

Celles de `ROADMAP_CONFORMITE_CDC.md` s'appliquent : rien d'inventé, isolation par organisation (RM7), tests à chaque étape, commandes lourdes une par une (~4 Go de RAM).

## Les 6 formulaires (codes internes)

| Code | Formulaire papier | Périodicité |
|---|---|---|
| `BS_A` | Relevé épidémiologique mensuel des centres de santé (BS-a) | Mensuelle |
| `PNLP1` | Rapport mensuel de surveillance et logistique PNLP1 | Mensuelle |
| `PNLMNT1` | Rapport mensuel PNLMNT 1 | Mensuelle |
| `PNLMNT2` | Rapport mensuel PNLMNT 2 | Mensuelle |
| `SIMR_HEBDO` | 12_BJ Rapport hebdomadaire des maladies ou événements sous surveillance, V14.11.2025 | Hebdomadaire (semaine ISO, lundi → dimanche, vérifié : « semaine 11 du 09/03/26 au 15/03/26 ») |
| `TRANSFUSION` | Rapport mensuel d'activités, structure sanitaire agréée pour l'acte transfusionnel | Mensuelle |

## Étapes

- [x] **1** Définitions des 6 formulaires comme données (`packages/shared`) + moteur de calcul des totaux + tests.
- [x] **2** Base de données : localisation de l'organisation (département, commune, arrondissement, zone sanitaire), autorités sanitaires, rapports. Migration additive.
- [x] **3** Inscription et « Mon établissement » : saisie de la localisation.
- [x] **4** API établissement : créer, enregistrer en brouillon, soumettre (responsable du compte uniquement).
- [x] **5** API autorités : liste des rapports de leur ressort, consultation (date de réception), validation (zone sanitaire).
- [x] **6** Comptes fictifs des autorités (seed).
- [x] **7** Web établissement : liste, saisie fidèle au papier (cases hachurées grisées, totaux calculés), soumission.
- [x] **8** Web autorités : espace dédié, consultation, validation.
- [x] **9** Tests e2e et build web. E2E et test réel de l'interface faits. Build de production relancé le 17/11/2026 sur `main` (`79ffd70`) : `next build --webpack`, code de sortie 0 (voir journal de `ROADMAP_ESPACE_AUTORITES.md`).

## Points `[!]` à faire confirmer avec les formulaires vierges

Les photos sont de bonne qualité pour les libellés, mais pas pour la position exacte des hachures. Seules les hachures **lisibles avec certitude** ont été reprises ; les autres cases restent saisissables.

1. **BS-a — cases hachurées** : seules sont reprises les lignes 13 et 14 (paludisme simple : bloc « hospitalisés » et « Cas référés »). D'autres hachures sont visibles sur la photo (coqueluche, tétanos, écoulement urétral, perte vaginale, hypertension artérielle…) mais leur position exacte (« Cas » ou « Décès », quelles tranches d'âge) n'est pas lisible avec certitude.
2. **PNLP1 — sous-totaux** : les sous-titres sous « Sous-Total » sont illisibles. Retenu : Masculin = (1) + (2) et Féminin = (1) + (2) + (3), seule répartition qui couvre toutes les colonnes et cohérente avec les chiffres de la photo.
3. **PNLMNT 1 — note « perdu de vue »** : en partie masquée par le cachet ; elle n'est pas reproduite mot pour mot.
4. **PNLMNT 1 — variable 37** et **PNLMNT 2 — variable 43** : une seule case visible sur la photo (reprise ainsi).
5. **12_BJ — situation du paludisme** : seules les colonnes « Suspect » sont hachurées (grisé net). Le cachet masque la zone « Décès » ; elle reste saisissable.
6. **Transfusion** : la ligne sans libellé en tête du tableau « Répartition selon les affections » et la ligne vide en bas des EIR ne sont pas reprises. Le libellé imprimé « FDN Totale reçue au cours du Mois » est conservé, alors que la clinique l'a corrigé à la main en « utilisée ». « STS-O » / « DDS-O » (Ouémé) deviennent « STS » / « Direction départementale de la santé — {département} », puisque seul le département change.
7. **Liste officielle des zones sanitaires** : non fournie. La zone est saisie librement ; le rapprochement avec l'autorité ignore la casse, les accents et la ponctuation.

## Décisions d'implémentation (rien de tout cela n'est sur les formulaires)

- Une case vide n'est **pas** un zéro : toutes les cases numériques et les Oui/Non doivent être remplies pour soumettre. Un bouton « Mettre 0 dans les cases vides » évite de taper les zéros un par un. Les textes (observations, précisions) restent facultatifs.
- « Date de transmission » = date et heure de soumission ; « date de réception à la ZS » = première consultation par la zone sanitaire destinataire.
- La signature est remplacée par la soumission depuis le compte nommé du responsable (décision 4). Les autres noms imprimés (statisticien PNLP1, agent de collecte PNLMNT) sont des champs texte facultatifs.
- Ressort des autorités : la zone sanitaire voit les rapports soumis de sa zone et de son département ; la direction départementale ceux de son département ; le niveau national tous. Seule la zone sanitaire **valide**. Un brouillon n'est visible par aucune autorité.
- Après soumission, le rapport est verrouillé. Rien n'est prévu pour le corriger ou le renvoyer : ce circuit n'apparaît pas sur les formulaires et reste à décider.
- Le formulaire 12_BJ (hebdomadaire) suit les semaines ISO, du lundi au dimanche.

## Journal des étapes

### Étapes 1 à 6 — moteur, base de données, API, comptes fictifs (07/10/2026)

**Ce qui a été fait**
- `packages/shared/src/rapports-statistiques/` : les 6 formulaires décrits comme données (`formulaires/*.ts`), moteur de calcul et de validation (`calcul.ts`), départements et périodes (`periodes.ts`). Une case est hachurée, fusionnée, à saisir ou calculée. Une colonne de total dont toutes les composantes sont hachurées devient une case à saisir (ex. « CTA à la pharmacie » du PNLP1). Une colonne « hors total » n'est jamais additionnée (taux de satisfaction).
- Migration `20261007150000_rapports_statistiques`, purement additive, générée par `prisma migrate diff` et appliquée à la base de développement ; aucun écart après application :
  - `organisations` : `departement`, `commune`, `arrondissement`, `zone_sanitaire` (facultatifs) ;
  - type de compte et rôle `AUTORITE_SANITAIRE` ;
  - tables `autorites_sanitaires` et `rapports_statistiques`.
- Inscription : département (liste des 12), commune et zone sanitaire obligatoires, arrondissement facultatif. « Mon établissement » : les quatre champs modifiables.
- API `rapports-statistiques` (responsable du compte) : liste, création (en-tête pré-rempli), enregistrement du brouillon, soumission. API `autorite` : `me`, liste du ressort, consultation, validation. Journal d'audit sur création, soumission et validation.
- Le rôle `AUTORITE_SANITAIRE` ne peut pas être ajouté à un compte existant depuis l'administration.
- Seed : 3 autorités **fictives** (`[FICTIF] Zone sanitaire PAS`, `[FICTIF] Direction départementale de la santé de l'Ouémé`, `[FICTIF] Ministère de la Santé`), adresses en `.invalid`.

**Tests**
- Unitaires : `src/rapports-statistiques/definitions.spec.ts` (19 tests : cohérence des 6 définitions, hachures, fusions, totaux, chiffres réels de la photo PNLP1 — 01 + 37 = 38, 01 + 28 = 29, total 67 —, validation, semaines ISO). Avec `src/auth` et `src/ifu` : **82/82**.
- E2E `test/rapports-statistiques.e2e-spec.ts` contre la base de développement : **14/14** (droits, pré-remplissage, doublon, période future, case calculée refusée, soumission incomplète refusée, verrouillage, isolation entre établissements, ressort de chaque niveau d'autorité, validation par la zone seulement, semaine ISO, localisation de la fiche).
- `tsc --noEmit` API et web : OK ; eslint sur les nouveaux fichiers web : OK.

### Étapes 7 et 8 — interface établissement et autorités (07/10/2026)

**Ce qui a été fait**
- Menu du responsable du compte : « Établissement › Rapports statistiques ». Page liste + création (choix du formulaire, mois ou semaine), page de saisie.
- Grille de saisie générique (`components/rapports-statistiques/rapport-formulaire.tsx`) rendue depuis la définition : en-têtes sur plusieurs niveaux, libellé commun aux lignes Cas/Décès, cases hachurées grisées, cases fusionnées, totaux recalculés à chaque frappe, cases vides surlignées, bouton « Mettre 0 dans les cases vides », brouillon, soumission avec confirmation, lecture seule après soumission. En-tête officiel, période, dates de transmission / réception / validation avec les noms.
- Espace autorité (`/autorite`) : liste des rapports reçus avec filtres (statut, formulaire), consultation en lecture seule, bouton « Valider » pour la zone sanitaire uniquement. Connexion d'un compte autorité redirigée vers `/autorite`.
- Inscription et « Mon établissement » : champs de localisation sanitaire.

**Test réel dans le navigateur** (API + site lancés en local, base de développement, établissement de test créé puis supprimé)
- PNLP1 : en-tête pré-rempli (Ouémé, PAS, Porto-Novo, 2ème) ; 82 cases à remplir (76 nombres + 6 Oui/Non) ; saisie des chiffres de la photo 1 / 1 / 37 / 28 / 0 → sous-totaux et total **38 / 29 / 67** ; « Mettre 0 » puis Oui/Non → soumission → statut « Soumis », lecture seule.
- Compte fictif « Zone sanitaire PAS » : le rapport apparaît dans « Rapports reçus » ; consultation → « Reçu par la zone sanitaire le … » ; validation → « Validé le … par Compte fictif Zone sanitaire PAS ».
- BS-a : 2 938 cases à remplir (88 lignes × 33 + 2 lignes paludisme simple × 16 + 2 champs consultants), en-têtes sur 3 niveaux et lignes Cas/Décès conformes.

**Limites constatées**
- En local, `next dev` avec Turbopack échoue sur `globals.css` (« Cannot find module 'picocolors' ») ; sans lien avec ce chantier. Le test a été fait avec `next dev --webpack`.
- Le build de production (`next build`) n'a pas été relancé sur cette machine (4 Go de RAM). `tsc --noEmit` et eslint passent ; le build Vercel le vérifiera au prochain push.
- Saisie au clavier : la touche Tab passe d'une case à la suivante (comportement natif du navigateur).
