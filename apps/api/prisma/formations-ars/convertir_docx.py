# Conversion du catalogue officiel des formations (dossier formations/ fourni par
# le client) vers les JSON lus par importer.ts.
#
#   python -I apps/api/prisma/formations-ars/convertir_docx.py
#
# Sources retenues (ROADMAP_FORMATIONS_VERIFICATION.md §0) :
#   - EH   : « Programmes de formation EH.docx » (85 formations, programme détaillé).
#   - ESPC : « Formations, procédures, protocoles et lignes directrices – Manuel ESPC.docx »,
#            section 1 (19 formations). « Programmes de formation ESPC.docx » est une copie
#            du document EH : il n'est pas lu.
# Le texte des documents est repris tel quel. Seules opérations : découpage du
# programme sur ses intitulés (« Objectif : », « Exigence A.R.S : », « Contenus : »,
# « Méthode : », « Évaluation : ») et lecture du nombre d'heures initial de la
# durée (« 30 min » = 0,5 h), le libellé complet de la durée étant conservé.
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

sys.stdout.reconfigure(encoding="utf-8")
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
RACINE = Path(__file__).resolve().parents[4]
DOSSIER = RACINE / "formations"
SORTIE = Path(__file__).resolve().parent
# Parcours EH : données statiques affichées par le site, générées dans @dps/shared.
SORTIE_PARCOURS = RACINE / "packages" / "shared" / "src" / "formations" / "parcours-eh.ts"

NIVEAUX = {"E": "ESSENTIEL", "F": "FONDAMENTAL", "A": "AVANCE"}
# Domaines ESPC : le tableau des formations ESPC n'a pas d'intertitre de domaine ;
# libellés des domaines de la grille officielle ESPC (prisma/grilles-ars/espc.json).
DOMAINES_ESPC = {
    "A": "Leadership et gestion",
    "B": "Implication des patients et de la communauté",
    "C": "Pratiques cliniques sécurisées fondées sur des bases factuelles",
    "D": "Environnement sécurisé",
    "E": "Apprentissage continu",
}
INTITULES = {
    "Objectif": "objectif",
    "Exigence A.R.S": "exigenceArs",
    "Contenus": "contenus",
    "Méthode": "methode",
    "Évaluation": "evaluation",
}


def texte(el):
    return "".join(t.text or "" for t in el.iter(W + "t")).strip()


def blocs(chemin):
    """Paragraphes (style, texte) et tableaux (lignes de cellules), dans l'ordre."""
    corps = ET.fromstring(zipfile.ZipFile(chemin).read("word/document.xml")).find(W + "body")
    for el in corps:
        if el.tag == W + "p":
            style = el.find(f"{W}pPr/{W}pStyle")
            yield "p", (style.get(W + "val") if style is not None else "", texte(el))
        elif el.tag == W + "tbl":
            yield "t", [[texte(tc) for tc in tr.findall(W + "tc")] for tr in el.iter(W + "tr")]


def decouper_programme(programme):
    motif = "|".join(re.escape(k) for k in INTITULES)
    morceaux = re.split(rf"(?:^|(?<=\. ))({motif}) : ", programme)
    if morceaux[0].strip():
        raise ValueError(f"Programme sans intitulé initial : {programme[:80]}")
    champs = {}
    for cle, valeur in zip(morceaux[1::2], morceaux[2::2]):
        champs[INTITULES[cle]] = valeur.strip()
    if "contenus" not in champs:
        raise ValueError(f"Programme sans contenus : {programme[:80]}")
    return champs


def heures(duree):
    m = re.match(r"\s*(\d+(?:,\d+)?)\s*(h|min)\b", duree)
    if not m:
        raise ValueError(f"Durée illisible : {duree}")
    valeur = float(m.group(1).replace(",", "."))
    return round(valeur / 60, 2) if m.group(2) == "min" else valeur


def formations_eh():
    domaine = None
    formations = []
    for genre, contenu in blocs(DOSSIER / "Programmes de formation EH.docx"):
        if genre == "p":
            m = re.match(r"Domaine ([A-E]) – (.+)", contenu[1])
            if m:
                domaine = (m.group(1), m.group(2))
            continue
        for ligne in contenu[1:]:
            ligne = [c for c in ligne if c != ""] if len(ligne) > 5 else ligne
            m = re.match(r"([A-E](?:\.\d+)+) \(([EFA])\)$", ligne[0])
            if not m or ligne[0] == "Critère":
                continue
            if domaine is None or domaine[0] != m.group(1)[0]:
                raise ValueError(f"Domaine incohérent pour {ligne[0]}")
            critere, niveau = m.group(1), m.group(2)
            formations.append({
                "critere": critere,
                "niveau": NIVEAUX[niveau],
                "domaineCode": domaine[0],
                "domaine": domaine[1],
                "titre": ligne[1],
                "public": ligne[2],
                **decouper_programme(ligne[3]),
                "dureeLibelle": ligne[4],
                "dureeHeures": heures(ligne[4]),
            })
    return formations


