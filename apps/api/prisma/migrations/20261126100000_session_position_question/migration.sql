-- Auto-évaluation : reprise exacte du questionnaire à la question où l'utilisateur
-- s'était arrêté. Purement additive (colonne nullable, aucune donnée modifiée).

-- AlterTable
ALTER TABLE `sessions_evaluation` ADD COLUMN `position_question` INTEGER NULL;
