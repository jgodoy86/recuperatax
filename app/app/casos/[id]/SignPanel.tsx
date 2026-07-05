"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SIGNATURES = {
  CONTRATO_SERVICIOS:
    "Acepto el contrato de prestación de servicios de RecuperaTax para la gestión del certificado UPME y la devolución de IVA, con honorarios de éxito según la propuesta del caso.",
  HABEAS_DATA:
    "Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012, con la finalidad exclusiva de gestionar mis trámites tributarios.",
  MANDATO:
    "Otorgo mandato a RecuperaTax para preparar, radicar y hacer seguimiento a mis trámites ante la UPME y la DIAN, incluyendo la respuesta a requerimientos.",
  VERACIDAD:
    "Declaro que la información y los documentos que aporto son veraces, completos y corresponden a la realidad de la operación de compra del vehículo.",
  NO_GARANTIA:
    "Entiendo y acepto que RecuperaTax gestiona con diligencia profesional pero no garantiza la aprobación del certificado ni de la devolución, decisiones que corresponden a las entidades.",
} as const;

export default function SignPanel({
  caseId,
  signedTypes,
}: {
  caseId: string;
  signedTypes: string[];
}) {
  const router = useRouter();
  const pending = Object.entries(SIGNATURES).filter(([k]) => !signedTypes.includes(k));
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [signerName, setSignerName] = useState("");
  const [signerDoc, setSignerDoc] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allChecked = pending.every(([k]) => checked[k]);

  async function sign() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/cases/${caseId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        types: pending.map(([k]) => k),
        signerName,
        signerDoc,
        accepted: true,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Error al firmar");
    router.refresh();
  }

  return (
    <div className="card mt-8 border-amber-300">
      <h2 className="text-xl font-bold">✍️ Firma digital de documentos</h2>
      <p className="mt-1 text-sm text-slate-600">
        Lee y acepta cada documento. La firma queda registrada con fecha, IP y huella digital (hash SHA-256).
      </p>
      <div className="mt-4 space-y-3">
        {pending.map(([key, text]) => (
          <label key={key} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={!!checked[key]}
              onChange={(e) => setChecked((c) => ({ ...c, [key]: e.target.checked }))}
            />
            <span>{text}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nombre completo del firmante</label>
          <input className="input" value={signerName} onChange={(e) => setSignerName(e.target.value)} />
        </div>
        <div>
          <label className="label">Documento de identidad</label>
          <input className="input" value={signerDoc} onChange={(e) => setSignerDoc(e.target.value)} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      <button
        className="btn-primary mt-4"
        disabled={!allChecked || signerName.length < 3 || signerDoc.length < 4 || loading}
        onClick={sign}
      >
        {loading ? "Firmando…" : "Firmar y continuar →"}
      </button>
    </div>
  );
}
