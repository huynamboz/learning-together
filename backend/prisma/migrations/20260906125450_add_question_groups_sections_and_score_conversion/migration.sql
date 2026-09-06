-- CreateEnum
CREATE TYPE "ExamSectionKind" AS ENUM ('LISTENING', 'READING');

-- CreateEnum
CREATE TYPE "QuestionGroupType" AS ENUM ('PHOTO', 'SHORT_RESPONSE', 'CONVERSATION', 'TALK', 'SINGLE_SENTENCE', 'TEXT_COMPLETION', 'PASSAGE_SET');

-- CreateEnum
CREATE TYPE "ScoreSource" AS ENUM ('OFFICIAL_TABLE', 'ESTIMATED', 'RAW_ONLY');

-- AlterTable
ALTER TABLE "ExamResult" ADD COLUMN     "listeningCorrect" INTEGER,
ADD COLUMN     "listeningScaled" INTEGER,
ADD COLUMN     "readingCorrect" INTEGER,
ADD COLUMN     "readingScaled" INTEGER,
ADD COLUMN     "scoreSource" "ScoreSource" NOT NULL DEFAULT 'RAW_ONLY';

-- AlterTable
ALTER TABLE "MockTestQuestion" ADD COLUMN     "sectionId" UUID;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "groupId" UUID,
ADD COLUMN     "numberInTest" INTEGER,
ADD COLUMN     "optionsHidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MockTestSection" (
    "id" UUID NOT NULL,
    "testId" UUID NOT NULL,
    "kind" "ExamSectionKind" NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "MockTestSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionGroup" (
    "id" UUID NOT NULL,
    "sectionId" UUID,
    "contentItemId" UUID,
    "type" "QuestionGroupType" NOT NULL,
    "part" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "stimulus" JSONB NOT NULL DEFAULT '{}',
    "transcript" TEXT,
    "audioAssetId" UUID,
    "audioStartSec" INTEGER,
    "audioEndSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionGroupMedia" (
    "groupId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "role" VARCHAR(32) NOT NULL DEFAULT 'photo',
    "caption" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "QuestionGroupMedia_pkey" PRIMARY KEY ("groupId","assetId")
);

-- CreateTable
CREATE TABLE "ScoreConversion" (
    "testId" UUID NOT NULL,
    "section" "ExamSectionKind" NOT NULL,
    "rawCorrect" INTEGER NOT NULL,
    "scaled" INTEGER NOT NULL,

    CONSTRAINT "ScoreConversion_pkey" PRIMARY KEY ("testId","section","rawCorrect")
);

-- CreateIndex
CREATE INDEX "MockTestSection_testId_kind_idx" ON "MockTestSection"("testId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "MockTestSection_testId_sortOrder_key" ON "MockTestSection"("testId", "sortOrder");

-- CreateIndex
CREATE INDEX "QuestionGroup_sectionId_sortOrder_idx" ON "QuestionGroup"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "QuestionGroup_contentItemId_part_idx" ON "QuestionGroup"("contentItemId", "part");

-- CreateIndex
CREATE INDEX "QuestionGroupMedia_groupId_sortOrder_idx" ON "QuestionGroupMedia"("groupId", "sortOrder");

-- CreateIndex
CREATE INDEX "Question_groupId_numberInTest_idx" ON "Question"("groupId", "numberInTest");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "QuestionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockTestSection" ADD CONSTRAINT "MockTestSection_testId_fkey" FOREIGN KEY ("testId") REFERENCES "MockTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGroup" ADD CONSTRAINT "QuestionGroup_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "MockTestSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGroup" ADD CONSTRAINT "QuestionGroup_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGroup" ADD CONSTRAINT "QuestionGroup_audioAssetId_fkey" FOREIGN KEY ("audioAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGroupMedia" ADD CONSTRAINT "QuestionGroupMedia_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "QuestionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGroupMedia" ADD CONSTRAINT "QuestionGroupMedia_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreConversion" ADD CONSTRAINT "ScoreConversion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "MockTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockTestQuestion" ADD CONSTRAINT "MockTestQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "MockTestSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
