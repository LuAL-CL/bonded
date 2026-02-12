import { generateProductionPack } from "@/lib/production-pack";
import path from "path";

export async function POST() {
  const out = path.join(process.cwd(), ".tmp-production-pack.zip");
  await generateProductionPack(out, []);
  return Response.json({ zip: out });
}
