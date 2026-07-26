"use client";

import { useState } from "react";

const GROUPS = [
  {
    group: "Elegibilidad",
    items: [
      [
        "¿Qué vehículos aplican al beneficio?",
        "Vehículos 100 % eléctricos (BEV), híbridos (HEV) e híbridos enchufables (PHEV). Los híbridos ligeros o mild hybrid (MHEV) no califican, porque su sistema eléctrico no propulsa el vehículo. Si no sabes qué tecnología tiene el tuyo, sube la ficha técnica y la validamos.",
      ],
      [
        "¿Aplica si compré el vehículo el año pasado?",
        "Sí. Puedes solicitar la devolución mientras la factura esté dentro del plazo legal (trabajamos con un margen de hasta 2 años desde la fecha de la factura). Si tu caso está cerca del límite, priorizamos la radicación.",
      ],
      [
        "¿Y si todavía no he comprado?",
        "Puedes simular el beneficio antes de comprar y llevarle a tu concesionario la lista de requisitos: lo más importante es que la factura electrónica discrimine el IVA y que quede a nombre de quien va a solicitar la devolución.",
      ],
      [
        "Compré el vehículo a nombre de mi empresa, ¿aplica?",
        "Sí, siempre que el IVA no haya sido tratado contablemente como costo, deducción o impuesto descontable. Si ya se usó por esa vía, no es recuperable por esta ruta y te lo advertimos en el diagnóstico antes de cobrarte nada.",
      ],
    ],
  },
  {
    group: "Proceso y tiempos",
    items: [
      [
        "¿Cuánto se demora todo el trámite?",
        "Entre 4 y 8 meses en promedio: primero la certificación ante la UPME (1 a 3 meses) y después la devolución ante la DIAN (2 a 5 meses). Los tiempos dependen de las entidades y de si hacen requerimientos; puedes seguir cada etapa en tu tablero.",
      ],
      [
        "¿Qué documentos necesito?",
        "Cédula o RUT, factura electrónica de compra con IVA discriminado (PDF y preferiblemente el XML), ficha técnica del vehículo y soporte de pago. Si eres empresa, además cámara de comercio y certificación contable. La plataforma te dice exactamente qué falta en cada momento.",
      ],
      [
        "¿Tengo que ir a alguna oficina o hacer filas?",
        "No. Todo el proceso es digital: firmas, carga de documentos y seguimiento. Nosotros radicamos ante las entidades por los canales oficiales.",
      ],
      [
        "¿Qué pasa si la UPME o la DIAN piden algo más?",
        "Nos encargamos nosotros. Preparamos la respuesta al requerimiento, la radicamos dentro del plazo y te notificamos. Está incluido en el servicio.",
      ],
    ],
  },
  {
    group: "Costos y garantías",
    items: [
      [
        "¿Cuánto cuesta el servicio?",
        "El diagnóstico es gratuito. Trabajamos principalmente con honorarios de éxito: un porcentaje del valor efectivamente recuperado (10 %, con un mínimo). El simulador te muestra el estimado exacto antes de que contrates.",
      ],
      [
        "¿Me garantizan la devolución?",
        "No, y desconfía de quien te la garantice: la decisión final es de la UPME y la DIAN. Lo que garantizamos es gestión profesional, expediente completo y respuesta oportuna a los requerimientos — que es lo que hace que la mayoría de casos bien armados salgan bien.",
      ],
      [
        "¿Cómo protegen mis datos y documentos?",
        "Tus documentos se almacenan cifrados y solo los ve el gestor asignado a tu caso. Firmas una autorización de tratamiento de datos conforme a la Ley 1581 de 2012, con finalidad exclusiva de gestionar tu trámite.",
      ],
      [
        "¿Puedo hacer el trámite yo mismo?",
        "Claro que puedes. La diferencia está en el tiempo y en los errores: un expediente incompleto o un IVA mal discriminado se traduce en meses perdidos y a veces en un rechazo. Nosotros lo hacemos todos los días.",
      ],
    ],
  },
] as const;

export default function Faq() {
  const [openKey, setOpenKey] = useState<string>("0-0");

  return (
    <div className="space-y-8">
      {GROUPS.map((g, gi) => (
        <div key={g.group}>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-700">
            {g.group}
          </h3>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {g.items.map(([q, a], i) => {
              const key = `${gi}-${i}`;
              const open = openKey === key;
              return (
                <div key={q}>
                  <button
                    onClick={() => setOpenKey(open ? "" : key)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50"
                  >
                    <span className="font-semibold text-slate-800">{q}</span>
                    <span
                      className={`shrink-0 text-xl font-light text-brand-600 transition-transform ${open ? "rotate-45" : ""}`}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                  {open && (
                    <p className="animate-rise px-5 pb-5 text-sm leading-relaxed text-slate-600">
                      {a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
