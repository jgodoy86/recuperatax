import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/auth";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "RecuperaTax — Recupera el IVA de tu vehículo eléctrico o híbrido",
  description:
    "Validamos si aplicas en minutos. Gestionamos tu certificado UPME y la devolución de IVA ante la DIAN, 100 % digital y con seguimiento en vivo.",
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
        <Header session={session} />
        <main>{children}</main>

        <footer className="bg-brand-900 pt-14 pb-8 text-brand-100">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10 md:grid-cols-4">
              <div className="md:col-span-2">
                <p className="text-2xl font-black text-white">
                  Recupera<span className="text-accent-400">Tax</span>
                </p>
                <p className="mt-3 max-w-sm text-sm">
                  Plataforma digital de recuperación de impuestos y beneficios tributarios en
                  Colombia. Empezamos por la devolución de IVA para vehículos eléctricos e
                  híbridos: certificado UPME y devolución ante la DIAN.
                </p>
                <a
                  href="https://wa.me/573000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-accent-400"
                >
                  💬 +57 300 000 0000
                </a>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-white">Plataforma</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/simulador" className="hover:text-white">Simulador de IVA</Link></li>
                  <li><Link href="/registro" className="hover:text-white">Crear cuenta</Link></li>
                  <li><Link href="/login" className="hover:text-white">Ingresar</Link></li>
                  <li><Link href="/concesionarios" className="hover:text-white">Concesionarios</Link></li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-white">Servicios</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/#servicios" className="hover:text-white">Personas</Link></li>
                  <li><Link href="/#servicios" className="hover:text-white">Empresas y flotas</Link></li>
                  <li><Link href="/#proceso" className="hover:text-white">Cómo funciona</Link></li>
                  <li><Link href="/#faq" className="hover:text-white">Preguntas frecuentes</Link></li>
                </ul>
              </div>
            </div>

            <div className="mt-10 border-t border-white/10 pt-6 text-xs text-brand-200/80">
              <p>
                © {new Date().getFullYear()} RecuperaTax · Colombia. Tratamiento de datos personales
                conforme a la Ley 1581 de 2012.
              </p>
              <p className="mt-2">
                RecuperaTax gestiona los trámites con diligencia profesional pero no garantiza el
                resultado: la aprobación del certificado UPME y de la devolución de IVA es una
                decisión de las entidades competentes. Los valores mostrados en el simulador son
                estimaciones y no constituyen asesoría tributaria personalizada.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