def formations_espc():
    formations = []
    for genre, contenu in blocs(DOSSIER / "Formations, procédures, protocoles et lignes directrices – Manuel ESPC.docx"):
        if genre == "p" and contenu[1].startswith("2. Procédures"):
            break
        if genre != "t" or contenu[0][:2] != ["Critère", "Formation"]:
            continue
        for ligne in contenu[1:]:
            critere = ligne[0]
            niveau_code = critere.split(".")[2]
            if not re.fullmatch(r"[A-E](?:\.\d+)+", critere) or niveau_code not in "123":
                raise ValueError(f"Critère ESPC illisible : {critere}")
            formations.append({
                "critere": critere,
                # Le niveau se lit au 3e chiffre du code (document ESPC, introduction).
                "niveau": {"1": "ESSENTIEL", "2": "FONDAMENTAL", "3": "AVANCE"}[niveau_code],
                "domaineCode": critere[0],
                "domaine": DOMAINES_ESPC[critere[0]],
                "titre": ligne[1],
                "public": ligne[2],
                **decouper_programme(ligne[3]),
                "dureeLibelle": ligne[4],
                "dureeHeures": heures(ligne[4]),
            })
    return formations


def ecrire(nom, formations, attendu):
    if len(formations) != attendu:
        raise ValueError(f"{nom} : {len(formations)} formations lues, {attendu} attendues")
    for i, f in enumerate(formations):
        f["ordre"] = i + 1
    (SORTIE / nom).write_text(json.dumps(formations, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    repartition = {n: sum(1 for f in formations if f["niveau"] == n) for n in NIVEAUX.values()}
    total = sum(f["dureeHeures"] for f in formations)
    print(f"{nom} : {len(formations)} formations {repartition}, {total:g} h (durées initiales)")


CODE = r"[A-E](?:\.\d+){3}"


def parcours_eh(codes_connus):
    """Section 4 du document EH : socle commun (journées) et parcours par métier."""
    socle, parcours, titre_socle = [], [], None
    for genre, contenu in blocs(DOSSIER / "Programmes de formation EH.docx"):
        if genre == "p":
            ligne = contenu[1]
            if ligne.startswith("Socle commun pour tout le personnel"):
                titre_socle = ligne
            m = re.match(r"(Jour \d+|Session courte) – (.+)", ligne)
            if titre_socle and m:
                socle.append({"etape": m.group(1), "libelle": m.group(2), "criteres": re.findall(CODE, m.group(2))})
            continue
        if contenu[0] != ["Parcours", "Formations principales", "Volume (h)"]:
            continue
        for nom, formations, volume in contenu[1:]:
            parcours.append({
                "nom": nom,
                "formations": formations,
                "criteres": re.findall(CODE, formations),
                "volumeHeures": float(volume.replace(",", ".")),
            })
    for etape in socle + parcours:
        inconnus = [c for c in etape["criteres"] if c not in codes_connus]
        if inconnus or not etape["criteres"]:
            raise ValueError(f"Parcours « {etape.get('nom') or etape['etape']} » : critères {inconnus or 'absents'}")
    if len(socle) != 6 or len(parcours) != 6:
        raise ValueError(f"{len(socle)} étapes de socle et {len(parcours)} parcours lus, 6 et 6 attendus")
    donnees = {"socle": {"titre": titre_socle, "etapes": socle}, "parcours": parcours}
    SORTIE_PARCOURS.parent.mkdir(exist_ok=True)
    SORTIE_PARCOURS.write_text(
        "// Fichier généré par apps/api/prisma/formations-ars/convertir_docx.py, ne pas modifier.\n"
        "// Source : « Programmes de formation EH.docx », section 4 (socle commun et parcours).\n"
        'import type { ParcoursFormationsEh } from "./types.js";\n\n'
        f"export const PARCOURS_FORMATIONS_EH: ParcoursFormationsEh = {json.dumps(donnees, ensure_ascii=False, indent=2)};\n",
        encoding="utf-8",
    )
    print(f"parcours-eh.ts : socle en {len(socle)} étapes, {len(parcours)} parcours par métier")


eh = formations_eh()
ecrire("eh.json", eh, 85)
ecrire("espc.json", formations_espc(), 19)
parcours_eh({f["critere"] for f in eh})
