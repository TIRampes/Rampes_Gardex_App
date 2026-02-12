/*
  Warnings:

  - You are about to drop the column `contact` on the `clients` table. All the data in the column will be lost.
  - Added the required column `personne_contact` to the `clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `clients` DROP COLUMN `contact`,
    ADD COLUMN `personne_contact` VARCHAR(255) NOT NULL;
