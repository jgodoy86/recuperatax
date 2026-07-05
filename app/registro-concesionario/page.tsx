"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegistroConcesionario() {
  const router = useRouter();
  const [form, setForm] = useState({
    dealershipName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
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
      body: JSON.stringify({ ...form, role: "DEALER", clientType: "EMPRESA" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Error al registrarse");
    router.push("/concesionarios/panel");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black">Registro de concesionario</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4">
        <div>
          <label className="label">Nombre del concesionario</label>
          <input className="input" required value={form.dealershipName} onChange={(e) => set("dealershipName", e.target.value)} />
        </div>
        <div>
          <label className="label">Nombre del contacto</label>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Correo</label>
          <input className="input" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="label">Celular</label>
          <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} />
        </div>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creando…" : "Crear cuenta de concesionario →"}
        </button>
      </form>
    </div>
  );
}
