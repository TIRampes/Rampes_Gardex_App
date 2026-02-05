-- CreateTable
CREATE TABLE `clients` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `type` ENUM('ENTREPRENEUR', 'RESIDENTIEL', 'DISTRIBUTEUR', 'AMBASSADEUR') NOT NULL DEFAULT 'ENTREPRENEUR',
    `adresse` TEXT NOT NULL,
    `telephone` VARCHAR(20) NOT NULL,
    `cellulaire` VARCHAR(20) NULL,
    `fax` VARCHAR(20) NULL,
    `personne_Contact` VARCHAR(255) NOT NULL,
    `emails` JSON NOT NULL,
    `communicationTexto` BOOLEAN NOT NULL DEFAULT false,
    `communicationCourriel` BOOLEAN NOT NULL DEFAULT true,
    `communicationTelephone` BOOLEAN NOT NULL DEFAULT false,
    `commentaires` TEXT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
