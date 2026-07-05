"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DOC_OPTIONS: [string, string][] = [
  ["CEDULA", "Cédula de ciudadanía"],
  ["RUT", "RUT"],
  ["FACTURA_PDF", "Factura electrónica (PDF)"],
  ["FACTURA_XML", "Factura electrónica (XML)"],
  ["FICHA_TECNICA", "Ficha técnica del vehículo"],
  ["TARJETA_PROPIEDAD", "Tarjeta de propiedad"],
  ["SOPORTE_PAGO", "Soporte de pago"],
  ["CAMARA_COMERCIO", "Certificado cámara de comercio"],
  ["CERTIFICACION_CONTABLE", "Certificación contable"],
  ["PODER", "Poder / autorización"],
  ["OTRO", "Otro documento"],
];

export default function UploadPanel({
  caseId,
  clientType,
}: {
  caseId: string;
  clientType: string;
}) {
  const router = useRouter();
  const [type, setType] = useState("FACTURA_PDF");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "ok" | "error"; msg?: string }>({ kind: "idle" });

  const options =
    clientType === "EMPRESA"
      ? DOC_OPTIONS
      : DOC_OPTIONS.filter(([k]) => !["CAMARA_COMERCIO", "CERTIFICACION_CONTABLE"].includes(k));

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus({ kind: "loading" });
    const fd = new FormData();
    fd.set("file", file);
    fd.set("type", type);
    const res = await fetch(`/api/cases/${caseId}/documents`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      setStatus({ kind: "error", msg: data.error ?? "Error al subir" });
      return;
    }
    setStatus({
      kind: "ok",
      msg: `Validación automática: ${data.validation.verdict} — ${data.validation.reason}`,
    });
    setFile(null);
    router.refresh();
  }

  return (
    <div className="card mt-8">
      <h2 className="text-xl font-bold">📎 Cargar documento</h2>
      <p className="mt-1 text-sm text-slate-600">
        PDF, imagen o XML (máx. 15 MB). La IA valida el documento al instante y el gestor confirma la revisión.
      </p>
      <form onSubmit={upload} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {options.map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="file"
          className="input"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.xml"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button className="btn-primary" disabled={!file || status.kind === "loading"}>
          {status.kind === "loading" ? "Validando…" : "Subir"}
        </button>
      </form>
      {status.kind === "ok" && <p className="mt-3 text-sm font-semibold text-emerald-700">{status.msg}</p>}
      {status.kind === "error" && <p className="mt-3 text-sm font-semibold text-red-600">{status.msg}</p>}
    </div>
  );
}
