"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegistroForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    clientType: "NATURAL",
    documentId: "",
    companyName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Error al registrarse");
    const sim = params.get("sim");
    router.push(sim ? `/app/nuevo-caso?sim=${sim}` : "/app/nuevo-caso");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black">Crear cuenta</h1>
      <p className="mt-2 text-slate-600">Crea tu cuenta para iniciar tu caso de recuperación de IVA.</p>
      <form onSubmit={submit} className="card mt-6 space-y-4">
        <div>
          <label className="label">Tipo de cliente</label>
          <select className="input" value={form.clientType} onChange={(e) => set("clientType", e.target.value)}>
            <option value="NATURAL">Persona natural</option>
            <option value="EMPRESA">Empresa</option>
          </select>
        </div>
        {form.clientType === "EMPRESA" && (
          <div>
            <label className="label">Razón social</label>
            <input className="input" required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">{form.clientType === "EMPRESA" ? "Nombre del representante" : "Nombre completo"}</label>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label">{form.clientType === "EMPRESA" ? "NIT" : "Cédula"}</label>
          <input className="input" required value={form.documentId} onChange={(e) => set("documentId", e.target.value)} />
        </div>
        <div>
          <label className="label">Celular (WhatsApp)</label>
          <input className="input" placeholder="+57 300 000 0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Correo</label>
          <input className="input" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} />
        </div>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creando cuenta…" : "Crear cuenta →"}
        </button>
        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-emerald-700">
            Ingresar
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function Registro() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}
