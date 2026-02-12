import { isDemoMode } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const orders = isDemoMode()
    ? [{ id: "demo-order-001", status: "ASSETS_GENERATED", totalClp: 29990 }]
    : await prisma.order.findMany({ take: 20, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Backoffice</h1>
      {isDemoMode() ? <p className="rounded bg-amber-100 p-2 text-sm">Demo mode enabled: showing mock orders.</p> : null}
      <table className="w-full rounded-lg bg-white p-3 text-sm">
        <thead><tr><th>ID</th><th>Status</th><th>Total</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}><td>{o.id}</td><td>{o.status}</td><td>{o.totalClp}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
