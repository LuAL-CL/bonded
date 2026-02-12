import { demoDisabledMessage, isDemoMode } from "@/lib/demo";
import { generateProductionPack } from "@/lib/production-pack";
import path from "path";

export async function POST() {
  if (isDemoMode()) {
    return Response.json({ disabled: true, message: demoDisabledMessage("Production pack generation") }, { status: 503 });
  }

  const out = path.join(process.cwd(), ".tmp-production-pack.zip");
  await generateProductionPack(out, []);
  return Response.json({ zip: out });
}
