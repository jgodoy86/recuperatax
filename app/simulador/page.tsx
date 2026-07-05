"use client";

import { useState } from "react";
import Link from "next/link";

type Result = {
  simulationId: string;
  eligibility: { verdict: string; summary: string; rules: { label: string; passed: boolean | null; detail: string }[] };
  ivaPaid: number;
  estimatedRefund: number;
  fees: number;
  netBenefit: number;
  estimatedMonths: { min: number; max: number };
  risks: string[];
  requiredDocuments: string[];
  recommendedPlan: string;
};

const fmt = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

export default function Simulador() {
  const [form, setForm] = useState({
    clientType: "NATURAL",
    vehicleType: "BEV",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: new Date().getFullYear(),
    purchaseValue: "",
    ivaPaid: "",
    hasInvoice: "si",
    ivaDiscriminated: "si",
    invoiceDate: "",
    ivaAlreadyUsed: "no",
    declaresIncome: "si",
    email: "",
  });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientType: form.clientType,
          vehicleType: form.vehicleType,
          vehicleBrand: form.vehicleBrand || undefined,
          vehicleModel: form.vehicleModel || undefined,
          vehicleYear: form.vehicleYear,
          purchaseValue: Number(form.purchaseValue),
          ivaPaid: Number(form.ivaPaid || 0),
          hasInvoice: form.hasInvoice === "si",
          ivaDiscriminated: form.ivaDiscriminated === "si",
          invoiceDate: form.invoiceDate || undefined,
          ivaAlreadyUsed: form.ivaAlreadyUsed === "si",
          declaresIncome: form.declaresIncome === "si",
          email: form.email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error en la simulación");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const v = result.eligibility.verdict;
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div
          className={`card border-2 ${v === "APTO" ? "border-emerald-400" : v === "REVISION" ? "border-amber-400" : "border-red-400"}`}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resultado del diagnóstico</p>
          <h1 className="mt-1 text-3xl font-black">
            {v === "APTO" ? "✅ ¡Aplicas al beneficio!" : v === "REVISION" ? "🔎 Requiere revisión" : "❌ No apto"}
          </h1>
          <p className="mt-2 text-slate-600">{result.eligibility.summary}</p>

          {v !== "NO_APTO" && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">IVA a recuperar</p>
                <p className="text-xl font-black text-emerald-600">{fmt(result.estimatedRefund)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Honorarios de éxito</p>
                <p className="text-xl font-black">{fmt(result.fees)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Beneficio neto</p>
                <p className="text-xl font-black text-emerald-700">{fmt(result.netBenefit)}</p>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="font-bold">Reglas evaluadas</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {result.eligibility.rules.map((r) => (
                  <li key={r.label}>
                    {r.passed === true ? "✅" : r.passed === false ? "❌" : "⚠️"} {r.label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-bold">Documentos que necesitas</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                {result.requiredDocuments.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-bold">Ten en cuenta</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
              {result.risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
              <li>
                Tiempo estimado del proceso: {result.estimatedMonths.min} a {result.estimatedMonths.max} meses.
              </li>
            </ul>
          </div>

          {v !== "NO_APTO" && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/registro?sim=${result.simulationId}`} className="btn-primary">
                Iniciar mi caso ({result.recommendedPlan}) →
              </Link>
              <button className="btn-secondary" onClick={() => setResult(null)}>
                Simular de nuevo
              </button>
            </div>
          )}
          {v === "NO_APTO" && (
            <button className="btn-secondary mt-8" onClick={() => setResult(null)}>
              ← Corregir datos
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-black">Simulador de recuperación de IVA</h1>
      <p className="mt-2 text-slate-600">
        Responde estas preguntas y te decimos si aplicas, cuánto recuperarías y qué documentos necesitas.
      </p>

      <form onSubmit={submit} className="card mt-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">¿Quién compra el vehículo?</label>
            <select className="input" value={form.clientType} onChange={(e) => set("clientType", e.target.value)}>
              <option value="NATURAL">Persona natural</option>
              <option value="EMPRESA">Empresa</option>
            </select>
          </div>
          <div>
            <label className="label">Tipo de vehículo</label>
            <select className="input" value={form.vehicleType} onChange={(e) => set("vehicleType", e.target.value)}>
              <option value="BEV">Eléctrico (BEV)</option>
              <option value="HEV">Híbrido (HEV)</option>
              <option value="PHEV">Híbrido enchufable (PHEV)</option>
              <option value="MHEV">Híbrido ligero (MHEV)</option>
              <option value="OTRO">Otro / no sé</option>
            </select>
          </div>
          <div>
            <label className="label">Marca</label>
            <input className="input" placeholder="BYD, Toyota, Kia…" value={form.vehicleBrand} onChange={(e) => set("vehicleBrand", e.target.value)} />
          </div>
          <div>
            <label className="label">Modelo / línea</label>
            <input className="input" placeholder="Song Plus, Corolla Cross…" value={form.vehicleModel} onChange={(e) => set("vehicleModel", e.target.value)} />
          </div>
          <div>
            <label className="label">Año del vehículo</label>
            <input className="input" type="number" value={form.vehicleYear} onChange={(e) => set("vehicleYear", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Valor de compra (COP)</label>
            <input className="input" type="number" required min={1} placeholder="180000000" value={form.purchaseValue} onChange={(e) => set("purchaseValue", e.target.value)} />
          </div>
          <div>
            <label className="label">IVA pagado (si lo conoces)</label>
            <input className="input" type="number" min={0} placeholder="Se estima si lo dejas vacío" value={form.ivaPaid} onChange={(e) => set("ivaPaid", e.target.value)} />
          </div>
          <div>
            <label className="label">Fecha de la factura</label>
            <input className="input" type="date" value={form.invoiceDate} onChange={(e) => set("invoiceDate", e.target.value)} />
          </div>
          <div>
            <label className="label">¿Ya tienes la factura?</label>
            <select className="input" value={form.hasInvoice} onChange={(e) => set("hasInvoice", e.target.value)}>
              <option value="si">Sí</option>
              <option value="no">No, estoy por comprar</option>
            </select>
          </div>
          <div>
            <label className="label">¿La factura discrimina el IVA?</label>
            <select className="input" value={form.ivaDiscriminated} onChange={(e) => set("ivaDiscriminated", e.target.value)}>
              <option value="si">Sí</option>
              <option value="no">No / no sé</option>
            </select>
          </div>
          <div>
            <label className="label">¿El IVA ya fue usado contablemente?</label>
            <select className="input" value={form.ivaAlreadyUsed} onChange={(e) => set("ivaAlreadyUsed", e.target.value)}>
              <option value="no">No</option>
              <option value="si">Sí (costo, deducción o descontable)</option>
            </select>
          </div>
          <div>
            <label className="label">¿Declaras renta?</label>
            <select className="input" value={form.declaresIncome} onChange={(e) => set("declaresIncome", e.target.value)}>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Correo (opcional, para enviarte el resultado)</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Calculando…" : "Calcular mi devolución →"}
        </button>
      </form>
    </div>
  );
}
