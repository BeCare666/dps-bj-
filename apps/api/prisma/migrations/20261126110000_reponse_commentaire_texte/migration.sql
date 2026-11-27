-- Auto-évaluation : le texte saisi avec la réponse « Observations » peut dépasser
-- 191 caractères. Élargissement VARCHAR(191) → TEXT, sans perte de données.

-- AlterTable
ALTER TABLE `reponses` MODIFY `commentaire` TEXT NULL;
