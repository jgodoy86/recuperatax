"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function patchCase(caseId: string, body: object) {
  const res = await fetch(`/api/admin/cases/${caseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error");
  return data;
}

export default function AdminActions({
  caseId,
  gestores,
  upmeStatuses,
  dianStatuses,
}: {
  caseId: string;
  gestores: { id: string; name: string }[];
  upmeStatuses: [string, string][];
  dianStatuses: [string, string][];
}) {
  const router = useRouter();
  const [entity, setEntity] = useState<"UPME" | "DIAN">("UPME");
  const [status, setStatus] = useState("");
  const [radicado, setRadicado] = useState("");
  const [gestorId, setGestorId] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const statuses = entity === "UPME" ? upmeStatuses : dianStatuses;

  async function run(body: object, ok: string) {
    setBusy(true);
    setMsg("");
    try {
      const data = await patchCase(caseId, body);
      setMsg(
        data.radicado
          ? `${ok} · Radicado: ${data.radicado}`
          : data.channel === "BOT"
            ? `${ok} · Encolado para radicación automática por bot`
            : ok,
      );
      router.refresh();
    } catch (err) {
      setMsg(`⚠ ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-bold">⚡ Radicar expediente</h2>
        <p className="mt-1 text-xs text-slate-500">
          Genera el expediente y lo radica por el canal configurado (API oficial si existe, bot RPA si no, o manual).
        </p>
        <div className="mt-3 flex gap-2">
          <button className="btn-primary flex-1 !py-2 text-sm" disabled={busy} onClick={() => run({ action: "submit", entity: "UPME" }, "Expediente UPME generado")}>
            Radicar UPME
          </button>
          <button className="btn-primary flex-1 !py-2 text-sm" disabled={busy} onClick={() => run({ action: "submit", entity: "DIAN" }, "Expediente DIAN generado")}>
            Radicar DIAN
          </button>
        </div>
        <div className="mt-2 flex gap-2 text-xs">
          <a href={`/api/cases/${caseId}/expediente?entity=UPME`} target="_blank" className="text-emerald-700 underline">
            Ver expediente UPME
          </a>
          <a href={`/api/cases/${caseId}/expediente?entity=DIAN`} target="_blank" className="text-emerald-700 underline">
            Ver expediente DIAN
          </a>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold">Actualizar estado</h2>
        <div className="mt-3 space-y-2">
          <select className="input" value={entity} onChange={(e) => { setEntity(e.target.value as "UPME" | "DIAN"); setStatus(""); }}>
            <option value="UPME">UPME</option>
            <option value="DIAN">DIAN</option>
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">— Selecciona estado —</option>
            {statuses.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <input className="input" placeholder="Nº de radicado (opcional)" value={radicado} onChange={(e) => setRadicado(e.target.value)} />
          <button
            className="btn-secondary w-full !py-2 text-sm"
            disabled={!status || busy}
            onClick={() => run({ action: "set_status", entity, status, radicado: radicado || undefined }, "Estado actualizado")}
          >
            Aplicar estado
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold">Asignar gestor</h2>
        <div className="mt-3 flex gap-2">
          <select className="input" value={gestorId} onChange={(e) => setGestorId(e.target.value)}>
            <option value="">— Gestor —</option>
            {gestores.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button className="btn-secondary !py-2 text-sm" disabled={!gestorId || busy} onClick={() => run({ action: "assign", gestorId }, "Gestor asignado")}>
            Asignar
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold">Nota interna</h2>
        <textarea className="input mt-3" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        <button
          className="btn-secondary mt-2 w-full !py-2 text-sm"
          disabled={!note || busy}
          onClick={() => run({ action: "note", message: note }, "Nota registrada").then(() => setNote(""))}
        >
          Guardar nota
        </button>
      </div>

      {msg && <p className="text-sm font-semibold text-emerald-700">{msg}</p>}
    </div>
  );
}

export function DocReviewButtons({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function review(status: string) {
    setBusy(true);
    const notes =
      status === "APROBADO" ? undefined : prompt("Motivo del rechazo / corrección:") ?? undefined;
    await fetch(`/api/admin/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <span className="flex gap-1">
      <button title="Aprobar" disabled={busy} className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-200" onClick={() => review("APROBADO")}>
        ✓
      </button>
      <button title="Requiere corrección" disabled={busy} className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-200" onClick={() => review("REQUIERE_CORRECCION")}>
        ✎
      </button>
      <button title="Rechazar" disabled={busy} className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-200" onClick={() => review("RECHAZADO")}>
        ✕
      </button>
    </span>
  );
}
