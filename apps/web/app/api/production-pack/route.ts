import { areJobsDisabled, featureDisabledMessage, isDemoMode } from "@/lib/flags";
import { generateProductionPack } from "@/lib/production-pack";
import path from "path";

export async function POST() {
  if (isDemoMode() || areJobsDisabled()) {
    return Response.json({ disabled: true, message: featureDisabledMessage("Production pack generation") }, { status: 503 });
  }

  const out = path.join(process.cwd(), ".tmp-production-pack.zip");
  await generateProductionPack(out, []);
  return Response.json({ zip: out });
}
