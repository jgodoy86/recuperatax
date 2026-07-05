"use client";

import { useEffect, useState } from "react";

const fmt = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

type PaymentInfo = {
  payment: { reference: string; amountCOP: number; status: string; paidAt: string | null } | null;
  checkoutUrl: string | null;
  providerConfigured: boolean;
};

export default function PaymentPanel({ caseId }: { caseId: string }) {
  const [info, setInfo] = useState<PaymentInfo | null>(null);

  useEffect(() => {
    fetch(`/api/cases/${caseId}/payment`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [caseId]);

  if (!info?.payment) return null;
  const p = info.payment;

  if (p.status === "APROBADO") {
    return (
      <div className="card mt-8 border-emerald-300 bg-emerald-50/50">
        <h2 className="text-xl font-bold">💳 Honorarios pagados</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pago de {fmt(p.amountCOP)} recibido
          {p.paidAt ? ` el ${new Date(p.paidAt).toLocaleDateString("es-CO")}` : ""}. Ref. {p.reference}.
        </p>
      </div>
    );
  }

  return (
    <div className="card mt-8 border-amber-300">
      <h2 className="text-xl font-bold">💳 Pago de honorarios pendiente</h2>
      <p className="mt-1 text-sm text-slate-600">
        Honorarios del servicio: <span className="font-bold">{fmt(p.amountCOP)}</span> · Ref. {p.reference}
        {p.status === "DECLINADO" && (
          <span className="ml-2 font-semibold text-red-600">El intento anterior fue declinado.</span>
        )}
      </p>
      {info.checkoutUrl ? (
        <a href={info.checkoutUrl} className="btn-primary mt-4 inline-flex">
          Pagar en línea (PSE, tarjeta, Nequi) →
        </a>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          El pago en línea estará disponible en breve. También puedes pagar por transferencia — escríbenos por
          WhatsApp indicando la referencia.
        </p>
      )}
    </div>
  );
}
