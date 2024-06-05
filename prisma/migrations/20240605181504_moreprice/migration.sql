/*
  Warnings:

  - You are about to alter the column `Price` on the `Quote` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,6)`.

*/
-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "Price" SET DATA TYPE DECIMAL(10,6);
