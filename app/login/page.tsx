"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Error al ingresar");
    router.push(["ADMIN", "GESTOR"].includes(data.role) ? "/admin" : "/app");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black">Ingresar</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4">
        <div>
          <label className="label">Correo</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Ingresando…" : "Ingresar →"}
        </button>
        <p className="text-center text-sm text-slate-500">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-emerald-700">
            Crear cuenta
          </Link>
        </p>
      </form>
    </div>
  );
}
