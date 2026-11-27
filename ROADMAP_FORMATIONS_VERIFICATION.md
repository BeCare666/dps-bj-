# Roadmap — Espace Formations et « Vérifier votre établissement »

Source : dossier `formations/` fourni par le client (4 documents Word) et manuels ARS
(`GRILLES/`). Chaque étape terminée est cochée. Rien n'est inventé : ce qui n'est pas
dans les documents est listé dans « Points à valider ».

## 0. Analyse des documents fournis

- [x] **0.1** `Formations et procédures ARS_EH.docx` : 85 formations EH, une par critère
  exigeant un « registre du personnel formé » (17 essentielles, 60 fondamentales,
  8 avancées), puis procédures, protocoles, éducation des patients, évaluation ARS.
  L'introduction annonce 86 formations, le tableau en liste 85 (mêmes codes que le
  document « Programmes »).
- [x] **0.2** `Programmes de formation EH.docx` : pour les 85 formations, public, programme
  (objectif, contenus, méthode, évaluation) et durée. Récapitulatif 81 h + 291,5 h + 62 h.
  Socle commun (~40 h, 5 jours + session courte) et 6 parcours par métier.
- [x] **0.3** `Formations, procédures… – Manuel ESPC.docx` : 19 formations ESPC (7 essentielles,
  50 h ; 12 fondamentales, 57 h ; aucune avancée), avec cible, programme (exigence ARS,
  contenus, méthode, évaluation) et durée. C.2.1.1 porte deux formations (PCI à
  l'embauche, point focal PCI).
- [x] **0.4** `Programmes de formation ESPC.docx` : **copie du document EH** (mêmes 85
  formations, mêmes codes EH). Il n'est pas utilisé ; le catalogue ESPC vient du 0.3.
- [x] **0.5** Échelle officielle (manuels EH p. 55 et ESPC p. 48, tableau 8) :
  niveau 0 = essentiels < 100 % ; 1 = essentiels 100 % ; 2 = + fondamentaux 60 à 89 % ;
  3 = + fondamentaux ≥ 90 % ; 4 = + avancés ≥ 80 % ; 5 = tout à 100 %.
- [x] **0.6** Existant vérifié : catalogue `Formation` (titre, description, durée, 3 tarifs),
  réservations KKiaPay (formules 1 / 5 / 10 places), factures, notifications, admin
  formations et réservations. Il est étendu, pas remplacé.
- [x] **0.7** Les documents ne donnent **aucun tarif** : les formations importées sont
  publiées « tarif à définir » et ne sont réservables qu'une fois le tarif fixé dans l'admin.

## 1. Données : catalogue officiel

- [x] **1.1** Script `apps/api/prisma/formations-ars/convertir_docx.py` : lit les 2 documents
  utiles et produit `eh.json` (85) et `espc.json` (19), sans réécriture du texte.
- [x] **1.2** Import idempotent (`importer.ts`, clé type + critère + titre) : crée les
  formations absentes, ne touche jamais une formation déjà modifiée dans l'admin.
  Écrit et branché sur le seed (`npx tsx prisma/import-formations-ars.ts`). **Exécuté sur
  la base le 27/11/2026** : 85 EH + 19 ESPC créées ; relance → 0 créée (idempotent).
- [x] **1.3** Parcours EH (socle commun, 6 parcours par métier) en données statiques
  (`@dps/shared`, `PARCOURS_FORMATIONS_EH`, généré par le même script).

## 2. Base de données

- [x] **2.1** `Formation` : type (EH/ESPC), critère, niveau, domaine, public, exigence ARS,
  contenus, méthode, évaluation, libellé de durée, durée en heures décimales, image,
  tarifs facultatifs, ordre.
- [x] **2.2** `SessionFormation` (en ligne) : formation, début, fin, lien Google Meet, code,
  places, statut (planifiée, terminée, annulée).
- [x] **2.3** `ParticipantFormation` : réservation, nom, prénoms, fonction, service, email,
  téléphone, invitation envoyée le, présent (oui/non).
- [x] **2.4** `EvaluationExterne` : établissement (nom, type, ville, IFU), organisation
  liée, source (ARS / Ministère), niveau 0-5, date, pourcentages facultatifs, document
  justificatif (Cloudinary), auteur.
- [x] **2.5** Migration appliquée, `prisma migrate diff` vide.

## 3. API Formations

- [x] **3.1** Catalogue public avec tous les champs ; filtre par type d'établissement.
- [x] **3.2** Admin : modification de tous les champs, image de couverture (upload).
- [x] **3.3** Réservation impossible tant qu'un tarif n'est pas fixé.

## 4. API Sessions en ligne, participants, présence

- [x] **4.1** Admin : créer / modifier / annuler une session (lien Meet + code).
- [x] **4.2** Réservation : choix d'une session planifiée ; sans session, l'admin l'affecte
  après paiement (remplace la « date de RDV »). API : `PATCH /reservations/:id/session` ;
  l'ancien `PATCH /reservations/:id/date-rdv` est retiré (9.3).
- [x] **4.3** Participants : ajout / retrait par la clinique, dans la limite des places
  de la formule, jusqu'au début de la session.
- [x] **4.4** Paiement confirmé + session connue → chaque participant reçoit par email le
  lien Google Meet et le code ; un participant ajouté ensuite le reçoit aussitôt ; un
  changement de lien renvoie les invitations.
- [x] **4.5** Feuille de présence (admin), clôture de la session → réservations réalisées.
- [x] **4.6** Liste des participants présents pour la clinique : écran + PDF + CSV
  (registre du personnel formé).

## 5. API Vérification d'un établissement

- [x] **5.1** Calcul du niveau ARS (0-5) à partir des dernières auto-évaluations soumises
  (essentiels, fondamentaux, avancés) ; tests unitaires sur les exemples du manuel
  (EH § 2.3.5 : établissement 1 → niveau 2, établissement 2 → niveau 4).
- [x] **5.2** Recherche publique par nom : établissement, type, ville, niveau, source
  (ARS, Ministère, auto-évaluation), date ; la plus récente en premier.
- [x] **5.3** Admin DSP : ajout d'une évaluation ARS / Ministère avec son document,
  liste, suppression, liaison à une organisation (automatique par IFU à l'inscription).
- [x] **5.4** Une évaluation externe ne pré-remplit rien : pour continuer sur DSP,
  l'établissement refait l'auto-évaluation complète.

## 6. Menu du site

- [x] **6.1** Après « Services » : « Formations » et « Vérifier votre établissement »,
  sans chevauchement de texte (contrôle à 1024, 1280 et 1440 px, et mobile).

## 7. Web — Catalogue des formations

- [x] **7.1** Page catalogue : bandeau image, onglets EH / ESPC, catégories (niveau,
  domaine, parcours), recherche, filtres avancés (public, durée, réservable),
  tri, filtres conservés dans l'URL, couverture illustrée par domaine.
- [x] **7.2** Fiche formation : programme complet, public, durée, sessions à venir, tarifs.

## 8. Web — Espace clinique

- [x] **8.1** Réservation : formule + session.
- [x] **8.2** Détail de réservation : participants (ajout, retrait), lien Meet, présence,
  téléchargement de la liste.

## 9. Web — Administration

- [x] **9.1** Éditeur de formation complet (tous les champs, image).
- [x] **9.2** Sessions en ligne : planning, création, feuille de présence, clôture.
- [x] **9.3** Réservations : affectation à une session.
- [x] **9.4** Évaluations externes : ajout avec document, liste, liaison.

## 10. Web — « Vérifier votre établissement »

- [x] **10.1** Champ de recherche centré (type moteur de recherche), suggestions en direct.
- [x] **10.2** Résultat : nom, niveau sur l'échelle 0-5, source, date, détail des pourcentages.

## 11. Auto-évaluation

- [x] **11.1** Bandeau : niveau ARS / Ministère connu + obligation de refaire
  l'auto-évaluation complète sur DSP.

## 12. Tests et livraison

- [x] **12.1** Tests unitaires (niveau ARS, import) et e2e (sessions, participants,
  invitations, présence, vérification).
- [x] **12.2** Builds API et web, contrôle navigateur (desktop et mobile).

## 13. Documents techniques — proposition (à valider)

Les documents listent, par critère, les procédures, politiques, protocoles et lignes
directrices exigés (EH : ~100 documents + ~60 protocoles par service ; ESPC : ~125
lignes). Proposition, non développée tant qu'elle n'est pas validée :

- **Bibliothèque documentaire** par établissement : liste des documents attendus selon
  son type (EH/ESPC), avec statut (à rédiger, rédigé, validé, diffusé), date, signataire,
  fichier — les trois preuves exigées par l'ARS (document, registre des formés,
  rapport d'évaluation de conformité).
- **Lien avec l'auto-évaluation** : un document « validé » aide à répondre « Présent ».
- **Lien avec les formations** : le registre du personnel formé est alimenté par les
  listes de présence (étape 4.6).
- **Modèles DSP** (procédures types) vendus ou fournis, à rédiger par DSP.

## Points à valider avec le client

1. Tarifs des formations (absents des documents).
2. Programme ESPC : le fichier « Programmes de formation ESPC » est une copie du fichier
   EH ; faut-il un programme ESPC propre au-delà des 19 formations du manuel ESPC ?
3. Publication des niveaux : la vérification publique affiche le niveau
   d'auto-évaluation des établissements inscrits ; prévoir une mention dans les CGU.
4. Présence : Google Meet ne fournit pas la liste des présents sans Google Workspace ;
   la présence est cochée par DSP à la fin de la session.
