BEGIN;

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('TEXT_GENERATION', 'EMBEDDING');

-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('TEXT', 'IMAGE', 'EMBEDDING');

-- CreateEnum
CREATE TYPE "Capability" AS ENUM ('REASONING', 'TOOL_CALLING', 'STRUCTURED_OUTPUT', 'VISION', 'OPEN_WEIGHTS', 'MULTILINGUAL');

-- CreateEnum
CREATE TYPE "BillingUnit" AS ENUM ('PER_MILLION_TOKENS');

-- CreateEnum
CREATE TYPE "ScoreDirection" AS ENUM ('HIGHER_IS_BETTER', 'LOWER_IS_BETTER');

-- CreateTable
CREATE TABLE "Lab" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Model" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "labSlug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ModelType" NOT NULL,
    "inputModalities" "Modality"[],
    "outputModalities" "Modality"[],
    "capabilities" "Capability"[],
    "contextWindow" INTEGER,
    "maxOutputTokens" INTEGER,
    "releasedOn" DATE,
    "sourceUrl" TEXT,
    "retrievedOn" DATE,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("slug"),
    CONSTRAINT "model_positive_token_limits" CHECK (
        "contextWindow" > 0 AND "maxOutputTokens" > 0
    )
);

-- CreateTable
CREATE TABLE "Provider" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "ModelOffering" (
    "modelSlug" TEXT NOT NULL,
    "providerSlug" TEXT NOT NULL,
    "providerModelId" TEXT,
    "inputPrice" DECIMAL(12,6),
    "outputPrice" DECIMAL(12,6),
    "currency" CHAR(3) NOT NULL,
    "billingUnit" "BillingUnit" NOT NULL,
    "contextWindow" INTEGER,
    "sourceUrl" TEXT,
    "retrievedOn" DATE,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ModelOffering_pkey" PRIMARY KEY ("modelSlug","providerSlug"),
    CONSTRAINT "model_offering_nonnegative_price" CHECK (
        "inputPrice" >= 0 AND "inputPrice" <> 'NaN'::numeric
        AND "outputPrice" >= 0 AND "outputPrice" <> 'NaN'::numeric
    ),
    CONSTRAINT "model_offering_positive_context" CHECK ("contextWindow" > 0),
    CONSTRAINT "model_offering_currency_code" CHECK ("currency" ~ '^[A-Z]{3}$')
);

-- CreateTable
CREATE TABLE "Benchmark" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" "ModelType" NOT NULL,
    "direction" "ScoreDirection" NOT NULL,

    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "BenchmarkResult" (
    "modelSlug" TEXT NOT NULL,
    "benchmarkSlug" TEXT NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "measuredOn" DATE,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BenchmarkResult_pkey" PRIMARY KEY ("modelSlug","benchmarkSlug")
);

-- CreateIndex
CREATE INDEX "Model_labSlug_idx" ON "Model"("labSlug");

-- CreateIndex
CREATE INDEX "Model_type_idx" ON "Model"("type");

-- CreateIndex
CREATE INDEX "Model_releasedOn_idx" ON "Model"("releasedOn");

-- CreateIndex
CREATE INDEX "Model_capabilities_idx" ON "Model" USING GIN ("capabilities");

-- CreateIndex
CREATE INDEX "ModelOffering_providerSlug_idx" ON "ModelOffering"("providerSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Benchmark_name_version_key" ON "Benchmark"("name", "version");

-- CreateIndex
CREATE INDEX "BenchmarkResult_benchmarkSlug_isDemo_value_idx" ON "BenchmarkResult"("benchmarkSlug", "isDemo", "value");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_labSlug_fkey" FOREIGN KEY ("labSlug") REFERENCES "Lab"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelOffering" ADD CONSTRAINT "ModelOffering_modelSlug_fkey" FOREIGN KEY ("modelSlug") REFERENCES "Model"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelOffering" ADD CONSTRAINT "ModelOffering_providerSlug_fkey" FOREIGN KEY ("providerSlug") REFERENCES "Provider"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkResult" ADD CONSTRAINT "BenchmarkResult_modelSlug_fkey" FOREIGN KEY ("modelSlug") REFERENCES "Model"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkResult" ADD CONSTRAINT "BenchmarkResult_benchmarkSlug_fkey" FOREIGN KEY ("benchmarkSlug") REFERENCES "Benchmark"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
