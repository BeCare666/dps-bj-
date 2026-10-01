dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 1 / 15
CAHIER DES CHARGES FONCTIONNEL
Plateforme dps.bj
Dispositif de Sécurité des Patients
Version 0.2 · Environnement de dev : dsp.sedjro.africa
Document de travail interne
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 2 / 15
1. Objet du document
Ce document décrit les fonctionnalités et le fonctionnement de la plateforme dps.bj, plateforme unifiée dédiée à la
sécurité des patients au sein des établissements de santé. Il couvre l'ensemble des quatre modules de la plateforme,
accessibles depuis un compte unique par établissement, ainsi que les règles de gestion des accès, des abonnements
et du tableau de bord administrateur.
Il s'adresse en priorité aux établissements de santé souhaitant comprendre ce que la plateforme leur apporte,
comment elle fonctionne et quels engagements elle implique, sans entrer dans les aspects techniques de
développement. Il sert également de référence fonctionnelle à l'équipe de développement pour la conception de la
plateforme.
2. Contexte et problématique
Les établissements de santé au Bénin - hôpitaux comme structures de soins de premiers contacts - sont soumis à
des normes de sécurité des patients définies par l'Autorité de Régulation du Secteur de la Santé (ARS). Ces normes
couvrent l'organisation interne, la gestion des documents, les pratiques cliniques, la sécurité de l'environnement et
la formation du personnel.
Au-delà de la conformité documentaire, la sécurité des patients suppose également une surveillance clinique
continue des patients hospitalisés et une capacité à identifier, analyser et corriger les événements indésirables
survenant dans les soins. Ces trois dimensions, conformité, surveillance clinique et gestion des risques, sont
aujourd'hui traitées de façon disjointe, avec des outils papier ou des registres non centralisés, ce qui limite la
visibilité de la direction et de l'ARS sur le niveau réel de sécurité des patients.
dps.bj réunit ces dimensions au sein d'une plateforme unique, accessible à tout établissement à partir d'un compte
unique, avec un premier module gratuit (auto-évaluation) servant de porte d'entrée vers des modules payants plus
avancés (surveillance clinique, gestion des risques, formation).
3. Présentation de la plateforme
dps.bj est un site web professionnel accessible depuis un ordinateur, une tablette ou un smartphone. Il regroupe
quatre modules complémentaires autour d'un compte unique par établissement.
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 3 / 15
3.1 Vue d'ensemble des modules
Module Fonction Modèle économique Public visé
1. Auto-évaluation Auto-évaluation documentaire de
conformité (grilles EH / ESPC)
Gratuit Responsable qualité /
direction de
l'établissement
2. Score NEWS Surveillance clinique et détection
précoce de la détérioration d'un
patient
Essai gratuit 3 mois, puis
payant
Personnel soignant
(infirmiers,
médecins)
3. Événements indésirables Déclaration, analyse et suivi des
événements indésirables
Essai gratuit 3 mois, puis
payant
Responsable qualité /
gestion des risques
4. Formations Catalogue et réservation de
formations en présentiel
Payant Établissements et
particuliers
3.2 Ce que la plateforme est
– Un outil de pré-diagnostic et de préparation à une visite d'évaluation de l'ARS.
– Un outil de surveillance clinique de premier niveau, en complément (et non en remplacement) du dossier
patient et du jugement clinique.
– Un registre centralisé de déclaration et de suivi des événements indésirables.
– Un catalogue de formations réservables et payables en ligne.
– Un tableau de bord de suivi de la conformité et de la sécurité des patients dans le temps.
3.3 Ce que la plateforme n'est pas
– Un dossier patient informatisé (DPI) : dps.bj ne remplace pas le dossier médical de l'établissement.
– Un dispositif médical connecté : les paramètres vitaux sont saisis manuellement par le personnel soignant, la
plateforme ne se connecte à aucun capteur ou moniteur.
– Un outil de télésurveillance à distance validé pour la décision médicale : les alertes générées sont des aides à
la priorisation, non des diagnostics.
– Un organisme de certification : le score de conformité est une auto-évaluation documentaire, distincte d'une
inspection officielle de l'ARS.
4. Profils d'utilisateurs et gestion des comptes
4.1 Le compte Organisation (établissement de santé)
C'est le profil principal de la plateforme. Un établissement ouvre un compte unique - le compte Organisation - qui
lui donne accès à l'ensemble des modules, chacun selon son propre statut d'abonnement (gratuit, en essai, payant
actif, ou expiré).
Informations enregistrées lors de l'inscription :
– Nom et raison sociale de l'établissement
– Type d'établissement (hôpital, clinique, laboratoire, pharmacie, cabinet médical, etc.)
– Catégorie ARS applicable : EH (Établissement Hospitalier) ou ESPC (Établissement de Soins de Premiers
Contacts)
– Numéro IFU (13 chiffres - identifiant fiscal officiel)
– Coordonnées de l'établissement (email, téléphone, ville, pays)
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 4 / 15
– Informations du responsable du compte (nom, prénom, civilité, email, mot de passe)
Le responsable inscrit représente l'établissement pour la création du compte et la gestion des abonnements. Il peut
ensuite créer des utilisateurs internes rattachés au compte Organisation (voir 4.2).
4.2 Les utilisateurs internes de l'établissement
Contrairement au module Auto-évaluation (utilisable par le seul responsable du compte), les modules Score NEWS
et Événements indésirables supposent un usage quotidien par plusieurs membres du personnel d'un même
établissement (infirmiers, médecins, responsable qualité). Le compte Organisation permet donc de créer des
utilisateurs internes, chacun avec :
– Un identifiant et un mot de passe personnels
– Un ou plusieurs rôles : Responsable du compte (accès complet), Responsable qualité / sécurité des patients
(accès Auto-évaluation et Événements indésirables), Personnel soignant (accès Score NEWS uniquement),
Gestionnaire formation (accès au module Formation)
– Un rattachement optionnel à un service (ex. maternité, bloc opératoire, urgences) pour le filtrage des données
du module Score NEWS
4.3 Le compte Individuel (particuliers)
Un individu sans établissement peut s'inscrire uniquement pour accéder au catalogue de formations (module 4). Il
n'a pas accès aux modules Auto-évaluation, Score NEWS ou Événements indésirables, qui restent réservés aux
comptes Organisation.
4.4 L'administrateur de la plateforme
L'éditeur de la plateforme dispose d'un espace d'administration complet lui permettant de gérer l'ensemble de
l'activité : établissements inscrits, abonnements par module, évaluations, alertes cliniques, événements
indésirables, formations, réservations, paiements et suivi commercial, depuis un tableau de bord dédié (voir section
9).
5. Modèle d'accès et d'abonnement par module
Chaque module dispose de son propre statut d'accès pour un compte Organisation donné, indépendamment des
autres modules :
– Module Auto-évaluation : accès gratuit et permanent dès l'inscription.
– Module Score NEWS : essai gratuit de 3 mois à compter de l'activation, puis passage automatique en accès
payant (ou en accès restreint/lecture seule en l'absence de souscription, à confirmer).
– Module Événements indésirables : essai gratuit de 3 mois à compter de l'activation, puis passage automatique
en accès payant selon les mêmes règles que le module Score NEWS.
– Module Formation : accès payant à l'unité, par formation réservée (pas d'abonnement).
Le tableau de bord de l'établissement affiche à tout moment le statut de chaque module (actif, essai - jours restants,
expiré) avec un accès direct à la souscription.
6. Module 1 : Auto-évaluation documentaire
Module gratuit et central de la plateforme. Il permet à un établissement de répondre à la grille officielle de l'ARS
Bénin sous forme d'un parcours guidé, une question à la fois, puis d'obtenir un score de conformité et un rapport
téléchargeable.
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 5 / 15
6.1 Standards disponibles
La plateforme couvre les deux grilles d'évaluation officielles de l'ARS Bénin : EH (Établissements Hospitaliers) et
ESPC (Établissements de Soins de Premiers Contacts). L'administrateur de la plateforme peut faire évoluer ces
grilles à tout moment (ajout, modification ou suppression de domaines, normes, critères ou questions) sans
intervention externe.
6.2 Déroulement du questionnaire
L'utilisateur est guidé question par question, domaine par domaine, avec un affichage d'une seule question à la fois.
Chaque question correspond à un élément mesurable de la grille officielle (document à examiner, élément
d'entretien ou d'observation) :
– Réponse binaire (Oui / Non) pour les éléments mesurables de type « document à examiner », qui entrent dans
le calcul du score.
La progression est visible à tout moment (barre de progression, plan de navigation latéral). Une session
interrompue peut être reprise là où elle s'est arrêtée.
6.3 Calcul du score
– Un critère est validé uniquement si tous les éléments mesurables de type « document à examiner » associés à
ce critère ont obtenu un résultat positif.
– Un seul document manquant suffit à invalider le critère entier.
– Le score par domaine et le score global sont calculés en pourcentage de critères validés sur le total de critères
du domaine ou de la grille.
6.4 Résultats et rapport
À l'issue de l'évaluation, l'établissement accède à son score global et par domaine, à la liste des critères et
documents non validés, à des recommandations synthétiques pour chaque critère en écart, et à un graphique
d'évolution si plusieurs sessions ont été réalisées. Un document PDF est généré automatiquement : un rapport de
synthèse au format professionnel.
6.5 Suivi de l'évolution dans le temps
La plateforme conserve l'historique complet des évaluations d'un établissement, permettant de suivre sa
progression d'une session à l'autre. L'administrateur dispose d'une vue globale comparant les niveaux de
conformité entre établissements.
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 6 / 15
6.6 Détails techniques
Entités et champs principaux
– organisations : nom, raison_sociale, type_etablissement, categorie_ars (EH/ESPC), numero_ifu, ville, pays,
telephone, email, statut_compte
– utilisateurs : organisation_id, nom, prenom, civilite, email, mot_de_passe (haché), roles (tableau), service_id
(optionnel), statut
– grilles : code (EH/ESPC), version, statut (brouillon/active/archivée), date_publication
– domaines / normes / criteres : grille_id ou parent_id, code, titre, ordre, categorie (essentiel/…)
– elements_mesurables : critere_id, type (document_a_examiner/entretien/observation), libelle,
entre_dans_score (booléen)
– sessions_evaluation : organisation_id, grille_id (version figée), statut (en_cours/soumise), date_debut,
date_soumission
– reponses : session_id, element_mesurable_id, valeur (oui/non/texte/choix), commentaire
– rapports_pdf : session_id, chemin_fichier, date_generation
Points d'implémentation
– Une session d'évaluation référence la version figée de la grille au moment de sa soumission ; toute évolution
ultérieure de la grille n'affecte pas les sessions déjà soumises.
– Le calcul du score est effectué côté serveur (jamais côté client) à la soumission de la session, pour garantir son
intégrité.
– La génération d un rapport de synthèse est traitée en tâche asynchrone (file d'attente) afin de ne pas bloquer
l'interface pendant la génération.
7. Module 2 : Score NEWS (surveillance clinique)
Module payant, avec essai gratuit de 3 mois. Il permet au personnel soignant de calculer le score clinique NEWS
(National Early Warning Score) d'un patient à partir de ses paramètres vitaux, afin de détecter précocement une
détérioration de son état et de déclencher une réponse graduée.
7.1 Fiche patient
Chaque mesure est rattachée à une fiche patient minimale, propre à l'établissement (identifiant interne du patient,
service, numéro de lit), sans données d'identité complètes, dps.bj n'étant pas un dossier patient informatisé.
– Création d'une fiche patient par le personnel soignant à l'admission dans le module
– Rattachement de chaque mesure à la fiche patient correspondante
– Clôture de la fiche à la sortie du patient, avec conservation de l'historique des mesures
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 7 / 15
7.2 Grille de calcul du score NEWS
Le score est calculé à partir de sept paramètres, chacun noté de 0 à 3, dont la somme donne le score total :
Paramètre Score 3 Score 2 Score 1 Score 0
Fréquence respiratoire ≤8 9–11 - 12–20
(normal)
Saturation en O2 (%) ≤91 92–93 94–95 ≥96
Oxygène d'appoint Oui - - Non
Température (°C) ≤35,0 OU >40 - 35,1–36,0 / 38,1–39,0 36,1–
38,0
Pression artérielle
systolique
≤90 91–100 101–110 111–219
Fréquence cardiaque ≤40 ou ≥131 111–130 91–110 / 41–50 51–90
Niveau de conscience
(AVPU)
Confus / inconscient - - Alerte
7.3 Saisie et alertes
– Saisie rapide au chevet du patient depuis mobile ou tablette, avec calcul automatique du score total dès la
saisie des paramètres
– Niveaux de risque affichés en code couleur : faible (0–4), moyen (5–6 ou score de 3 sur un seul paramètre),
élevé (≥7)
– Fréquence de surveillance suggérée selon le niveau de risque (ex. toutes les 12h en risque faible, toutes les 4 à
6h en risque moyen, surveillance continue en risque élevé)
– Déclenchement automatique d'une alerte (visuelle dans la plateforme et notification)
– Journal des interventions consécutives à une alerte : action réalisée, personnel intervenu, horodatage
7.4 Historique et statistiques
– Courbe d'évolution du score dans le temps pour chaque patient
– Export ou impression de la fiche de surveillance
7.5 Détails techniques
Entités et champs principaux
– patients : organisation_id, identifiant_interne, service_id, numero_lit, statut (actif/sorti), date_admission,
date_sortie
– mesures_news : patient_id, utilisateur_id, frequence_respiratoire, saturation_o2, oxygene_appoint (booléen),
temperature, pression_arterielle_systolique, frequence_cardiaque, niveau_conscience (enum AVPU),
score_total (calculé), niveau_risque (enum faible/moyen/élevé), date_mesure
– alertes : mesure_id, niveau, statut (ouverte/traitée), destinataire_id, date_alerte, date_traitement
– interventions : alerte_id, utilisateur_id, action, date_intervention
– abonnements_module : organisation_id, module (news/ei), statut (essai/actif/expiré), date_debut_essai,
date_fin_essai, date_expiration
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 8 / 15
Points d'implémentation
– Le score_total et le niveau_risque sont recalculés côté serveur à chaque saisie, à partir d'une fonction testable
pour éviter toute divergence entre affichage front et valeur enregistrée.
– Le déclenchement d'une alerte est un événement métier (event) écouté par un job de notification (email +
notification in-app), afin de découpler le calcul du score de l'envoi des notifications.
– Une tâche planifiée quotidienne (scheduler) vérifie les dates de fin d'essai de chaque organisation et bascule
automatiquement le statut du module en « expiré ».
– L'accès aux données patient est strictement filtré par organisation_id.
8. Module 3 : Analyse des événements indésirables
Module payant, avec essai gratuit de 3 mois. Il permet à un établissement de déclarer, qualifier, analyser et suivre
la résolution des événements indésirables (EI) survenant dans les soins.
8.1 Déclaration d'un événement indésirable
Toute personne habilitée peut déclarer un EI via une fiche standardisée comprenant :
– Date et heure de survenue, service ou lieu concerné
– Type d'événement (chute, erreur médicamenteuse, infection associée aux soins, erreur d'identification du
patient, incident lié à un équipement, autre - liste paramétrable par l'administrateur)
– Description factuelle de l'événement
– Gravité selon une échelle standardisée (ex. incident sans conséquence, incident avec conséquence mineure,
événement indésirable grave, décès)
– Personnes impliquées ou témoins (obligatoire)
8.2 Circuit de traitement
Chaque EI déclaré suit un circuit de traitement structuré :
– Réception a envoyé à la zone sanitaire ou au ministère: l'EI apparaît dans la file d'attente du responsable
qualité / gestion des risques
– Qualification : confirmation de la gravité et de la catégorie, priorisation
– Analyse des causes : documentation des causes immédiates et des causes profondes (méthode structurée de
type arbre des causes ou « 5 pourquoi », restituée sous forme de champs guidés plutôt que de texte libre)
– Plan d'action correctif : une ou plusieurs actions, chacune avec un responsable et une échéance
– Suivi de la mise en œuvre : mise à jour du statut de chaque action (à faire, en cours, réalisée)
– Clôture de l'EI une fois toutes les actions réalisées et validées
8.3 Tableau de bord et alertes
– Vue d'ensemble des EI par typologie, gravité, service et statut de traitement
– Délai moyen de traitement et taux de clôture
– Alerte immédiate au responsable qualité (et, selon paramétrage, à la direction) pour tout EI de gravité élevée
– Historique complet et export des EI sur une période donnée
8.4 Lien avec le module Auto-évaluation
Lorsque cela est pertinent, un EI peut être rattaché à un critère de la grille d'auto-évaluation (par exemple, une
chute récurrente peut pointer vers le critère relatif à la prévention des chutes). Ce rattachement enrichit le rapport
d'auto-évaluation d'exemples concrets d'écarts terrain, sans modifier le calcul du score, qui reste strictement
documentaire.
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 9 / 15
8.5 Détails techniques
Entités et champs principaux
– evenements_indesirables : organisation_id, declarant_id (nullable si anonyme), service_id, type_ei, gravite
(enum), description, statut (déclaré/qualifié/en_analyse/plan_action/clôturé), critere_lie_id (optionnel, lien
module 1), date_survenue
– causes : evenement_id, type (immédiate/profonde), description
– actions_correctives : evenement_id, description, responsable_id, echeance, statut (à_faire/en_cours/réalisée)
– pieces_jointes : evenement_id, fichier, type_mime, taille (optionnel)
Points d'implémentation
– Le champ declarant_id.
– Le passage d'un statut à l'autre suit une machine à états simple (déclaré → qualifié → en_analyse →
plan_action → clôturé), chaque transition étant historisée (qui, quand) pour la traçabilité.
– Une alerte de gravité élevée déclenche le même mécanisme d'événement/notification que les alertes du
module Score NEWS, pour une architecture de notification commune aux deux modules.
9. Module 4 : Catalogue de formations
Module payant à l'unité. La plateforme propose un catalogue de formations présentées avec leur titre, leur durée,
leurs objectifs et leur tarif. Les formations sont dispensées en présentiel.
9.1 Processus de réservation
– L'utilisateur sélectionne une formation et choisit une formule (individuelle, groupe de 5, groupe de 10, etc.)
– Il procède au paiement en ligne via le widget KKiaPay (Mobile Money MTN/Moov ou carte bancaire)
– Après confirmation du paiement, la plateforme l'informe que la date du rendez-vous lui sera communiquée
sous 48 heures
– L'administrateur fixe la date dans la plateforme ; l'établissement ou le particulier reçoit une notification et voit
la date apparaître dans son espace
9.2 Statuts d'une réservation
– En attente de paiement
– Payée - en attente de date
– Confirmée - date fixée
– Réalisée
– Annulée
9.3 Détails techniques
Entités et champs principaux
– formations : titre, description, duree, objectifs, tarif_individuel, tarif_groupe5, tarif_groupe10, statut
(publiée/brouillon)
– reservations : formation_id, utilisateur_id, organisation_id (nullable), formule, statut, transaction_id
(KKiaPay), date_rdv
– factures : reservation_id ou abonnement_id, montant, devise, date_emission, chemin_fichier_pdf
Points d'implémentation
– Le tarif appliqué à une réservation est celui en vigueur dans la table formations au moment du paiement (copié
sur la réservation), afin qu'une évolution ultérieure du tarif n'affecte pas les réservations déjà payées.
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 10 / 15
10. Architecture technique et choix technologiques
Cette section complète le CDC fonctionnel par les choix d'implémentation recommandés. Elle sert de cadrage pour
l'équipe de développement.
10.1 Backend : Laravel ou FastAPI
Deux options techniques sont envisageables pour le backend. Le tableau ci-dessous compare les deux approches
selon les critères pertinents pour ce projet.
Critère Laravel (PHP) FastAPI (Python)
Adéquation avec l'existant Correspond au cœur de stack déjà maîtrisé
par l'équipe (Laravel + Vue.js +
PostgreSQL ou MySQL)
Rapidité de mise en œuvre Écosystème « batteries incluses »
(Eloquent ORM, Sanctum, queues,
scheduler, notifications, Excel/PDF) :
idéal pour une application métier CRUD
avec workflows (statuts, rôles,
abonnements)
Très performant pour des API pures et le
calcul, mais demande de recoder
manuellement ce que Laravel fournit
nativement (auth, ORM, jobs, mailing)
Cas d'usage
data/scientifique
Suffisant pour les calculs déterministes du
score NEWS (formule fixe) et les
statistiques agrégées des modules 1 et 3
Avantage si la plateforme évolue vers des
traitements plus avancés (modèles
prédictifs, scoring par apprentissage
automatique, interopérabilité avec des
librairies scientifiques Python)
Écosystème paiement local SDK et exemples KKiaPay disponibles
nativement en PHP/JS ; intégration directe
dans les contrôleurs Laravel
Intégration possible via l'API REST de
KKiaPay (agnostique au langage), mais
moins d'exemples prêts à l'emploi en
Python
Recommandation Choix recommandé pour l'ensemble de
la plateforme (backend unique,
monolithe modulaire), cohérent avec
l'équipe et les délais
À réserver, le cas échéant, à un microservice isolé et optionnel pour des
traitements analytiques futurs
Architecture recommandée : un backend Laravel unique exposant une API REST (authentification par Laravel
Sanctum), consommée par une seule application front Vue.js couvrant les quatre modules. Les quatre modules
partagent la même base de données et le même socle d'authentification/autorisation (comptes, rôles, organisations),
ce qui évite de dupliquer la gestion des comptes entre plusieurs services.
10.2 Frontend : Vue.js 3 + TailwindCSS
– Vue.js 3 (Composition API) avec Vite comme outil de build
– TailwindCSS pour la mise en forme, avec une charte de composants communs (boutons, formulaires,
tableaux, badges de statut) mutualisée entre les quatre modules
– Pinia pour la gestion d'état partagé (session utilisateur, organisation active, statuts d'abonnement par module)
– Vue Router avec des gardes de navigation (route guards) qui vérifient le rôle de l'utilisateur et le statut
d'abonnement du module avant d'autoriser l'accès à une page
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 11 / 15
10.3 Base de données
PostgreSQL est recommandé comme système de gestion de base de données, pour sa robustesse, son support natif
des colonnes JSON (utile pour les réponses libres du module Auto-évaluation) et sa cohérence avec le reste du parc
applicatif déjà en place.
10.4 Intégration des paiements : KKiaPay
KKiaPay, premier agrégateur de paiement mobile béninois (édité par la société Open SI), est retenu comme
intégrateur de paiement pour l'ensemble de la plateforme. Il fédère en une seule intégration le Mobile Money
(MTN Mobile Money, Moov Money/Flooz) et les cartes bancaires internationales (Visa, Mastercard), ce qui
remplace et élargit l'intégration MTN Mobile Money seule mentionnée dans une version antérieure du CDC.
Sources et documentation de l'API
– Site éditeur : https://kkiapay.me
– Documentation développeurs : https://docs.kkiapay.me
– Widget de paiement JavaScript (intégration front) : https://cdn.kkiapay.me/k.js
– SDK JavaScript officiel : https://github.com/kkiapay/js-sdk
Principe d'intégration
– Trois clés API distinctes fournies par KKiaPay : une clé publique (intégrée côté front Vue.js pour ouvrir le
widget de paiement), une clé privée (utilisée côté backend Laravel pour vérifier une transaction) et une clé
secrète (utilisée côté backend pour les opérations de gestion du compte marchand, par ex. les
remboursements)
– Parcours de paiement : le front Vue.js ouvre le widget KKiaPay avec le montant et la référence de la
transaction (abonnement ou réservation de formation) ; l'utilisateur règle via MTN Mobile Money, Moov
Money ou carte bancaire ; KKiaPay renvoie un identifiant de transaction au front
– Vérification côté serveur obligatoire : le backend Laravel revérifie systématiquement chaque transaction
auprès de l'API KKiaPay (avec la clé privée) avant d'activer un abonnement ou de confirmer une réservation,
afin de ne jamais se fier uniquement à la réponse côté client
– Réception des notifications de paiement asynchrones via un webhook KKiaPay dédié, en complément de la
vérification synchrone, pour couvrir les cas de paiement finalisé après la fermeture de la page (ex. validation
USSD tardive)
– Environnement sandbox de KKiaPay utilisé sur dsp.sedjro.africa pour les tests, bascule vers l'environnement
production lors du passage sur dps.bj
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 12 / 15
10.5 Paramétrage des modalités tarifaires
Les éléments tarifaires combinent deux niveaux de configuration, selon leur nature :
Emplacement Contenu Modifiable sans redéploiement
?
.env (variables
d'environnement)
Clés API KKiaPay (publique/privée/secrète), mode
sandbox ou production, devise par défaut (XOF),
valeurs de repli utilisées uniquement s'il n'existe
encore aucun paramétrage en base (première
installation)
Non - nécessite un redémarrage
de l'application
Table paramètres_tarifaires
(base de données), gérée
depuis le dashboard admin
Prix de l'abonnement Score NEWS, prix de
l'abonnement Événements indésirables, durée de la
période d'essai (en jours, par défaut 90), tarifs des
formules de formation, comportement en fin d'essai
(lecture seule ou blocage)
Oui - modification immédiate
depuis l'interface admin, sans
intervention technique
Concrètement, l'administrateur dispose dans son tableau de bord (voir 12.1) d'un écran « Paramètres tarifaires » lui
permettant de modifier à tout moment les prix des abonnements et la durée des essais gratuits, sans intervention de
l'équipe de développement. Le fichier .env reste réservé aux informations techniques sensibles (clés API, mode
sandbox/production) qui ne doivent pas être exposées ni modifiables depuis une interface web.
10.6 Environnements
– Environnement de test : dsp.sedjro.africa, hébergé sur le serveur de Sedjro, utilisé pour le développement et la
recette des quatre modules
– Environnement de production cible : dps.bj, activé après validation fonctionnelle sur l'environnement de test
– Configuration par environnement (.env distinct par environnement) pour les clés KKiaPay (sandbox vs
production), les identifiants de base de données et les URL de callback
11. Facturation, paiements et notifications
11.1 Facturation et paiements
Chaque paiement effectué sur la plateforme (abonnement Score NEWS, abonnement Événements indésirables, ou
réservation de formation) génère automatiquement une facture disponible au téléchargement dans l'espace de
l'utilisateur. L'historique de toutes les transactions est accessible à tout moment. Moyen de paiement disponible au
lancement : KKiaPay, qui couvre nativement le Mobile Money (MTN, Moov) et les cartes bancaires (voir détail
technique en 10.4).
11.2 Notifications
La plateforme envoie des notifications automatiques par email, également visibles dans l'espace personnel de
l'utilisateur, dans les situations suivantes :
– Confirmation d'inscription sur la plateforme
– Confirmation d'un paiement (abonnement ou formation)
– Rappel avant expiration d'une période d'essai (Score NEWS, Événements indésirables)
– Alerte clinique de niveau moyen ou élevé (module Score NEWS), vers le personnel désigné
– Nouvel événement indésirable de gravité élevée (module Événements indésirables)
– Communication d'une date de rendez-vous pour une formation, et rappel avant la session
– Disponibilité d'un rapport PDF (module Auto-évaluation)
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 13 / 15
12. Tableau de bord administrateur
L'administrateur de la plateforme dispose d'un espace de pilotage complet et autonome, lui permettant de gérer
l'ensemble de l'activité sans recourir à un développeur pour les opérations courantes.
12.1 Gestion des établissements et des abonnements
– Consulter la liste de tous les établissements inscrits et le statut de chacun de leurs modules (gratuit, essai,
payant, expiré)
– Accéder à la fiche détaillée de chaque établissement (informations, historique des évaluations, alertes
cliniques, événements indésirables, formations réservées)
– Activer, suspendre ou prolonger manuellement une période d'essai ou un abonnement
– Contacter un établissement directement via WhatsApp depuis la plateforme
12.2 Gestion des grilles d'évaluation
– Créer, modifier, activer ou archiver un standard (EH ou ESPC)
– Ajouter, modifier ou supprimer des domaines, normes, critères et questions
– Gérer le versionnage des grilles : une nouvelle version n'affecte pas les évaluations déjà réalisées
12.3 Gestion du module Score NEWS
– Paramétrer les seuils de score et la fréquence de surveillance associée à chaque niveau de risque
– Superviser les alertes actives tous établissements confondus (vue réservée à l'administrateur, sans accès aux
données patient détaillées d'un établissement tiers)
12.4 Gestion du module Événements indésirables
– Paramétrer la liste des types d'EI et l'échelle de gravité
– Consulter des statistiques agrégées et anonymisées tous établissements confondus, à des fins de veille
sectorielle
12.5 Gestion des formations
– Créer et publier des formations au catalogue
– Gérer les réservations en attente et fixer les dates de rendez-vous
– Clôturer une session de formation et suivre les présences
12.6 Statistiques globales
– Nombre d'établissements inscrits et actifs par module
– Nombre d'évaluations réalisées, d'alertes cliniques et d'EI déclarés par période
– Taux de conformité moyen de l'ensemble des établissements
– Réservations de formations en attente de traitement
– Évolution globale de l'activité dans le temps
13. Engagements et garanties
13.1 Confidentialité des données
Chaque établissement accède uniquement à ses propres données. Il est techniquement impossible pour un
établissement de voir les informations d'un autre établissement, y compris pour les données cliniques du module
Score NEWS et les événements indésirables déclarés. Les données sont strictement isolées par compte
Organisation.
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 14 / 15
13.2 Sécurité de l'accès
– Connexion sécurisée par identifiant et mot de passe personnel pour chaque utilisateur interne
– Vérification de l'identifiant fiscal (IFU) à l'inscription du compte Organisation
– Journalisation des accès et des actions sensibles (création/modification/suppression de fiche patient, clôture
d'EI)
– Protection contre les tentatives d'accès frauduleux
13.3 Disponibilité
La plateforme est accessible 24h/24, 7j/7, depuis un navigateur web récent sur ordinateur, tablette ou smartphone.
13.4 Immuabilité et traçabilité des résultats
Une évaluation d'auto-évaluation une fois soumise est définitive et ne peut plus être modifiée, ce qui garantit
l'intégrité des résultats et la fiabilité de l'historique de progression. De la même façon, une mesure Score NEWS ou
une fiche d'événement indésirable, une fois enregistrée, ne peut être supprimée : seule une correction tracée
(horodatée, avec motif) est possible.
13.5 Évolutivité
Les grilles d'évaluation, les seuils du score NEWS et la typologie des événements indésirables peuvent évoluer si
les standards de référence sont mis à jour. Toute nouvelle version est gérée de façon à ne pas affecter les données
déjà enregistrées, qui restent consultables dans leur forme d'origine.
14. Limites de la plateforme
– dps.bj ne se substitue pas au jugement clinique du personnel soignant ; les alertes du module Score NEWS
sont des aides à la priorisation et non des décisions médicales.
– Le score de conformité du module Auto-évaluation est une auto-évaluation documentaire et déclarative ; il ne
remplace pas une inspection officielle de l'ARS.
– La plateforme ne se connecte à aucun dispositif médical ou moniteur : toute donnée clinique est saisie
manuellement.
– La plateforme n'est pas un dossier patient informatisé (DPI) et ne conserve pas l'ensemble du dossier médical
du patient.
15. Périmètre de la version initiale (V1)
Les fonctionnalités décrites dans ce document constituent le périmètre cible. La version initiale livrée pourra, en
accord avec le client, être limitée à un sous-ensemble prioritaire - par exemple le module Auto-évaluation complet
dès le lancement, avec les modules Score NEWS et Événements indésirables déployés dans un second temps sur
l'environnement de test dsp.sedjro.africa avant bascule sur dps.bj.
dps.bj - Dispositif de Sécurité des Patients - CDC fonctionnel
Version 0.2 - page 15 / 15
16. Glossaire
– ARS : Autorité de Régulation du Secteur de la Santé (Bénin)
– EH : Établissement Hospitalier
– ESPC : Établissement de Soins de Premiers Contacts
– EI : Événement indésirable
– NEWS : National Early Warning Score, score clinique standardisé de détection précoce de la détérioration
d'un patient
– IFU : Identifiant Fiscal Unique
– CDC : Cahier des charges
– dps.bj : nom de domaine cible de la plateforme
– dsp.sedjro.africa : sous-domaine d'environnement de dev de la plateforme