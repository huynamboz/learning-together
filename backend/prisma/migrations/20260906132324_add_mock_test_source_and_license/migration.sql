-- CreateEnum
CREATE TYPE "ContentLicense" AS ENUM ('ORIGINAL', 'LICENSED', 'RESTRICTED');

-- AlterTable
ALTER TABLE "MockTest" ADD COLUMN     "license" "ContentLicense" NOT NULL DEFAULT 'ORIGINAL',
ADD COLUMN     "source" VARCHAR(255);
