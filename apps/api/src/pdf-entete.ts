import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type PDFDocument from "pdfkit";

// Logo officiel DSP (mise_a_jour/Logo DSP.png), copié dans apps/api/assets/.
// Le chemin est résolu depuis ce fichier : src/ en développement, dist/ une
// fois compilé ; les deux sont au même niveau que assets/.
export const CHEMIN_LOGO_DSP = fileURLToPath(new URL("../assets/logo-dsp.png", import.meta.url));

const BLEU = "#1657CC";
const GRIS = "#5B6472";
const TAILLE_LOGO = 72;

// En-tête commun des PDF : logo à gauche, nom du dispositif et sous-titre à droite.
export function ecrireEnTeteDsp(doc: InstanceType<typeof PDFDocument>, sousTitre?: string) {
  const gauche = doc.page.margins.left;
  const haut = doc.y;
  const avecLogo = existsSync(CHEMIN_LOGO_DSP);
  if (avecLogo) doc.image(CHEMIN_LOGO_DSP, gauche, haut, { width: TAILLE_LOGO, height: TAILLE_LOGO });
  const x = avecLogo ? gauche + TAILLE_LOGO + 14 : gauche;
  const largeur = doc.page.width - doc.page.margins.right - x;
  doc.fillColor(BLEU).font("Helvetica-Bold").fontSize(18).text("DSP · Dispositif de Sécurité des Patients", x, haut + 18, { width: largeur });
  if (sousTitre) doc.fillColor(GRIS).font("Helvetica").fontSize(10).text(sousTitre, x, doc.y, { width: largeur });
  // Reprise du flux sous le logo, à la marge gauche.
  doc.x = gauche;
  doc.y = Math.max(doc.y, haut + (avecLogo ? TAILLE_LOGO : 0)) + 6;
  doc.fillColor("black");
}
