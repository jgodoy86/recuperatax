"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Session = { name: string; role: string } | null;

const NAV = [
  ["Cómo funciona", "/#proceso"],
  ["Servicios", "/#servicios"],
  ["Simulador", "/simulador"],
  ["Concesionarios", "/concesionarios"],
  ["FAQ", "/#faq"],
] as const;

export default function Header({ session }: { session: Session }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isStaff = session ? ["ADMIN", "GESTOR"].includes(session.role) : false;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link href="/" className="text-xl font-black tracking-tight text-brand-700">
          Recupera<span className="text-slate-900">Tax</span>
        </Link>

        {/* Navegación escritorio */}
        <div className="hidden items-center gap-6 lg:flex">
          {NAV.map(([label, href]) => (
            <Link key={label} href={href} className="text-sm font-medium text-slate-600 transition hover:text-brand-700">
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {session ? (
            <>
              <Link
                href={isStaff ? "/admin" : "/app"}
                className="text-sm font-semibold text-slate-700 hover:text-brand-700"
              >
                {isStaff ? "Backoffice" : "Mis casos"}
              </Link>
              <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-brand-700">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-brand-700">
                Ingresar
              </Link>
              <Link href="/simulador" className="btn-primary !px-4 !py-2 text-sm">
                Validar si aplico
              </Link>
            </>
          )}
        </div>

        {/* Botón móvil */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 lg:hidden"
        >
          <span className="text-lg">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {/* Menú móvil */}
      {open && (
        <div className="animate-rise border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 font-medium text-slate-700 hover:bg-brand-50"
              >
                {label}
              </Link>
            ))}
            <hr className="my-2 border-slate-100" />
            {session ? (
              <>
                <Link
                  href={isStaff ? "/admin" : "/app"}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 font-semibold text-brand-700 hover:bg-brand-50"
                >
                  {isStaff ? "Backoffice" : "Mis casos"}
                </Link>
                <button onClick={logout} className="rounded-lg px-3 py-2.5 text-left font-medium text-slate-500">
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 font-semibold text-slate-700 hover:bg-brand-50"
                >
                  Ingresar
                </Link>
                <Link href="/simulador" onClick={() => setOpen(false)} className="btn-primary mt-1">
                  Validar si aplico →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
