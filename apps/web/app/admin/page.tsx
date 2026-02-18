import { isDbDisabled, isDemoMode } from "@/lib/flags";
import { prisma } from "@/lib/prisma";

type AdminOrderRow = { id: string; status: string; totalClp: number };

export default async function AdminPage() {
  const dbDisabled = isDbDisabled();
  const orders: AdminOrderRow[] = dbDisabled
    ? [{ id: "demo-order-001", status: "ASSETS_GENERATED", totalClp: 29990 }]
    : await prisma.order.findMany({ take: 20, orderBy: { createdAt: "desc" }, select: { id: true, status: true, totalClp: true } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Backoffice</h1>
      {dbDisabled ? <p className="rounded bg-amber-100 p-2 text-sm">Admin DB disabled by feature flag: showing mock orders.</p> : null}
      {isDemoMode() ? <p className="rounded bg-amber-50 p-2 text-sm">Demo mode enabled.</p> : null}
      <table className="w-full rounded-lg bg-white p-3 text-sm">
        <thead><tr><th>ID</th><th>Status</th><th>Total</th></tr></thead>
        <tbody>
          {orders.map((o: AdminOrderRow) => (
            <tr key={o.id}><td>{o.id}</td><td>{o.status}</td><td>{o.totalClp}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
