-- Rapports statistiques (ROADMAP_RAPPORTS_STATISTIQUES.md, étape 2). Purement additive.

-- AlterTable
ALTER TABLE `organisations` ADD COLUMN `arrondissement` VARCHAR(191) NULL,
    ADD COLUMN `commune` VARCHAR(191) NULL,
    ADD COLUMN `departement` VARCHAR(191) NULL,
    ADD COLUMN `zone_sanitaire` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `utilisateur_roles` MODIFY `role` ENUM('RESPONSABLE_COMPTE', 'RESP_QUALITE', 'PERSONNEL_SOIGNANT', 'GESTIONNAIRE_FORMATION', 'ADMIN_PLATEFORME', 'AUTORITE_SANITAIRE') NOT NULL;

-- AlterTable
ALTER TABLE `utilisateurs` ADD COLUMN `autorite_sanitaire_id` VARCHAR(191) NULL,
    MODIFY `type_compte` ENUM('ORGANISATION', 'INDIVIDUEL', 'ADMIN_PLATEFORME', 'AUTORITE_SANITAIRE') NOT NULL;

-- CreateTable
CREATE TABLE `autorites_sanitaires` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `niveau` ENUM('ZONE_SANITAIRE', 'DEPARTEMENT', 'NATIONAL') NOT NULL,
    `departement` VARCHAR(191) NULL,
    `zone_sanitaire` VARCHAR(191) NULL,
    `zone_sanitaire_cle` VARCHAR(191) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rapports_statistiques` (
    `id` VARCHAR(191) NOT NULL,
    `organisation_id` VARCHAR(191) NOT NULL,
    `formulaire_code` VARCHAR(191) NOT NULL,
    `formulaire_version` VARCHAR(191) NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `statut` ENUM('BROUILLON', 'SOUMIS', 'VALIDE') NOT NULL DEFAULT 'BROUILLON',
    `entete` JSON NOT NULL,
    `valeurs` JSON NOT NULL,
    `departement` VARCHAR(191) NULL,
    `zone_sanitaire_cle` VARCHAR(191) NULL,
    `cree_par_id` VARCHAR(191) NOT NULL,
    `soumis_par_id` VARCHAR(191) NULL,
    `soumis_le` DATETIME(3) NULL,
    `recu_le` DATETIME(3) NULL,
    `valide_par_id` VARCHAR(191) NULL,
    `valide_le` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rapports_statistiques_statut_departement_zone_sanitaire_cle_idx`(`statut`, `departement`, `zone_sanitaire_cle`),
    UNIQUE INDEX `rapports_statistiques_organisation_id_formulaire_code_period_key`(`organisation_id`, `formulaire_code`, `periode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `utilisateurs_autorite_sanitaire_id_idx` ON `utilisateurs`(`autorite_sanitaire_id`);

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_autorite_sanitaire_id_fkey` FOREIGN KEY (`autorite_sanitaire_id`) REFERENCES `autorites_sanitaires`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapports_statistiques` ADD CONSTRAINT `rapports_statistiques_organisation_id_fkey` FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapports_statistiques` ADD CONSTRAINT `rapports_statistiques_cree_par_id_fkey` FOREIGN KEY (`cree_par_id`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapports_statistiques` ADD CONSTRAINT `rapports_statistiques_soumis_par_id_fkey` FOREIGN KEY (`soumis_par_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapports_statistiques` ADD CONSTRAINT `rapports_statistiques_valide_par_id_fkey` FOREIGN KEY (`valide_par_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

