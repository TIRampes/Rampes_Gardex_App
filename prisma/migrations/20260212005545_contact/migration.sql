/*
  Warnings:

  - You are about to drop the column `personne_contact` on the `clients` table. All the data in the column will be lost.
  - Added the required column `personne_Contact` to the `clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `clients` DROP COLUMN `personne_contact`,
    ADD COLUMN `personne_Contact` VARCHAR(255) NOT NULL;
