import Link from "next/link";
import QuickCalculator from "@/components/landing/QuickCalculator";
import ServicesTabs from "@/components/landing/ServicesTabs";
import ProcessTimeline from "@/components/landing/ProcessTimeline";
import Faq from "@/components/landing/Faq";
import WhatsAppFab from "@/components/landing/WhatsAppFab";

const WA_URL =
  "https://wa.me/573000000000?text=Hola,%20quiero%20recuperar%20el%20IVA%20de%20mi%20veh%C3%ADculo%20el%C3%A9ctrico%20o%20h%C3%ADbrido";

const BRANDS = [
  "BYD", "Tesla", "Renault", "Kia", "Volvo", "Toyota", "Hyundai",
  "Mercedes-Benz", "BMW", "Volkswagen", "Chevrolet", "Zeekr", "Mazda", "Audi",
];

const DIFFERENTIATORS = [
  {
    icon: "🧠",
    title: "Motor de reglas, no criterio suelto",
    text: "Cada caso pasa por reglas auditables: tecnología del vehículo, IVA discriminado, plazo de la factura y tratamiento contable. Sabes por qué eres apto — o por qué no lo eres — antes de pagar.",
  },
  {
    icon: "🔍",
    title: "Leemos el XML de tu factura",
    text: "No confiamos en una foto del PDF: interpretamos la factura electrónica, verificamos el CUFE, el IVA exacto y el comprador contra tu caso. Menos errores, menos rechazos.",
  },
  {
    icon: "📂",
    title: "Expediente completo desde el día uno",
    text: "Generamos el expediente UPME y el paquete DIAN con memorial, relación de facturas y checklist contable. La mayoría de rechazos son por expedientes incompletos.",
  },
  {
    icon: "🔔",
    title: "Nunca te quedas sin saber",
    text: "Estado en vivo, próximo paso, número de radicado e historial de avances. Y una alerta por WhatsApp y correo cada vez que algo se mueve.",
  },
  {
    icon: "🛡️",
    title: "Blindaje legal para ambos",
    text: "Contrato, mandato, habeas data y declaración de veracidad firmados digitalmente con sello de tiempo y huella criptográfica. Tú tranquilo, nosotros también.",
  },
  {
    icon: "💸",
    title: "Cobramos cuando recuperas",
    text: "Diagnóstico gratis y honorarios de éxito. Si tu caso no es viable, te lo decimos de entrada en vez de venderte un trámite que no va a salir.",
  },
];

const COMPARISON = [
  ["Diagnóstico de elegibilidad", "Buscas normas y decides solo", "Motor de reglas + revisión de un gestor"],
  ["Armado del expediente", "Plantillas genéricas de internet", "Expediente UPME y DIAN generados por caso"],
  ["Validación de la factura", "Revisión visual del PDF", "Lectura del XML: CUFE, IVA y comprador"],
  ["Radicación", "Vas, esperas y vuelves", "Radicamos por canales oficiales"],
  ["Requerimientos de la entidad", "Te enteras tarde y respondes a la carrera", "Los atendemos nosotros dentro del plazo"],
  ["Seguimiento", "Llamadas y correos sin respuesta", "Tablero digital con estado y radicados"],
];

const STATS = [
  ["19 %", "del valor del vehículo es IVA recuperable"],
  ["2", "trámites en uno: certificado UPME + devolución DIAN"],
  ["4-8", "meses de proceso, con seguimiento en vivo"],
  ["0 $", "cuesta el diagnóstico de tu caso"],
];

