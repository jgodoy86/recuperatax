import Link from "next/link";

const steps = [
  ["Simula", "Responde unas preguntas y descubre en minutos si aplicas y cuánto podrías recuperar."],
  ["Regístrate y firma", "Creamos tu caso, firmas digitalmente el contrato, el mandato y las autorizaciones."],
  ["Carga tus documentos", "Sube factura, ficha técnica y soportes. Nuestra IA los valida al instante."],
  ["Gestionamos UPME", "Preparamos el expediente, radicamos ante la UPME y respondemos requerimientos."],
  ["Devolución DIAN", "Con el certificado UPME armamos el expediente DIAN y acompañamos hasta el pago."],
  ["Recibes tu dinero", "Seguimiento digital en cada paso, con alertas por WhatsApp y correo."],
] as const;

const faqs = [
  [
    "¿Qué vehículos aplican?",
    "Vehículos 100 % eléctricos (BEV), híbridos (HEV) e híbridos enchufables (PHEV). Los híbridos ligeros (MHEV) no califican para el beneficio.",
  ],
  [
    "¿Qué necesito para empezar?",
    "Tu cédula o RUT, la factura electrónica de compra con IVA discriminado, la ficha técnica del vehículo y el soporte de pago.",
  ],
  [
    "¿Cuánto se demora el trámite?",
    "Entre 4 y 8 meses en promedio: primero la certificación UPME y luego la devolución ante la DIAN. Puedes seguir cada etapa en tu tablero.",
  ],
  [
    "¿Cuánto cuesta?",
    "Trabajamos principalmente con honorarios de éxito: un porcentaje del valor efectivamente recuperado. El simulador te muestra el estimado antes de contratar.",
  ],
  [
    "¿Aplica para empresas y flotas?",
    "Sí. Tenemos gestión por vehículo con cargue masivo de facturas, matriz de beneficios y reportes para gerencia, contador y revisor fiscal.",
  ],
] as const;

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-50 to-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
              Vehículos eléctricos e híbridos · Colombia
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Recupera el <span className="text-emerald-600">IVA</span> de tu vehículo
              eléctrico o híbrido
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Validamos si aplicas en minutos. Gestionamos tu certificado UPME y la
              devolución ante la DIAN. Sin filas, sin enredos, con seguimiento digital.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/simulador" className="btn-primary text-base">
                Simular mi devolución →
              </Link>
              <a
                href="https://wa.me/573000000000?text=Hola,%20quiero%20recuperar%20el%20IVA%20de%20mi%20veh%C3%ADculo"
                target="_blank"
                className="btn-secondary text-base"
              >
                💬 Hablar por WhatsApp
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Diagnóstico gratuito · Honorarios de éxito · 100 % digital
            </p>
          </div>
          <div className="card border-emerald-200">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Ejemplo real
            </p>
            <p className="mt-2 text-slate-600">Camioneta híbrida enchufable de</p>
            <p className="text-3xl font-black">$180.000.000</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>IVA pagado (19 %)</span>
                <span className="font-bold">$28.739.496</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Honorarios de éxito (10 %)</span>
                <span>-$2.873.950</span>
              </div>
              <div className="flex justify-between pt-1 text-base">
                <span className="font-semibold">Beneficio neto estimado</span>
                <span className="font-black text-emerald-600">$25.865.546</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Valores ilustrativos. El simulador calcula tu caso exacto.
            </p>
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-black">¿Cómo funciona?</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map(([title, desc], i) => (
            <div key={title} className="card">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-black text-white">
                {i + 1}
              </div>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Servicios */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black">Nuestros servicios</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="card">
              <h3 className="text-lg font-bold">🚗 Personas</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>✓ Diagnóstico de elegibilidad gratuito</li>
                <li>✓ Certificado UPME de tu vehículo</li>
                <li>✓ Devolución de IVA ante la DIAN</li>
                <li>✓ Firma digital y carga de documentos en línea</li>
                <li>✓ Alertas por WhatsApp y correo</li>
              </ul>
            </div>
            <div className="card border-emerald-300">
              <h3 className="text-lg font-bold">🏢 Empresas y flotas</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>✓ Diagnóstico y expediente por vehículo</li>
                <li>✓ Cargue masivo de facturas</li>
                <li>✓ Matriz de beneficios tributarios</li>
                <li>✓ Tablero de estado por caso y alertas contables</li>
                <li>✓ Reportes para gerencia y revisor fiscal</li>
              </ul>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold">🤝 Concesionarios</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>✓ Simulador de beneficio en sala de venta</li>
                <li>✓ Portal para registrar clientes referidos</li>
                <li>✓ Comisión por cliente referido</li>
                <li>✓ Soporte posventa tributario sin cargas para tu equipo</li>
              </ul>
              <Link href="/concesionarios" className="mt-4 inline-block text-sm font-semibold text-emerald-700">
                Conocer el programa →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-3xl font-black">Preguntas frecuentes</h2>
        <div className="mt-8 space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="card !p-0">
              <summary className="cursor-pointer px-6 py-4 font-semibold">{q}</summary>
              <p className="px-6 pb-5 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-emerald-700 py-14 text-center text-white">
        <h2 className="text-3xl font-black">¿Compraste o vas a comprar un eléctrico o híbrido?</h2>
        <p className="mx-auto mt-2 max-w-xl text-emerald-100">
          Descubre en 2 minutos cuánto IVA puedes recuperar. El diagnóstico es gratuito.
        </p>
        <Link
          href="/simulador"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-bold text-emerald-700 hover:bg-emerald-50"
        >
          Simular ahora →
        </Link>
      </section>
    </div>
  );
}
