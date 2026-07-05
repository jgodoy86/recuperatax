import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "RecuperaTax — Recupera el IVA de tu vehículo eléctrico o híbrido",
  description:
    "Validamos si aplicas en minutos. Gestionamos tu certificado UPME y la devolución de IVA ante la DIAN, 100 % digital.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-black tracking-tight text-emerald-700">
              Recupera<span className="text-slate-900">Tax</span>
            </Link>
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link href="/simulador" className="text-slate-600 hover:text-emerald-700">
                Simulador
              </Link>
              <Link href="/concesionarios" className="hidden text-slate-600 hover:text-emerald-700 sm:block">
                Concesionarios
              </Link>
              {session ? (
                <>
                  <Link
                    href={["ADMIN", "GESTOR"].includes(session.role) ? "/admin" : "/app"}
                    className="text-slate-600 hover:text-emerald-700"
                  >
                    {["ADMIN", "GESTOR"].includes(session.role) ? "Backoffice" : "Mis casos"}
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="text-slate-600 hover:text-emerald-700">
                    Ingresar
                  </Link>
                  <Link href="/registro" className="btn-primary !px-4 !py-2 text-sm">
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
          <p>
            RecuperaTax · Plataforma de recuperación de impuestos y beneficios tributarios ·
            Colombia
          </p>
          <p className="mt-1">
            No garantizamos el resultado de los trámites: gestionamos con diligencia profesional
            ante UPME y DIAN.
          </p>
        </footer>
      </body>
    </html>
  );
}
