import { WebpayProvider } from "@/lib/providers";
import { prisma } from "@/lib/prisma";
import { enqueueRender } from "@/lib/jobs/producers";

export async function POST(req: Request) {
  const payloadText = await req.text();
  const signature = req.headers.get("tbk-signature") ?? undefined;
  const provider = new WebpayProvider();
  const valid = await provider.verifyWebhook(payloadText, signature);
  if (!valid) return new Response("invalid", { status: 400 });

  const payload = JSON.parse(payloadText) as {
    orderId: string;
    customizationId: string;
    canonicalAssetPath: string;
    canonicalHash: string;
    transactionRef?: string;
  };

  await prisma.order.update({ where: { id: payload.orderId }, data: { status: "PAID" } });

  if (payload.transactionRef) {
    await prisma.payment.updateMany({
      where: { orderId: payload.orderId },
      data: { status: "PAID", transactionRef: payload.transactionRef }
    });
  }

  await enqueueRender({
    orderId: payload.orderId,
    customizationId: payload.customizationId,
    canonicalAssetPath: payload.canonicalAssetPath,
    canonicalHash: payload.canonicalHash
  });

  return new Response("ok");
}
