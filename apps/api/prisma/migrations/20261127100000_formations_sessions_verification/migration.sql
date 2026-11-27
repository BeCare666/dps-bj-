-- Espace Formations (catalogue officiel EH/ESPC, sessions en ligne Google Meet,
-- participants et présence) et vérification des établissements (évaluations
-- ARS / Ministère enregistrées par DSP). ROADMAP_FORMATIONS_VERIFICATION.md §2.

-- AlterTable
ALTER TABLE `formations` ADD COLUMN `contenus` TEXT NULL,
    ADD COLUMN `critere` VARCHAR(191) NULL,
    ADD COLUMN `domaine` VARCHAR(191) NULL,
    ADD COLUMN `domaine_code` VARCHAR(191) NULL,
    ADD COLUMN `duree_libelle` VARCHAR(191) NULL,
    ADD COLUMN `evaluation` TEXT NULL,
    ADD COLUMN `exigence_ars` TEXT NULL,
    ADD COLUMN `image_cloudinary_id` VARCHAR(191) NULL,
    ADD COLUMN `image_url` TEXT NULL,
    ADD COLUMN `methode` TEXT NULL,
    ADD COLUMN `niveau` ENUM('ESSENTIEL', 'FONDAMENTAL', 'AVANCE') NULL,
    ADD COLUMN `ordre` INTEGER NULL,
    ADD COLUMN `public_cible` TEXT NULL,
    ADD COLUMN `type_etablissement` ENUM('EH', 'ESPC') NULL,
    MODIFY `duree_heures` DOUBLE NULL,
    MODIFY `prix_individuel` INTEGER NULL,
    MODIFY `prix_groupe_5` INTEGER NULL,
    MODIFY `prix_groupe_10` INTEGER NULL;

-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `session_formation_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `sessions_formation` (
    `id` VARCHAR(191) NOT NULL,
    `formation_id` VARCHAR(191) NOT NULL,
    `debut` DATETIME(3) NOT NULL,
    `fin` DATETIME(3) NOT NULL,
    `lien_meet` TEXT NOT NULL,
    `code_meet` VARCHAR(191) NULL,
    `places_max` INTEGER NULL,
    `statut` ENUM('PLANIFIEE', 'TERMINEE', 'ANNULEE') NOT NULL DEFAULT 'PLANIFIEE',
    `cloturee_le` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sessions_formation_formation_id_idx`(`formation_id`),
    INDEX `sessions_formation_debut_idx`(`debut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participants_formation` (
    `id` VARCHAR(191) NOT NULL,
    `reservation_id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `fonction` VARCHAR(191) NOT NULL,
    `service` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `telephone` VARCHAR(191) NULL,
    `invitation_envoyee_le` DATETIME(3) NULL,
    `present` BOOLEAN NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `participants_formation_reservation_id_idx`(`reservation_id`),
    UNIQUE INDEX `participants_formation_reservation_id_email_key`(`reservation_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluations_externes` (
    `id` VARCHAR(191) NOT NULL,
    `organisation_id` VARCHAR(191) NULL,
    `nom_etablissement` VARCHAR(191) NOT NULL,
    `type_etablissement` ENUM('EH', 'ESPC') NOT NULL,
    `ville` VARCHAR(191) NULL,
    `ifu` VARCHAR(191) NULL,
    `source` ENUM('ARS', 'MINISTERE') NOT NULL,
    `niveau` INTEGER NOT NULL,
    `date_evaluation` DATETIME(3) NOT NULL,
    `pct_essentiels` DOUBLE NULL,
    `pct_fondamentaux` DOUBLE NULL,
    `pct_avances` DOUBLE NULL,
    `reference` VARCHAR(191) NULL,
    `document_url` TEXT NOT NULL,
    `document_cloudinary_id` VARCHAR(191) NOT NULL,
    `document_nom` VARCHAR(191) NOT NULL,
    `saisie_par_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `evaluations_externes_organisation_id_idx`(`organisation_id`),
    INDEX `evaluations_externes_ifu_idx`(`ifu`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `formations_type_etablissement_idx` ON `formations`(`type_etablissement`);

-- CreateIndex
CREATE INDEX `reservations_session_formation_id_idx` ON `reservations`(`session_formation_id`);

-- AddForeignKey
ALTER TABLE `sessions_formation` ADD CONSTRAINT `sessions_formation_formation_id_fkey` FOREIGN KEY (`formation_id`) REFERENCES `formations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participants_formation` ADD CONSTRAINT `participants_formation_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_session_formation_id_fkey` FOREIGN KEY (`session_formation_id`) REFERENCES `sessions_formation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations_externes` ADD CONSTRAINT `evaluations_externes_organisation_id_fkey` FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations_externes` ADD CONSTRAINT `evaluations_externes_saisie_par_id_fkey` FOREIGN KEY (`saisie_par_id`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

