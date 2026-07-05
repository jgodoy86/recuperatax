import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CASE_STATUS, fmtCOP } from "@/lib/constants";
import { StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function PanelConcesionario() {
  const session = await getSession();
  if (!session) redirect("/login");
  const dealer = await db.dealer.findUnique({
    where: { userId: session.userId },
    include: { referrals: { include: { client: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!dealer) redirect("/concesionarios");

  const completed = dealer.referrals.filter((c) => c.dianStatus === "PAGADO");
  const commission = completed.reduce(
    (sum, c) => sum + (c.fees * dealer.commissionPct) / 100,
    0,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">{dealer.dealershipName}</h1>
      <p className="mt-1 text-slate-600">Panel de casos referidos</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs font-semibold uppercase text-slate-500">Código de referido</p>
          <p className="font-mono text-lg font-black">{dealer.id}</p>
          <p className="mt-1 text-xs text-slate-500">
            Comparte este código con tus clientes al crear su caso.
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold uppercase text-slate-500">Casos referidos</p>
          <p className="text-2xl font-black">{dealer.referrals.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Comisión estimada ({dealer.commissionPct} %)
          </p>
          <p className="text-2xl font-black text-emerald-700">{fmtCOP(commission)}</p>
        </div>
      </div>

      <div className="card mt-8 overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Caso</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">IVA</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dealer.referrals.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono">{c.refCode}</td>
                <td className="px-4 py-3">{c.client.name}</td>
                <td className="px-4 py-3">
                  {c.vehicleBrand} {c.vehicleModel}
                </td>
                <td className="px-4 py-3">{fmtCOP(c.ivaPaid)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} label={CASE_STATUS[c.status as keyof typeof CASE_STATUS] ?? c.status} />
                </td>
              </tr>
            ))}
            {dealer.referrals.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Aún no tienes casos referidos. Comparte tu código con tus clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
