import { isDemoMode } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (isDemoMode()) {
    return Response.json({
      orders: [
        {
          id: "demo-order-001",
          status: "ASSETS_GENERATED",
          totalClp: 29990,
          items: [{ id: "demo-item-1", qty: 1, priceClp: 29990 }],
          payment: { provider: "webpay", status: "DISABLED_DEMO" },
          shipment: null
        }
      ]
    });
  }

  const orders = await prisma.order.findMany({
    include: { items: true, payment: true, shipment: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return Response.json({ orders });
}
