/*
  Warnings:

  - Added the required column `metadata` to the `Events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Events" ADD COLUMN     "metadata" JSONB NOT NULL;
