import { demoDisabledMessage, isDemoMode } from "@/lib/demo";
import { WebpayProvider } from "@/lib/providers";

export async function POST(req: Request) {
  if (isDemoMode()) {
    return Response.json({ disabled: true, message: demoDisabledMessage("Payment") }, { status: 503 });
  }

  const body = await req.json();
  const provider = new WebpayProvider();
  const tx = await provider.createTransaction(body.orderId, body.amountClp);
  return Response.json(tx);
}
