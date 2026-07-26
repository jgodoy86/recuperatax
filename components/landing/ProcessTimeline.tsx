"use client";

import { useState } from "react";

const STEPS = [
  {
    n: 1,
    title: "Simulas tu beneficio",
    who: "Tú · 2 minutos",
    detail:
      "Respondes unas preguntas sobre tu vehículo y tu factura. El motor de reglas valida la tecnología (BEV, HEV o PHEV), el IVA discriminado, la fecha de la factura y el tratamiento contable, y te dice si eres apto, si requiere revisión o si no aplicas.",
    deliverable: "Diagnóstico con valor estimado a recuperar y lista de documentos",
  },
  {
    n: 2,
    title: "Creas tu cuenta y firmas",
    who: "Tú · 5 minutos",
    detail:
      "Abrimos tu caso con un código de referencia. Firmas digitalmente el contrato de servicios, la autorización de datos, el mandato para gestionar, la declaración de veracidad y la aceptación de que el resultado depende de las entidades. Cada firma queda sellada con fecha, IP y huella digital.",
    deliverable: "Caso abierto y documentos legales firmados",
  },
  {
    n: 3,
    title: "Cargas tus documentos",
    who: "Tú · 10 minutos",
    detail:
      "Subes cédula o RUT, factura electrónica (PDF y XML), ficha técnica y soporte de pago. La plataforma lee el XML de tu factura electrónica y verifica el CUFE, el IVA exacto, el comprador y las fechas contra los datos de tu caso.",
    deliverable: "Documentos validados automáticamente",
  },
  {
    n: 4,
    title: "Revisamos y armamos el expediente",
    who: "Nuestro equipo · 2 a 5 días",
    detail:
      "Un gestor revisa cada documento aprobado por la validación automática, valida técnicamente el vehículo y genera el expediente UPME: resumen del caso, formulario base, carpeta documental, listado de soportes y observaciones técnicas.",
    deliverable: "Expediente UPME listo para radicar",
  },
  {
    n: 5,
    title: "Radicamos ante la UPME",
    who: "Nuestro equipo · 1 a 3 meses",
    detail:
      "Radicamos por los canales oficiales y hacemos seguimiento en cada etapa: revisión de completitud, requerimientos, subsanación y evaluación. Si la entidad pide algo, respondemos nosotros y te avisamos.",
    deliverable: "Certificado UPME de tu vehículo",
  },
  {
    n: 6,
    title: "Gestionamos la devolución ante la DIAN",
    who: "Nuestro equipo · 2 a 5 meses",
    detail:
      "Con el certificado en mano armamos el paquete DIAN: memorial de solicitud, relación de facturas, certificación contable, soportes de pago y evidencia del IVA. Radicamos, atendemos requerimientos y acompañamos hasta la respuesta final.",
    deliverable: "Devolución aprobada y pagada",
  },
];

export default function ProcessTimeline() {
  const [open, setOpen] = useState(1);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      {/* Selector de pasos */}
      <ol className="relative space-y-1 border-l-2 border-slate-200 pl-0">
        {STEPS.map((s) => {
          const active = open === s.n;
          return (
            <li key={s.n} className="relative">
              <button
                onClick={() => setOpen(s.n)}
                className={`flex w-full items-center gap-3 rounded-r-xl py-3 pl-5 pr-3 text-left transition ${
                  active ? "bg-brand-50" : "hover:bg-slate-50"
                }`}
              >
                <span
                  className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full text-xs font-black transition ${
                    active
                      ? "bg-brand-600 text-white ring-4 ring-brand-100"
                      : "bg-white text-slate-400 ring-2 ring-slate-200"
                  }`}
                >
                  {s.n}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-bold ${active ? "text-brand-800" : "text-slate-700"}`}
                  >
                    {s.title}
                  </span>
                  <span className="block text-xs text-slate-500">{s.who}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Detalle del paso */}
      {STEPS.filter((s) => s.n === open).map((s) => (
        <div key={s.n} className="card animate-rise self-start md:p-8">
          <span className="eyebrow">Paso {s.n} de 6</span>
          <h3 className="mt-4 text-2xl font-black">{s.title}</h3>
          <p className="mt-1 text-sm font-semibold text-brand-600">{s.who}</p>
          <p className="mt-4 text-slate-600">{s.detail}</p>
          <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
              Resultado de esta etapa
            </p>
            <p className="mt-1 font-semibold text-slate-800">{s.deliverable}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
