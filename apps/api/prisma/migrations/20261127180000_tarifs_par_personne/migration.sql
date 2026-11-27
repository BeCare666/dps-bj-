-- Tarifs par personne selon la taille du groupe (demande client du 27/11/2026).
-- Formations : 3 prix par personne, valeurs par défaut 5 000 / 3 000 / 2 000 FCFA.
ALTER TABLE `formations` ADD COLUMN `prix_personne_1_5` INTEGER NOT NULL DEFAULT 5000;
ALTER TABLE `formations` ADD COLUMN `prix_personne_6_10` INTEGER NOT NULL DEFAULT 3000;
ALTER TABLE `formations` ADD COLUMN `prix_personne_11_plus` INTEGER NOT NULL DEFAULT 2000;
ALTER TABLE `formations` DROP COLUMN `prix_individuel`;
ALTER TABLE `formations` DROP COLUMN `prix_groupe_5`;
ALTER TABLE `formations` DROP COLUMN `prix_groupe_10`;

-- Réservations : nombre de places libre au lieu des formules 1 / 5 / 10.
ALTER TABLE `reservations` ADD COLUMN `nombre_places` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `reservations` ADD COLUMN `prix_par_personne` INTEGER NOT NULL DEFAULT 0;
UPDATE `reservations` SET `nombre_places` = CASE `formule` WHEN 'GROUPE_5' THEN 5 WHEN 'GROUPE_10' THEN 10 ELSE 1 END;
UPDATE `reservations` SET `prix_par_personne` = FLOOR(`tarif_applique` / `nombre_places`);
ALTER TABLE `reservations` ALTER COLUMN `nombre_places` DROP DEFAULT;
ALTER TABLE `reservations` ALTER COLUMN `prix_par_personne` DROP DEFAULT;
ALTER TABLE `reservations` DROP COLUMN `formule`;
