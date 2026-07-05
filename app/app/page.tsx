import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CASE_STATUS, fmtCOP } from "@/lib/constants";
import { StatusBadge, VerdictBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function MisCasos() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cases = await db.case.findMany({
    where: { clientId: session.userId },
    orderBy: { updatedAt: "desc" },
  });

  const notifications = await db.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Mis casos</h1>
        <Link href="/app/nuevo-caso" className="btn-primary">
          + Nuevo caso
        </Link>
      </div>

      {cases.length === 0 ? (
        <div className="card mt-8 text-center">
          <p className="text-lg font-semibold">Aún no tienes casos</p>
          <p className="mt-1 text-slate-600">Crea tu primer caso para empezar a recuperar el IVA de tu vehículo.</p>
          <Link href="/app/nuevo-caso" className="btn-primary mt-4">
            Crear mi primer caso →
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {cases.map((c) => (
            <Link key={c.id} href={`/app/casos/${c.id}`} className="card block transition hover:border-emerald-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-slate-500">{c.refCode}</p>
                  <p className="text-lg font-bold">
                    {c.vehicleBrand} {c.vehicleModel} {c.vehicleYear}
                  </p>
                  <p className="text-sm text-slate-600">
                    IVA a recuperar: <span className="font-bold text-emerald-700">{fmtCOP(c.estimatedRecovery)}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={c.status} label={CASE_STATUS[c.status as keyof typeof CASE_STATUS] ?? c.status} />
                  <VerdictBadge verdict={c.eligibility} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold">Últimas notificaciones</h2>
          <div className="card mt-3 divide-y divide-slate-100 !p-0">
            {notifications.map((n) => (
              <div key={n.id} className="px-5 py-3 text-sm">
                <span className="font-semibold">{n.subject}</span>
                <span className="text-slate-500"> — {n.body}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
