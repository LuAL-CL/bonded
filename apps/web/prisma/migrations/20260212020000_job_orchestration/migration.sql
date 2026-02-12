-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('RENDER', 'DIGITIZE', 'PRODUCTION_PACK');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" TEXT NOT NULL,
    "queueJobId" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "orderId" TEXT NOT NULL,
    "customizationId" TEXT,
    "correlationId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "errorJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobExecution_orderId_jobType_idx" ON "JobExecution"("orderId", "jobType");

-- CreateIndex
CREATE INDEX "JobExecution_correlationId_idx" ON "JobExecution"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "JobExecution_queueJobId_jobType_key" ON "JobExecution"("queueJobId", "jobType");

-- AddForeignKey
ALTER TABLE "JobExecution" ADD CONSTRAINT "JobExecution_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobExecution" ADD CONSTRAINT "JobExecution_customizationId_fkey" FOREIGN KEY ("customizationId") REFERENCES "Customization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
