"use client";

import { useState } from "react";
import Link from "next/link";

type UploadResult = {
  ok: boolean;
  total: number;
  creados: number;
  aptos: number;
  conError: number;
  results: { line: number; ok: boolean; refCode?: string; verdict?: string; error?: string; vehicle: string }[];
};

export default function Flota() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/fleet/upload", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error en el cargue");
      if (data.results) setResult({ ok: false, total: 0, creados: 0, aptos: 0, conError: data.results.length, results: data.results });
      return;
    }
    setResult(data);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">Cargue masivo de flota</h1>
      <p className="mt-2 text-slate-600">
        Sube un CSV con los vehículos de tu flota: creamos un caso por vehículo con diagnóstico automático de
        elegibilidad y te entregamos la matriz de beneficios tributarios.
      </p>

      <div className="card mt-6">
        <h2 className="font-bold">1. Descarga la plantilla</h2>
        <p className="mt-1 text-sm text-slate-600">
          Columnas: marca, modelo, año, tipo (BEV/HEV/PHEV/MHEV), VIN, placa, número y fecha de factura, valor de
          compra, IVA pagado, IVA discriminado (si/no). Hasta 500 vehículos por archivo.
        </p>
        <a href="/api/fleet/template" className="btn-secondary mt-3 inline-flex !py-2 text-sm">
          ⬇ Descargar plantilla CSV
        </a>
      </div>

      <form onSubmit={upload} className="card mt-4">
        <h2 className="font-bold">2. Sube el archivo</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <input type="file" accept=".csv,text/csv" className="input max-w-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button className="btn-primary" disabled={!file || loading}>
            {loading ? "Procesando…" : "Cargar flota →"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      </form>

      {result && (
        <div className="card mt-4">
          <h2 className="font-bold">Resultado del cargue</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4 text-center">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-2xl font-black">{result.total}</p>
              <p className="text-xs font-semibold uppercase text-slate-500">Filas</p>
            </div>
            <div className="rounded-lg bg-brand-50 p-3">
              <p className="text-2xl font-black text-brand-700">{result.creados}</p>
              <p className="text-xs font-semibold uppercase text-slate-500">Casos creados</p>
            </div>
            <div className="rounded-lg bg-brand-50 p-3">
              <p className="text-2xl font-black text-brand-700">{result.aptos}</p>
              <p className="text-xs font-semibold uppercase text-slate-500">Aptos</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-2xl font-black text-red-600">{result.conError}</p>
              <p className="text-xs font-semibold uppercase text-slate-500">Con error</p>
            </div>
          </div>
          <div className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Vehículo</th>
                  <th className="px-3 py-2">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.results.map((r) => (
                  <tr key={r.line}>
                    <td className="px-3 py-2">{r.line}</td>
                    <td className="px-3 py-2">{r.vehicle || "—"}</td>
                    <td className="px-3 py-2">
                      {r.ok ? (
                        <span className="text-brand-700">
                          ✓ {r.refCode} · {r.verdict}
                        </span>
                      ) : (
                        <span className="text-red-600">✗ {r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/api/fleet/matrix" className="btn-secondary !py-2 text-sm">
              ⬇ Descargar matriz de beneficios
            </a>
            <Link href="/app" className="btn-primary !py-2 text-sm">
              Ver mis casos →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
