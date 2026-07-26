"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const IVA_RATE = 0.19;
const FEE_PCT = 0.1;
const FEE_MIN = 900_000;

const TYPES = [
  { key: "BEV", label: "100 % eléctrico", sub: "BEV", eligible: true },
  { key: "PHEV", label: "Híbrido enchufable", sub: "PHEV", eligible: true },
  { key: "HEV", label: "Híbrido", sub: "HEV", eligible: true },
  { key: "MHEV", label: "Híbrido ligero", sub: "MHEV", eligible: false },
] as const;

const fmt = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);

/** Calculadora en vivo: el usuario mueve el valor del vehículo y ve el IVA recuperable. */
export default function QuickCalculator() {
  const [value, setValue] = useState(180_000_000);
  const [type, setType] = useState<(typeof TYPES)[number]["key"]>("PHEV");

  const result = useMemo(() => {
    const eligible = TYPES.find((t) => t.key === type)!.eligible;
    const iva = Math.round((value / (1 + IVA_RATE)) * IVA_RATE);
    const refund = eligible ? iva : 0;
    const fees = refund > 0 ? Math.max(Math.round(refund * FEE_PCT), FEE_MIN) : 0;
    return { eligible, iva, refund, fees, net: Math.max(refund - fees, 0) };
  }, [value, type]);

  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-xl shadow-brand-600/10 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">Calcula tu devolución</h3>
        <span className="badge bg-brand-50 text-brand-700">En vivo</span>
      </div>

      <div className="mt-5">
        <label className="label">Tipo de vehículo</label>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                type === t.key
                  ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                  : "border-slate-200 hover:border-brand-300"
              }`}
            >
              <span className="block text-sm font-semibold text-slate-800">{t.label}</span>
              <span className="text-xs text-slate-500">{t.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <label className="label !mb-0">Valor del vehículo</label>
          <span className="text-lg font-black text-slate-900">{fmt(value)}</span>
        </div>
        <input
          type="range"
          min={50_000_000}
          max={500_000_000}
          step={5_000_000}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="mt-3 w-full accent-brand-600"
          aria-label="Valor del vehículo"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>$50M</span>
          <span>$500M</span>
        </div>
      </div>

      {result.eligible ? (
        <div className="mt-6 rounded-xl bg-brand-900 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
            IVA que podrías recuperar
          </p>
          <p className="mt-1 text-4xl font-black text-gold-400">{fmt(result.refund)}</p>
          <dl className="mt-4 space-y-1.5 border-t border-white/15 pt-3 text-sm">
            <div className="flex justify-between text-brand-100">
              <dt>Honorarios de éxito (10 %)</dt>
              <dd>−{fmt(result.fees)}</dd>
            </div>
            <div className="flex justify-between font-bold">
              <dt>Beneficio neto</dt>
              <dd>{fmt(result.net)}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-bold text-amber-900">Los MHEV no aplican</p>
          <p className="mt-1 text-sm text-amber-800">
            Los híbridos ligeros (mild hybrid) no califican al beneficio de IVA. Si no estás seguro
            de la tecnología de tu vehículo, valídalo con nosotros: revisamos la ficha técnica.
          </p>
        </div>
      )}

      <Link href="/simulador" className="btn-primary mt-5 w-full">
        Diagnóstico completo gratis →
      </Link>
      <p className="mt-2 text-center text-xs text-slate-400">
        Cálculo estimado sobre IVA del 19 %. El simulador valida tu caso real.
      </p>
    </div>
  );
}
