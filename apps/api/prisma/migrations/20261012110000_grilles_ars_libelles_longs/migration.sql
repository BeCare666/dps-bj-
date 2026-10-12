-- Grilles officielles ARS : certains libellés (normes, critères, éléments mesurables)
-- dépassent 191 caractères (jusqu'à 645). Élargissement VARCHAR(191) -> TEXT, sans perte.

-- AlterTable
ALTER TABLE `criteres` MODIFY `libelle` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `elements_mesurables` MODIFY `libelle` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `normes` MODIFY `libelle` TEXT NOT NULL;
