import { WebpayProvider } from "@/lib/providers";

export async function POST(req: Request) {
  const body = await req.json();
  const provider = new WebpayProvider();
  const tx = await provider.createTransaction(body.orderId, body.amountClp);
  return Response.json(tx);
}