export default function Landing() {
  return (
    <div>
      <WhatsAppFab />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-grid">
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="animate-rise">
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Vehículos eléctricos e híbridos · Colombia
            </span>

            <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Recupera el <span className="text-gradient">IVA</span> de tu vehículo eléctrico o
              híbrido
            </h1>

            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Validamos si aplicas en minutos, gestionamos tu certificado <strong>UPME</strong> y
              acompañamos tu devolución ante la <strong>DIAN</strong>. Sin filas, sin enredos, con
              seguimiento digital de principio a fin.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/simulador" className="btn-primary text-base">
                Validar si aplico — gratis →
              </Link>
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary text-base">
                💬 Hablar por WhatsApp
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
              <li className="flex items-center gap-2">
                <Check /> Diagnóstico gratuito
              </li>
              <li className="flex items-center gap-2">
                <Check /> Honorarios de éxito
              </li>
              <li className="flex items-center gap-2">
                <Check /> 100 % digital
              </li>
            </ul>
          </div>

          <div className="animate-rise">
            <QuickCalculator />
          </div>
        </div>

        {/* Marcas */}
        <div className="relative border-t border-slate-200/80 bg-white/60 py-5">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            Trabajamos con vehículos de todas las marcas
          </p>
          <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <div className="flex shrink-0 animate-marquee gap-10 pr-10">
              {[...BRANDS, ...BRANDS].map((b, i) => (
                <span key={`${b}-${i}`} className="whitespace-nowrap text-lg font-bold text-slate-300">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CIFRAS ═══ */}
      <section className="bg-deep py-12 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(([n, label]) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-black text-gold-400">{n}</p>
              <p className="mt-1 text-sm text-brand-100">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PROBLEMA / SOLUCIÓN ═══ */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">El problema</span>
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">
            El beneficio existe. El trámite es el problema.
          </h2>
          <p className="mt-4 text-slate-600">
            Miles de personas y empresas compran vehículos eléctricos e híbridos en Colombia sin
            reclamar el IVA al que tienen derecho — no porque no apliquen, sino porque el trámite
            involucra dos entidades, un expediente técnico y plazos que nadie quiere perseguir.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-4 font-bold text-slate-500">Etapa del trámite</th>
                <th className="px-5 py-4 font-bold text-slate-500">Haciéndolo por tu cuenta</th>
                <th className="bg-brand-50 px-5 py-4 font-bold text-brand-800">Con RecuperaTax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARISON.map(([stage, alone, withUs]) => (
                <tr key={stage}>
                  <td className="px-5 py-4 font-semibold text-slate-800">{stage}</td>
                  <td className="px-5 py-4 text-slate-500">{alone}</td>
                  <td className="bg-brand-50/60 px-5 py-4 font-medium text-slate-800">
                    <span className="mr-1.5 font-black text-brand-600">✓</span>
                    {withUs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ SERVICIOS (tabs) ═══ */}
      <section id="servicios" className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Servicios</span>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Un servicio para cada tipo de cliente
            </h2>
            <p className="mt-4 text-slate-600">
              Empezamos por la devolución de IVA de vehículos eléctricos e híbridos, con un
              acompañamiento distinto según si eres persona, empresa o concesionario.
            </p>
          </div>
          <div className="mt-10">
            <ServicesTabs />
          </div>
        </div>
      </section>

      {/* ═══ PROCESO (timeline interactivo) ═══ */}
      <section id="proceso" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Cómo funciona</span>
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">
            Seis pasos, y solo tres dependen de ti
          </h2>
          <p className="mt-4 text-slate-600">
            Haz clic en cada paso para ver qué pasa, quién lo hace y qué obtienes al final de esa
            etapa.
          </p>
        </div>
        <div className="mt-12">
          <ProcessTimeline />
        </div>
      </section>

      {/* ═══ DIFERENCIADORES ═══ */}
      <section className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Por qué con nosotros</span>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Tecnología tributaria, no solo tramitología
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.title} className="card card-hover">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-xl">
                  {d.icon}
                </div>
                <h3 className="mt-4 font-bold">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ QUÉ APLICA / QUÉ NO ═══ */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Elegibilidad</span>
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">¿Tu vehículo aplica?</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="card border-brand-200 bg-brand-50/40">
            <h3 className="flex items-center gap-2 text-lg font-bold text-brand-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm text-white">✓</span>
              Sí aplican
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Eléctricos (BEV)", "Solo batería, sin motor de combustión. Ej. BYD Dolphin, Tesla Model 3, Kia EV5."],
                ["Híbridos enchufables (PHEV)", "Batería recargable a la red + motor de combustión. Ej. BYD Song Plus DM-i."],
                ["Híbridos (HEV)", "El motor eléctrico propulsa el vehículo, se recarga con el propio sistema. Ej. Toyota Corolla Cross HEV."],
              ].map(([t, d]) => (
                <li key={t}>
                  <p className="font-semibold text-slate-800">{t}</p>
                  <p className="text-slate-600">{d}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="card border-amber-200 bg-amber-50/40">
            <h3 className="flex items-center gap-2 text-lg font-bold text-amber-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-sm text-white">!</span>
              No aplican o requieren revisión
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Híbridos ligeros (MHEV)", "El sistema eléctrico solo asiste al motor; no propulsa. No califican al beneficio."],
                ["Factura sin IVA discriminado", "Si la factura no separa el IVA, la DIAN puede rechazar la solicitud. Se puede corregir con el vendedor."],
                ["IVA ya usado contablemente", "Si se tomó como costo, deducción o impuesto descontable, no es recuperable por esta vía."],
              ].map(([t, d]) => (
                <li key={t}>
                  <p className="font-semibold text-slate-800">{t}</p>
                  <p className="text-slate-600">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link href="/simulador" className="btn-primary">
            Validar mi vehículo en el simulador →
          </Link>
        </div>
      </section>

      {/* ═══ CONCESIONARIOS ═══ */}
      <section className="bg-deep py-20 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <div>
            <span className="badge border border-white/25 bg-white/10 text-white">
              Programa para concesionarios
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              Cierra más ventas con un argumento de{" "}
              <span className="text-gold-400">$25 millones</span>
            </h2>
            <p className="mt-4 text-brand-100">
              Ayudamos a tus clientes a gestionar los beneficios tributarios de sus vehículos
              eléctricos e híbridos, sin que tu equipo tenga que encargarse del trámite. Tú vendes,
              nosotros tramitamos, tu cliente recupera.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/registro-concesionario"
                className="btn-primary !bg-white !bg-none !text-brand-700 !shadow-none hover:!brightness-100"
              >
                Registrar mi concesionario →
              </Link>
              <Link href="/concesionarios" className="btn-ghost-light">
                Ver el programa
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["🧮", "Simulador en sala de venta", "Muestra el beneficio antes de firmar."],
              ["📋", "Portal de referidos", "Registra clientes y sigue cada caso."],
              ["💰", "Comisión por referido", "Por cada trámite exitoso."],
              ["🏷️", "Marca blanca", "Con tu marca o en co-branding."],
            ].map(([icon, t, d]) => (
              <div key={t} className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
                <span className="text-2xl">{icon}</span>
                <h3 className="mt-2 font-bold">{t}</h3>
                <p className="mt-1 text-sm text-brand-100">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FUTURO ═══ */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Lo que viene</span>
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">
            Más allá del IVA de vehículos
          </h2>
          <p className="mt-4 text-slate-600">
            Somos una plataforma de recuperación de impuestos y beneficios tributarios. Empezamos
            por vehículos eléctricos e híbridos porque es donde el beneficio es más claro y menos
            reclamado — y seguimos por aquí:
          </p>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          {[
            "Devoluciones por pagos en exceso",
            "Pagos de lo no debido",
            "Saldos a favor en renta",
            "Saldos a favor en IVA",
            "Incentivos de energías renovables",
            "Beneficios tributarios sectoriales",
            "Auditoría de beneficios no reclamados",
            "Revisión de oportunidades tributarias",
          ].map((s) => (
            <span
              key={s}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">Todo lo que suelen preguntarnos</h2>
          </div>
          <div className="mt-10">
            <Faq />
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            ¿Tu pregunta no está aquí?{" "}
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">
              Escríbenos por WhatsApp
            </a>{" "}
            y te respondemos hoy.
          </p>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="relative overflow-hidden bg-brand-600 py-20 text-center text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_0%,rgb(255_255_255/0.18),transparent)]" />
        <div className="relative mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-black sm:text-4xl">
            Tu IVA no se reclama solo. Nosotros sí lo reclamamos.
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Dos minutos de simulador y sabrás exactamente cuánto puedes recuperar, qué documentos
            necesitas y cuánto cuesta. Sin compromiso.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/simulador"
              className="rounded-xl bg-white px-8 py-3.5 font-bold text-brand-700 shadow-lg transition hover:bg-brand-50"
            >
              Simular mi devolución →
            </Link>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost-light !px-8 !py-3.5">
              💬 Prefiero que me escriban
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Check() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 text-[10px] font-black text-brand-700">
      ✓
    </span>
  );
}
