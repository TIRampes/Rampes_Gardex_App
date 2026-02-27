-- CreateTable
CREATE TABLE `Livre` (
    `id` VARCHAR(191) NOT NULL,
    `titre` VARCHAR(191) NOT NULL,
    `auteur` VARCHAR(191) NOT NULL,
    `annee` INTEGER NULL,
    `isbn` VARCHAR(191) NULL,
    `prix` DOUBLE NOT NULL,
    `disponible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Livre_isbn_key`(`isbn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `envois_attente` (
    `id` VARCHAR(191) NOT NULL,
    `representantId` VARCHAR(191) NOT NULL,
    `dateEnvoi` DATETIME(3) NOT NULL,
    `type` ENUM('STANDARD', 'COMMERCIAL', 'MULTI_PHASE', 'MULTIPLAN') NOT NULL,
    `nbCommandes` INTEGER NOT NULL,
    `statut` ENUM('ACTIVE', 'EN_ATTENTE', 'COMPLETEE', 'ANNULEE') NOT NULL,
    `messageId` VARCHAR(255) NULL,
    `commandeIds` JSON NOT NULL,
    `erreur` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `envois_attente_representantId_idx`(`representantId`),
    INDEX `envois_attente_dateEnvoi_idx`(`dateEnvoi`),
    INDEX `envois_attente_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `envois_attente` ADD CONSTRAINT `envois_attente_representantId_fkey` FOREIGN KEY (`representantId`) REFERENCES `representants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
