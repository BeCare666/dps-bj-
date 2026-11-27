# Conversion des grilles officielles ARS (fichiers Excel du dossier mise_a_jour/)
# vers les JSON lus par importer.ts.
#
#   python -I apps/api/prisma/grilles-ars/convertir_xlsx.py
#
# Lecture ligne à ligne des onglets « Domaine X » : colonne A = domaine,
# B = norme (« A.1 libellé »), C/D/E = n°, titre et catégorie du critère,
# F = méthode, G = élément mesurable. Les cellules fusionnées ne portent leur
# valeur que sur la première ligne : domaine, norme et critère sont repris tant
# qu'une nouvelle valeur n'apparaît pas. Une ligne G sans méthode (F vide)
# reprend la méthode de la ligne précédente.
#
# Les fichiers Excel font foi. Les seules corrections appliquées sont listées
# dans CORRECTIONS ci-dessous et sont affichées à chaque exécution.
import json
import re
import sys
from pathlib import Path

import openpyxl

sys.stdout.reconfigure(encoding="utf-8")

RACINE = Path(__file__).resolve().parents[4]
SOURCES = RACINE / "mise_a_jour"
SORTIE = Path(__file__).resolve().parent

METHODES = {
    "Documents à examiner": "DOCUMENT_A_EXAMINER",
    "Entretiens": "ENTRETIEN",
    "Interviews": "ENTRETIEN",
    "Observations": "OBSERVATION",
    "Observation": "OBSERVATION",
}

# Noms des domaines de la grille EH « Essentiel » : l'onglet « Domaine B » n'a
# pas de cellule A, et la cellule A de « Domaine E » répète deux fois le nom.
# Repris de la grille EH essentielle déjà publiée (eh.json, v1), dont les
# domaines A, C et D sont identiques au fichier Excel.
DOMAINES_EH_ESSENTIEL = {
    "B": "B. Normes relatives à l’implication des patients et du public",
    "E": "E. Normes d’apprentissage tout au long de la vie",
}

# Libellés des normes de la grille EH « Essentiel » : dans le fichier Excel,
# 7 des 12 libellés portent des coquilles ou des restes de la version anglaise
# (« patientse », « sécuritédes », « hôpial », « system. »,
# « programme de Avancée professionnel … development programme with patient
# safety as a cross-cutting theme. »). Les 12 libellés sont repris de la grille
# EH essentielle v1 (eh.json, contrôlée sur le manuel le 12/10/2026) ; les 5
# libellés sans défaut y sont identiques mot pour mot.
NORMES_EH_ESSENTIEL = {
    "A.1": "La direction et la gestion sont engagées en faveur de la sécurité des patients.",
    "A.2": "L’hôpital a un programme de sécurité des patients",
    "A.4": "L’hôpital possède des équipements et appareils essentiels fonctionnels pour fournir ses services",
    "A.5": "L’hôpital dispose de personnel compétent au plan technique à tout moment pour dispenser des soins sûrs afin d’assurer la sécurité des patients.",
    "B.2": "L'hôpital sensibilise les patients et leurs aidants pour leur donner les moyens de partager les bonnes décisions concernant leurs soins",
    "B.3": "L'hôpital garantit les meilleures pratiques d'identification et de vérification des patients à toutes les étapes des soins",
    "C.1": "L'hôpital a une gouvernance clinique efficace qui garantit l'inclusion de la sécurité des patients",
    "C.2": "L'hôpital dispose d'un système pour réduire le risque des infections associées aux soins",
    "C.3": "L’hôpital assure la sécurité du sang et des produits sanguins",
    "C.4": "L'hôpital assure des injections, des perfusions et des vaccinations en toute sécurité",
    "D.2": "L’hôpital a un système de gestion des déchets sécurisé.",
    "E.1": "L’établissement hospitalier a pour le personnel, un programme de développement professionnel continu, dans lequel la sécurité des patients est un thème transversal.",
}

GRILLES = [
    {
        "xlsx": "Grille_d_evaluation_EH_Essentiel_corrigee.xlsx",
        "json": "eh.json",
        "nom": "Grille d'auto-évaluation des critères essentiels des EH",
        "type": "EH",
        "categorie": "Essentiel",
        "domaines": DOMAINES_EH_ESSENTIEL,
        "normes": NORMES_EH_ESSENTIEL,
    },
    {
        "xlsx": "Grille_d_evaluation_EH_Fondamental.xlsx",
        "json": "eh-fondamental.json",
        "nom": "Grille d'auto-évaluation des critères fondamentaux des EH",
        "type": "EH",
        "categorie": "Fondamental",
    },
    {
        "xlsx": "Grille_d_evaluation_EH_Avance.xlsx",
        "json": "eh-avance.json",
        "nom": "Grille d'auto-évaluation des critères avancés des EH",
        "type": "EH",
        "categorie": "Avancé",
    },
    {
        "xlsx": "Grille_autoevaluation_ESPC_Essentiels.xlsx",
        "json": "espc.json",
        "nom": "Grille d'auto-évaluation des critères essentiels des ESPC",
        "type": "ESPC",
        "categorie": "Essentiel",
    },
    {
        "xlsx": "Grille_autoevaluation_ESPC_Fondamentaux.xlsx",
        "json": "espc-fondamental.json",
        "nom": "Grille d'auto-évaluation des critères fondamentaux des ESPC",
        "type": "ESPC",
        "categorie": "Fondamental",
    },
    {
        "xlsx": "Grille_autoevaluation_ESPC_Avances.xlsx",
        "json": "espc-avance.json",
        "nom": "Grille d'auto-évaluation des critères avancés des ESPC",
        "type": "ESPC",
        "categorie": "Avancé",
    },
]


