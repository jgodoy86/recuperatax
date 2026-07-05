import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  CASE_STATUS,
  DIAN_STATUS,
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  SIGNATURE_TYPES,
  UPME_STATUS,
  fmtCOP,
} from "@/lib/constants";
import { StatusBadge, VerdictBadge } from "@/components/badges";
import AdminActions, { DocReviewButtons } from "./AdminActions";

export const dynamic = "force-dynamic";

export default async function AdminCaso({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || !["ADMIN", "GESTOR"].includes(session.role)) redirect("/login");
  const { id } = await params;

  const c = await db.case.findUnique({
    where: { id },
    include: {
      client: true,
      gestor: true,
      documents: { orderBy: { uploadedAt: "desc" } },
      signatures: true,
      events: { orderBy: { createdAt: "desc" }, take: 50 },
      submissions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) notFound();

  const gestores = await db.user.findMany({ where: { role: { in: ["GESTOR", "ADMIN"] } } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="font-mono text-sm text-slate-500">{c.refCode}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">
          {c.vehicleBrand} {c.vehicleModel} {c.vehicleYear}
        </h1>
        <div className="flex gap-2">
          <StatusBadge status={c.status} label={CASE_STATUS[c.status as keyof typeof CASE_STATUS] ?? c.status} />
          <VerdictBadge verdict={c.eligibility} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Datos */}
          <div className="card">
            <h2 className="font-bold">Cliente y caso</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Cliente</dt>
              <dd className="font-semibold">{c.client.companyName ?? c.client.name}</dd>
              <dt className="text-slate-500">Identificación</dt>
              <dd>{c.client.documentId ?? "—"}</dd>
              <dt className="text-slate-500">Contacto</dt>
              <dd>{c.client.email} · {c.client.phone ?? "sin celular"}</dd>
              <dt className="text-slate-500">Tipo</dt>
              <dd>{c.client.clientType}</dd>
              <dt className="text-slate-500">Vehículo</dt>
              <dd>{c.vehicleType} · VIN {c.vin ?? "—"} · Placa {c.plate ?? "—"}</dd>
              <dt className="text-slate-500">Factura</dt>
              <dd>
                {c.invoiceNumber ?? "—"} · {c.invoiceDate?.toLocaleDateString("es-CO") ?? "sin fecha"} ·{" "}
                {c.ivaDiscriminated ? "IVA discriminado" : "IVA sin discriminar"}
              </dd>
              <dt className="text-slate-500">Valores</dt>
              <dd>
                Compra {fmtCOP(c.purchaseValue)} · IVA {fmtCOP(c.ivaPaid)} · Honorarios {fmtCOP(c.fees)}
              </dd>
              <dt className="text-slate-500">Firmas</dt>
              <dd>
                {c.signatures.length}/{Object.keys(SIGNATURE_TYPES).length} firmadas
              </dd>
            </dl>
          </div>

          {/* Documentos */}
          <div className="card !p-0">
            <h2 className="px-6 pt-5 font-bold">Documentos ({c.documents.length})</h2>
            <div className="mt-3 divide-y divide-slate-100">
              {c.documents.map((d) => {
                const ai = d.aiValidation ? JSON.parse(d.aiValidation) : null;
                return (
                  <div key={d.id} className="px-6 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          {DOCUMENT_TYPES[d.type as keyof typeof DOCUMENT_TYPES] ?? d.type}
                        </p>
                        <p className="text-xs text-slate-500">
                          {d.fileName} · {(d.sizeBytes / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={d.status} label={DOCUMENT_STATUS[d.status as keyof typeof DOCUMENT_STATUS] ?? d.status} />
                        <DocReviewButtons documentId={d.id} />
                      </div>
                    </div>
                    {ai && (
                      <p className="mt-1 text-xs text-slate-500">
                        🤖 {ai.engine === "ia" ? "IA" : "Sistema"}: {ai.reason}
                        {ai.issues?.length > 0 && ` · Problemas: ${ai.issues.join("; ")}`}
                      </p>
                    )}
                  </div>
                );
              })}
              {c.documents.length === 0 && (
                <p className="px-6 pb-5 text-sm text-slate-500">Sin documentos aún.</p>
              )}
            </div>
          </div>

          {/* Radicaciones */}
          <div className="card">
            <h2 className="font-bold">Radicaciones</h2>
            <div className="mt-3 space-y-2 text-sm">
              {c.submissions.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-4 py-2">
                  <span className="font-semibold">{s.entity}</span>
                  <span className="text-xs text-slate-500">Canal: {s.channel} · Intentos: {s.attempts}</span>
                  <StatusBadge status={s.status} label={s.status} />
                  {s.radicado && <span className="font-mono text-xs">Rad. {s.radicado}</span>}
                  {s.lastError && <p className="w-full text-xs text-red-600">{s.lastError}</p>}
                </div>
              ))}
              {c.submissions.length === 0 && <p className="text-slate-500">Sin radicaciones aún.</p>}
            </div>
          </div>

          {/* Historial */}
          <div className="card !p-0">
            <h2 className="px-6 pt-5 font-bold">Historial</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {c.events.map((e) => (
                <li key={e.id} className="px-6 py-2.5 text-sm">
                  <p>{e.message}</p>
                  <p className="text-xs text-slate-400">
                    {e.createdAt.toLocaleString("es-CO")} · {e.actor}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Panel de acciones */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-bold">Estados del trámite</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p>
                UPME:{" "}
                <StatusBadge status={c.upmeStatus} label={UPME_STATUS[c.upmeStatus as keyof typeof UPME_STATUS] ?? c.upmeStatus} />
                {c.upmeRadicado && <span className="ml-2 font-mono text-xs">Rad. {c.upmeRadicado}</span>}
              </p>
              <p>
                DIAN:{" "}
                <StatusBadge status={c.dianStatus} label={DIAN_STATUS[c.dianStatus as keyof typeof DIAN_STATUS] ?? c.dianStatus} />
                {c.dianRadicado && <span className="ml-2 font-mono text-xs">Rad. {c.dianRadicado}</span>}
              </p>
            </div>
          </div>
          <AdminActions
            caseId={c.id}
            gestores={gestores.map((g) => ({ id: g.id, name: g.name }))}
            upmeStatuses={Object.entries(UPME_STATUS)}
            dianStatuses={Object.entries(DIAN_STATUS)}
          />
        </div>
      </div>
    </div>
  );
}
