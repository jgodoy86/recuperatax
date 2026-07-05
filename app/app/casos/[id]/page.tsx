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
  requiredDocuments,
} from "@/lib/constants";
import { StatusBadge, VerdictBadge } from "@/components/badges";
import SignPanel from "./SignPanel";
import UploadPanel from "./UploadPanel";
import PaymentPanel from "./PaymentPanel";

export const dynamic = "force-dynamic";

export default async function CasoDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const c = await db.case.findUnique({
    where: { id },
    include: {
      client: true,
      documents: { orderBy: { uploadedAt: "desc" } },
      signatures: true,
      events: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!c) notFound();
  if (session.role === "CLIENT" && c.clientId !== session.userId) redirect("/app");

  const signedTypes = new Set(c.signatures.map((s) => s.type));
  const allSigned = Object.keys(SIGNATURE_TYPES).every((t) => signedTypes.has(t));
  const required = requiredDocuments(c.client.clientType);
  const uploadedTypes = new Set(c.documents.map((d) => d.type));
  const missing = required.filter((r) => !uploadedTypes.has(r));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
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

      {/* Resumen económico y estados */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs font-semibold uppercase text-slate-500">IVA a recuperar</p>
          <p className="text-xl font-black text-emerald-700">{fmtCOP(c.estimatedRecovery)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold uppercase text-slate-500">Honorarios estimados</p>
          <p className="text-xl font-black">{fmtCOP(c.fees)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold uppercase text-slate-500">Trámite UPME</p>
          <StatusBadge status={c.upmeStatus} label={UPME_STATUS[c.upmeStatus as keyof typeof UPME_STATUS] ?? c.upmeStatus} />
          {c.upmeRadicado && <p className="mt-1 font-mono text-xs text-slate-500">Rad. {c.upmeRadicado}</p>}
        </div>
        <div className="card">
          <p className="text-xs font-semibold uppercase text-slate-500">Devolución DIAN</p>
          <StatusBadge status={c.dianStatus} label={DIAN_STATUS[c.dianStatus as keyof typeof DIAN_STATUS] ?? c.dianStatus} />
          {c.dianRadicado && <p className="mt-1 font-mono text-xs text-slate-500">Rad. {c.dianRadicado}</p>}
        </div>
      </div>

      {/* Próximo paso */}
      <div className="card mt-6 border-emerald-200 bg-emerald-50/50">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">Próximo paso</p>
        <p className="mt-1 text-slate-700">
          {c.status === "NO_APTO"
            ? "Tu caso no es apto según el diagnóstico. Escríbenos por WhatsApp si crees que hay un error en los datos."
            : !allSigned
              ? "Firma digitalmente los documentos del servicio para poder gestionar tu trámite."
              : missing.length > 0
                ? `Carga los documentos pendientes: ${missing.map((m) => DOCUMENT_TYPES[m]).join(", ")}.`
                : c.upmeStatus === "APROBADO" && c.dianStatus === "PENDIENTE"
                  ? "¡Certificado UPME aprobado! Estamos preparando tu expediente DIAN."
                  : c.dianStatus === "PAGADO"
                    ? "🎉 Devolución pagada. Caso finalizado."
                    : "Tu equipo gestor está trabajando en el caso. Te notificaremos cada avance."}
        </p>
      </div>

      {/* Pago de honorarios (si el gestor generó el cobro) */}
      <PaymentPanel caseId={c.id} />

      {/* Firma digital */}
      {!allSigned && c.status !== "NO_APTO" && (
        <SignPanel caseId={c.id} signedTypes={[...signedTypes]} />
      )}

      {/* Documentos */}
      {allSigned && c.status !== "NO_APTO" && (
        <UploadPanel caseId={c.id} clientType={c.client.clientType} />
      )}

      {c.documents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold">Documentos cargados</h2>
          <div className="card mt-3 divide-y divide-slate-100 !p-0">
            {c.documents.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold">
                    {DOCUMENT_TYPES[d.type as keyof typeof DOCUMENT_TYPES] ?? d.type}
                  </p>
                  <p className="text-xs text-slate-500">{d.fileName}</p>
                </div>
                <StatusBadge status={d.status} label={DOCUMENT_STATUS[d.status as keyof typeof DOCUMENT_STATUS] ?? d.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="mt-8">
        <h2 className="text-xl font-bold">Historial del caso</h2>
        <div className="card mt-3 !p-0">
          <ul className="divide-y divide-slate-100">
            {c.events.map((e) => (
              <li key={e.id} className="px-5 py-3 text-sm">
                <p>{e.message}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {e.createdAt.toLocaleString("es-CO")} · {e.actor}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
