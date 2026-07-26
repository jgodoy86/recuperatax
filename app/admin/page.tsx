import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CASE_STATUS, DIAN_STATUS, UPME_STATUS, fmtCOP } from "@/lib/constants";
import { StatusBadge, VerdictBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function Backoffice({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const session = await getSession();
  if (!session || !["ADMIN", "GESTOR"].includes(session.role)) redirect("/login");
  const { f } = await searchParams;

  const filters: Record<string, object> = {
    todos: {},
    aptos: { eligibility: "APTO" },
    no_aptos: { eligibility: "NO_APTO" },
    por_radicar: { upmeStatus: { in: ["REVISION_INTERNA", "EXPEDIENTE_LISTO", "DOCS_PENDIENTES"] } },
    requeridos: { OR: [{ upmeStatus: "REQUERIDO" }, { dianStatus: "REQUERIMIENTO" }] },
    aprobados: { OR: [{ upmeStatus: "APROBADO" }, { dianStatus: "APROBADO" }, { dianStatus: "PAGADO" }] },
    rechazados: { OR: [{ upmeStatus: "NEGADO" }, { dianStatus: "RECHAZADO" }] },
  };
  const active = f && f in filters ? f : "todos";

  const [cases, pendingDocs, queuedBots, stats] = await Promise.all([
    db.case.findMany({
      where: filters[active],
      orderBy: { updatedAt: "desc" },
      include: { client: true, gestor: true, documents: true },
      take: 100,
    }),
    db.document.count({ where: { status: { in: ["REVISION_HUMANA", "EN_VALIDACION"] } } }),
    db.submission.count({ where: { status: { in: ["EN_COLA", "REINTENTO"] } } }),
    db.case.aggregate({ _sum: { estimatedRecovery: true }, _count: true }),
  ]);

  const tabs: [string, string][] = [
    ["todos", "Todos"],
    ["aptos", "Aptos"],
    ["por_radicar", "Por radicar"],
    ["requeridos", "Requeridos"],
    ["aprobados", "Aprobados"],
    ["rechazados", "Rechazados"],
    ["no_aptos", "No aptos"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">Backoffice — Bandeja de casos</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs font-semibold uppercase text-slate-500">Casos totales</p>
          <p className="text-2xl font-black">{stats._count}</p>
          <p className="text-sm text-slate-500">IVA en gestión: {fmtCOP(stats._sum.estimatedRecovery ?? 0)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold uppercase text-slate-500">Documentos por revisar</p>
          <p className="text-2xl font-black text-amber-600">{pendingDocs}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold uppercase text-slate-500">Radicaciones en cola (bot)</p>
          <p className="text-2xl font-black text-sky-600">{queuedBots}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map(([k, label]) => (
          <Link
            key={k}
            href={`/admin?f=${k}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${active === k ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="card mt-4 overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Caso</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">IVA</th>
              <th className="px-4 py-3">UPME</th>
              <th className="px-4 py-3">DIAN</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-brand-50/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/casos/${c.id}`} className="font-mono font-semibold text-brand-700">
                    {c.refCode}
                  </Link>
                  <div className="mt-0.5">
                    <VerdictBadge verdict={c.eligibility} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{c.client.companyName ?? c.client.name}</p>
                  <p className="text-xs text-slate-500">{c.gestor ? `Gestor: ${c.gestor.name}` : "Sin gestor"}</p>
                </td>
                <td className="px-4 py-3">
                  {c.vehicleBrand} {c.vehicleModel}
                  <p className="text-xs text-slate-500">{c.vehicleType} · {c.vehicleYear}</p>
                </td>
                <td className="px-4 py-3 font-semibold">{fmtCOP(c.ivaPaid)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.upmeStatus} label={UPME_STATUS[c.upmeStatus as keyof typeof UPME_STATUS] ?? c.upmeStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.dianStatus} label={DIAN_STATUS[c.dianStatus as keyof typeof DIAN_STATUS] ?? c.dianStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} label={CASE_STATUS[c.status as keyof typeof CASE_STATUS] ?? c.status} />
                </td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No hay casos en este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
