import { prisma } from "@/lib/prisma";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { items: true, payment: true, shipment: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return Response.json({ orders });
}
