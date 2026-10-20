/*
  Warnings:

  - A unique constraint covering the columns `[referenceNo]` on the table `Tender` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referenceNo` to the `Tender` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Tender_sourceUrl_key";

-- AlterTable
ALTER TABLE "Tender" ADD COLUMN     "referenceNo" TEXT NOT NULL,
ALTER COLUMN "sourceUrl" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tender_referenceNo_key" ON "Tender"("referenceNo");
