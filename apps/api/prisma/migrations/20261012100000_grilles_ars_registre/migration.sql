-- Grilles officielles ARS (EH / ESPC) : mention « Registre … » portée sous le n° de certains critères
-- de la grille ESPC. Purement additive.

-- AlterTable
ALTER TABLE `criteres` ADD COLUMN `registre` VARCHAR(191) NULL;
