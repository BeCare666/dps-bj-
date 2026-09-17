import { Injectable, Logger } from "@nestjs/common";
import { BrevoService } from "./brevo.service.js";
import { rendreEmailVerification } from "./templates/email-verification.template.js";

// 11.2 — intégration Brevo réelle. Un échec d'envoi est toujours loggé bruyamment
// mais jamais renvoyé à l'appelant : une notification qui échoue ne doit pas faire
// échouer l'action métier déjà accomplie (inscription, alerte, paiement...) — le
// rattrapage se fait via un renvoi explicite (ex. `POST /auth/resend-verification`)
// plutôt qu'en bloquant la requête d'origine.
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly brevo: BrevoService) {}

  async sendVerificationEmail(email: string, prenom: string, lienVerification: string): Promise<void> {
    await this.envoyerSansEchouer({
      destinataire: { email, name: prenom },
      sujet: "Confirmez votre adresse email — dps.bj",
      contenuHtml: rendreEmailVerification({ prenom, lienVerification }),
      contenuTexte: `Bienvenue ${prenom},\n\nConfirmez votre adresse email pour activer votre compte dps.bj :\n${lienVerification}\n\nCe lien expire dans 48 heures.`,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const lien = `${process.env.WEB_APP_URL}/reinitialiser-mot-de-passe?token=${resetToken}`;
    await this.envoyerSansEchouer({
      destinataire: { email },
      sujet: "Réinitialisation de votre mot de passe — dps.bj",
      contenuHtml: `<p>Vous avez demandé la réinitialisation de votre mot de passe.</p><p><a href="${lien}">Choisir un nouveau mot de passe</a></p><p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
    });
  }

  // RM9 — notification automatique sur alerte NEWS moyen/élevé (7.6).
  async sendAlerteNewsEmail(email: string, patientNomComplet: string, niveauRisque: string): Promise<void> {
    await this.envoyerSansEchouer({
      destinataire: { email },
      sujet: `Alerte NEWS ${niveauRisque} — ${patientNomComplet}`,
      contenuHtml: `<p>Une mesure NEWS de niveau <strong>${niveauRisque}</strong> a été enregistrée pour le patient <strong>${patientNomComplet}</strong>.</p><p>Merci de consulter le dossier patient sur dps.bj.</p>`,
    });
  }

  // RM9 — mécanisme commun avec NEWS : notification automatique sur EI gravité élevée (8.9).
  async sendAlerteEiGraviteElevee(email: string, evenementId: string): Promise<void> {
    await this.envoyerSansEchouer({
      destinataire: { email },
      sujet: "Événement indésirable de gravité élevée",
      contenuHtml: `<p>Un événement indésirable de gravité <strong>élevée</strong> a été qualifié (référence <code>${evenementId}</code>).</p><p>Merci de le traiter en priorité sur dps.bj.</p>`,
    });
  }

  // 9.6 — confirmation paiement / date de RDV (formations).
  async sendNotificationGenerique(email: string, message: string): Promise<void> {
    await this.envoyerSansEchouer({
      destinataire: { email },
      sujet: "Notification dps.bj",
      contenuHtml: `<p>${message}</p>`,
    });
  }

  private async envoyerSansEchouer(params: Parameters<BrevoService["envoyer"]>[0]): Promise<void> {
    try {
      await this.brevo.envoyer(params);
    } catch (erreur) {
      this.logger.error(`Échec d'envoi email "${params.sujet}" à ${params.destinataire.email} : ${erreur}`);
    }
  }
}