def nettoyer(valeur):
    if valeur is None:
        return None
    texte = str(valeur).replace(" ", " ").replace("\xa0", " ")
    texte = re.sub(r"[ \t]+", " ", texte)
    texte = "\n".join(ligne.strip() for ligne in texte.split("\n"))
    texte = re.sub(r"\n+", "\n", texte).strip()
    return texte or None


def convertir(config):
    classeur = openpyxl.load_workbook(SOURCES / config["xlsx"])
    corrections = []
    domaines = []
    for feuille in classeur.worksheets:
        if not feuille.title.startswith("Domaine "):
            continue
        lettre = feuille.title.split(" ")[1]
        domaine = norme = critere = None
        methode = None
        for ligne in range(3, feuille.max_row + 1):
            a, b, c, d, e, f, g = (nettoyer(feuille.cell(ligne, col).value) for col in range(1, 8))
            if domaine is None:
                nom = config.get("domaines", {}).get(lettre, a)
                if nom != a:
                    corrections.append(f"{feuille.title}!A{ligne} : nom du domaine {a!r} remplacé par {nom!r}")
                if not nom:
                    raise ValueError(f"{config['xlsx']} {feuille.title} : domaine sans nom")
                domaine = {"nom": nom, "ordre": len(domaines) + 1, "normes": []}
                domaines.append(domaine)
            elif a:
                raise ValueError(f"{config['xlsx']} {feuille.title}!A{ligne} : second domaine dans l'onglet")
            if b:
                trouve = re.match(r"^([A-E]\.\d+)\s*(.*)$", b, re.S)
                if not trouve:
                    raise ValueError(f"{config['xlsx']} {feuille.title}!B{ligne} : norme sans code")
                code, libelle = trouve.group(1), trouve.group(2).strip()
                if code in config.get("normes", {}):
                    remplacement = config["normes"][code]
                    if remplacement != libelle:
                        corrections.append(f"{feuille.title}!B{ligne} : norme {code} {libelle!r} remplacée par {remplacement!r}")
                    libelle = remplacement
                norme = {"code": code, "libelle": libelle, "ordre": len(domaine["normes"]) + 1, "criteres": []}
                domaine["normes"].append(norme)
            if c:
                categorie = e
                if categorie != config["categorie"]:
                    corrections.append(f"{feuille.title}!E{ligne} : catégorie {categorie!r} remplacée par {config['categorie']!r}")
                critere = {
                    "code": c,
                    "libelle": d,
                    "categorie": config["categorie"],
                    "registre": None,
                    "ordre": len(norme["criteres"]) + 1,
                    "elementsMesurables": [],
                }
                if not critere["code"].startswith(norme["code"] + "."):
                    raise ValueError(f"{config['xlsx']} {c} hors de la norme {norme['code']}")
                norme["criteres"].append(critere)
            elif d or e:
                raise ValueError(f"{config['xlsx']} {feuille.title} ligne {ligne} : titre ou catégorie sans n° de critère")
            if f:
                if f not in METHODES:
                    raise ValueError(f"{config['xlsx']} {feuille.title}!F{ligne} : méthode inconnue {f!r}")
                methode = METHODES[f]
            if g:
                libelle = g
                # Guillemet ouvrant isolé (sans guillemet fermant) en tête de cellule.
                if libelle.startswith('"') and libelle.count('"') == 1:
                    libelle = libelle[1:].strip()
                    corrections.append(f"{feuille.title}!G{ligne} ({critere['code']}) : guillemet isolé en tête supprimé")
                critere["elementsMesurables"].append(
                    {
                        "libelle": libelle,
                        "typeElement": methode,
                        "typeReponse": "OUI_NON",
                        "entreDansScore": methode == "DOCUMENT_A_EXAMINER",
                        "ordre": len(critere["elementsMesurables"]) + 1,
                    }
                )
            elif f:
                raise ValueError(f"{config['xlsx']} {feuille.title}!F{ligne} : méthode sans élément mesurable")
    return domaines, corrections


def main():
    for config in GRILLES:
        domaines, corrections = convertir(config)
        grille = {
            "_source": f"mise_a_jour/{config['xlsx']} (ARS Bénin), converti par prisma/grilles-ars/convertir_xlsx.py",
            "nom": config["nom"],
            "type": config["type"],
            "domaines": domaines,
        }
        (SORTIE / config["json"]).write_text(json.dumps(grille, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        criteres = [c for d in domaines for n in d["normes"] for c in n["criteres"]]
        elements = [e for c in criteres for e in c["elementsMesurables"]]
        print(
            f"{config['json']:22} {len(domaines)} domaines, {sum(len(d['normes']) for d in domaines)} normes, "
            f"{len(criteres)} critères, {len(elements)} éléments dont {sum(e['entreDansScore'] for e in elements)} documents"
        )
        for correction in corrections:
            print(f"    correction : {correction}")


if __name__ == "__main__":
    main()
