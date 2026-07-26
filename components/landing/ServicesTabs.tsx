"use client";

import { useState } from "react";
import Link from "next/link";

type Service = {
  key: string;
  tab: string;
  icon: string;
  title: string;
  pitch: string;
  bullets: string[];
  cta: { label: string; href: string };
};

const SERVICES: Service[] = [
  {
    key: "personas",
    tab: "Personas",
    icon: "🚗",
    title: "Compraste tu eléctrico o híbrido: recupera el IVA",
    pitch:
      "Gestionamos de principio a fin el certificado UPME y la devolución del IVA ante la DIAN. Tú solo cargas tus documentos una vez; nosotros hacemos el resto y te mantenemos informado.",
    bullets: [
      "Diagnóstico de elegibilidad gratuito y en minutos",
      "Firma digital del contrato y las autorizaciones, sin imprimir nada",
      "Validación automática de tu factura electrónica con IA",
      "Gestión del certificado UPME y radicación ante la DIAN",
      "Respuesta a requerimientos de las entidades incluida",
      "Alertas por WhatsApp y correo en cada avance",
    ],
    cta: { label: "Simular mi devolución", href: "/simulador" },
  },
  {
    key: "empresas",
    tab: "Empresas y flotas",
    icon: "🏢",
    title: "Electrificaste tu flota: ordena y reclama todo el beneficio",
    pitch:
      "Un expediente por vehículo, control documental centralizado y la matriz de beneficios que tu contador y revisor fiscal necesitan para cerrar el año sin sorpresas.",
    bullets: [
      "Cargue masivo de hasta 500 vehículos por archivo",
      "Diagnóstico automático de elegibilidad vehículo por vehículo",
      "Expediente UPME y expediente DIAN independientes por caso",
      "Tablero de estado consolidado de toda la flota",
      "Matriz de beneficios tributarios exportable (Excel/CSV)",
      "Reportes para gerencia, contabilidad y revisoría fiscal",
    ],
    cta: { label: "Registrar mi empresa", href: "/registro" },
  },
  {
    key: "concesionarios",
    tab: "Concesionarios",
    icon: "🤝",
    title: "Cierra más ventas mostrando el beneficio tributario",
    pitch:
      "Ayudamos a tus clientes a gestionar los beneficios tributarios de sus vehículos eléctricos e híbridos, sin que tu equipo tenga que encargarse del trámite.",
    bullets: [
      "Simulador de beneficio para usar en sala de venta",
      "Portal para registrar clientes referidos en segundos",
      "Seguimiento del estado de cada caso referido",
      "Comisión por cada cliente referido con trámite exitoso",
      "Opción de marca blanca o co-branding",
      "Soporte posventa tributario para tus compradores",
    ],
    cta: { label: "Conocer el programa", href: "/concesionarios" },
  },
];

export default function ServicesTabs() {
  const [active, setActive] = useState(SERVICES[0].key);
  const service = SERVICES.find((s) => s.key === active)!;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Servicios por tipo de cliente"
        className="mx-auto flex max-w-xl gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
      >
        {SERVICES.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={active === s.key}
            onClick={() => setActive(s.key)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              active === s.key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="mr-1">{s.icon}</span>
            {s.tab}
          </button>
        ))}
      </div>

      <div key={service.key} className="card card-hover mt-6 animate-rise md:p-8">
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          <div>
            <h3 className="text-2xl font-black leading-snug">{service.title}</h3>
            <p className="mt-3 text-slate-600">{service.pitch}</p>
            <Link href={service.cta.href} className="btn-primary mt-6">
              {service.cta.label} →
            </Link>
          </div>
          <ul className="space-y-2.5">
            {service.bullets.map((b) => (
              <li key={b} className="flex gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-black text-brand-700">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
