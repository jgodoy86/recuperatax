"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";

function NuevoCasoForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    vehicleType: "BEV",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: new Date().getFullYear(),
    vin: "",
    plate: "",
    invoiceNumber: "",
    invoiceDate: "",
    purchaseValue: "",
    ivaPaid: "",
    ivaDiscriminated: "si",
    ivaAlreadyUsed: "no",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        invoiceDate: form.invoiceDate || undefined,
        invoiceNumber: form.invoiceNumber || undefined,
        vin: form.vin || undefined,
        plate: form.plate || undefined,
        purchaseValue: Number(form.purchaseValue),
        ivaPaid: Number(form.ivaPaid || 0),
        ivaDiscriminated: form.ivaDiscriminated === "si",
        ivaAlreadyUsed: form.ivaAlreadyUsed === "si",
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Error creando el caso");
    router.push(`/app/casos/${data.caseId}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black">Nuevo caso</h1>
      <p className="mt-2 text-slate-600">
        Registra los datos del vehículo y la factura. Con esto creamos tu caso y hacemos el diagnóstico de elegibilidad.
      </p>
      <form onSubmit={submit} className="card mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tipo de vehículo</label>
            <select className="input" value={form.vehicleType} onChange={(e) => set("vehicleType", e.target.value)}>
              <option value="BEV">Eléctrico (BEV)</option>
              <option value="HEV">Híbrido (HEV)</option>
              <option value="PHEV">Híbrido enchufable (PHEV)</option>
              <option value="MHEV">Híbrido ligero (MHEV)</option>
            </select>
          </div>
          <div>
            <label className="label">Año</label>
            <input className="input" type="number" required value={form.vehicleYear} onChange={(e) => set("vehicleYear", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Marca</label>
            <input className="input" required value={form.vehicleBrand} onChange={(e) => set("vehicleBrand", e.target.value)} />
          </div>
          <div>
            <label className="label">Modelo / línea</label>
            <input className="input" required value={form.vehicleModel} onChange={(e) => set("vehicleModel", e.target.value)} />
          </div>
          <div>
            <label className="label">VIN (opcional)</label>
            <input className="input" value={form.vin} onChange={(e) => set("vin", e.target.value)} />
          </div>
          <div>
            <label className="label">Placa (opcional)</label>
            <input className="input" value={form.plate} onChange={(e) => set("plate", e.target.value)} />
          </div>
          <div>
            <label className="label">Nº de factura</label>
            <input className="input" value={form.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} />
          </div>
          <div>
            <label className="label">Fecha de factura</label>
            <input className="input" type="date" value={form.invoiceDate} onChange={(e) => set("invoiceDate", e.target.value)} />
          </div>
          <div>
            <label className="label">Valor de compra (COP)</label>
            <input className="input" type="number" required min={1} value={form.purchaseValue} onChange={(e) => set("purchaseValue", e.target.value)} />
          </div>
          <div>
            <label className="label">IVA pagado (COP)</label>
            <input className="input" type="number" required min={0} value={form.ivaPaid} onChange={(e) => set("ivaPaid", e.target.value)} />
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
              <option value="si">Sí</option>
            </select>
          </div>
        </div>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creando caso…" : "Crear caso y ver diagnóstico →"}
        </button>
      </form>
    </div>
  );
}

export default function NuevoCaso() {
  return (
    <Suspense>
      <NuevoCasoForm />
    </Suspense>
  );
}
