import { prisma } from "@/lib/prisma";

export async function markJobRunning(queueJobId: string, jobType: "RENDER" | "DIGITIZE" | "PRODUCTION_PACK", attempts: number) {
  await prisma.jobExecution.updateMany({
    where: { queueJobId, jobType },
    data: { status: "RUNNING", attempts }
  });
}

export async function markJobSucceeded(queueJobId: string, jobType: "RENDER" | "DIGITIZE" | "PRODUCTION_PACK") {
  await prisma.jobExecution.updateMany({
    where: { queueJobId, jobType },
    data: { status: "SUCCEEDED" }
  });
}

export async function markJobFailed(queueJobId: string, jobType: "RENDER" | "DIGITIZE" | "PRODUCTION_PACK", error: unknown, attempts: number) {
  await prisma.jobExecution.updateMany({
    where: { queueJobId, jobType },
    data: {
      status: "FAILED",
      attempts,
      errorJson: { message: error instanceof Error ? error.message : String(error) }
    }
  });
}
