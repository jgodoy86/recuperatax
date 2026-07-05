import Link from "next/link";

export default function Concesionarios() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <p className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
        Programa para concesionarios
      </p>
      <h1 className="text-4xl font-black leading-tight">
        Ayudamos a tus clientes a recuperar el IVA,{" "}
        <span className="text-emerald-600">sin cargas para tu equipo</span>
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Gestionamos los beneficios tributarios de los vehículos eléctricos e híbridos que
        vendes: certificado UPME y devolución de IVA ante la DIAN. Tú vendes, nosotros
        tramitamos, tu cliente recupera.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-bold">🧮 Simulador en sala de venta</h2>
          <p className="mt-2 text-sm text-slate-600">
            Muestra al cliente cuánto IVA puede recuperar antes de firmar. Un argumento de
            cierre que puede valer más de $25 millones.
          </p>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold">📋 Portal de referidos</h2>
          <p className="mt-2 text-sm text-slate-600">
            Registra a tus clientes en segundos y sigue el estado de cada caso referido desde
            tu panel.
          </p>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold">💰 Comisión por referido</h2>
          <p className="mt-2 text-sm text-slate-600">
            Recibes una comisión por cada cliente referido cuyo trámite se complete con éxito.
          </p>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold">🤝 Marca blanca / co-branding</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ofrece el servicio como parte de tu posventa, con tu marca o en conjunto con la
            nuestra.
          </p>
        </div>
      </div>

      <div className="card mt-10 border-emerald-300 bg-emerald-50/50 text-center">
        <h2 className="text-2xl font-black">Únete al programa</h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">
          Crea tu cuenta de concesionario y empieza a referir clientes hoy. Sin costos de
          vinculación.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/registro-concesionario" className="btn-primary">
            Registrar mi concesionario →
          </Link>
          <a
            href="https://wa.me/573000000000?text=Hola,%20soy%20concesionario%20y%20quiero%20conocer%20el%20programa"
            target="_blank"
            className="btn-secondary"
          >
            💬 Hablar con un asesor
          </a>
        </div>
      </div>
    </div>
  );
}
