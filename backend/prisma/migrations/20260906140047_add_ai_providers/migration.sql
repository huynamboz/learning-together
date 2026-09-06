-- CreateEnum
CREATE TYPE "AiProviderHealth" AS ENUM ('UNKNOWN', 'HEALTHY', 'FAILING');

-- CreateTable
CREATE TABLE "AiProvider" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "baseUrl" VARCHAR(500) NOT NULL,
    "model" VARCHAR(180) NOT NULL,
    "apiKeyCipher" TEXT NOT NULL,
    "apiKeyLast4" VARCHAR(8) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "maxRetries" INTEGER NOT NULL DEFAULT 1,
    "extraHeaders" JSONB,
    "health" "AiProviderHealth" NOT NULL DEFAULT 'UNKNOWN',
    "lastCheckedAt" TIMESTAMP(3),
    "lastLatencyMs" INTEGER,
    "lastError" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiProvider_enabled_priority_idx" ON "AiProvider"("enabled", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "AiProvider_priority_key" ON "AiProvider"("priority");
