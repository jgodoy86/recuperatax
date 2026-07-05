// Pagos de honorarios con Wompi (checkout web redirect).
// Docs: https://docs.wompi.co — el checkout requiere public key + firma de
// integridad SHA-256(referencia + monto_en_centavos + moneda + integrity_secret).
// Los eventos llegan al webhook /api/webhooks/wompi firmados con el events secret.

import crypto from "crypto";
import { db } from "./db";
import { notify } from "./notifications";

const WOMPI_CHECKOUT = "https://checkout.wompi.co/p/";

export function wompiConfigured() {
  return !!(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_INTEGRITY_SECRET);
}

/** Crea (o reutiliza) el cobro de honorarios pendiente de un caso. */
export async function createFeePayment(caseId: string, actor: string) {
  const c = await db.case.findUniqueOrThrow({ where: { id: caseId } });
  if (c.fees <= 0) throw new Error("El caso no tiene honorarios definidos.");

  const existing = await db.payment.findFirst({
    where: { caseId, concept: "HONORARIOS", status: { in: ["PENDIENTE", "APROBADO"] } },
  });
  if (existing) return existing;

  const reference = `${c.refCode}-HON-${Date.now().toString(36).toUpperCase()}`;
  const payment = await db.payment.create({
    data: { caseId, concept: "HONORARIOS", amountCOP: c.fees, reference },
  });

  await db.caseEvent.create({
    data: {
      caseId,
      type: "NOTE",
      actor,
      message: `Cobro de honorarios generado por ${fmt(c.fees)} (ref. ${reference}).`,
    },
  });
  await notify(c.clientId, "PAGO_HONORARIOS_SOLICITADO", {
    refCode: c.refCode,
    amount: fmt(c.fees),
  });
  return payment;
}

/** Parámetros del checkout web de Wompi para un pago pendiente. */
export function checkoutParams(payment: { reference: string; amountCOP: number }) {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!publicKey || !integritySecret) return null;

  const amountInCents = Math.round(payment.amountCOP * 100);
  const currency = "COP";
  const signature = crypto
    .createHash("sha256")
    .update(`${payment.reference}${amountInCents}${currency}${integritySecret}`)
    .digest("hex");

  const url = new URL(WOMPI_CHECKOUT);
  url.searchParams.set("public-key", publicKey);
  url.searchParams.set("currency", currency);
  url.searchParams.set("amount-in-cents", String(amountInCents));
  url.searchParams.set("reference", payment.reference);
  url.searchParams.set("signature:integrity", signature);
  if (process.env.WOMPI_REDIRECT_URL)
    url.searchParams.set("redirect-url", process.env.WOMPI_REDIRECT_URL);

  return { checkoutUrl: url.toString(), amountInCents, currency, signature };
}

/** Verifica la firma de un evento del webhook de Wompi. */
export function verifyWompiEvent(event: {
  timestamp?: number;
  signature?: { checksum?: string; properties?: string[] };
  data?: Record<string, unknown>;
}): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret || !event.signature?.checksum || !event.signature.properties) return false;

  // checksum = SHA256(valores de properties concatenados + timestamp + secret)
  const values = event.signature.properties
    .map((path) =>
      path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], event.data),
    )
    .join("");
  const expected = crypto
    .createHash("sha256")
    .update(`${values}${event.timestamp}${secret}`)
    .digest("hex");
  return expected === event.signature.checksum.toLowerCase();
}

/** Aplica el resultado de una transacción Wompi al pago y al caso. */
export async function applyTransaction(tx: {
  id: string;
  reference: string;
  status: string; // APPROVED | DECLINED | VOIDED | ERROR
  amount_in_cents?: number;
}) {
  const payment = await db.payment.findUnique({
    where: { reference: tx.reference },
    include: { case: true },
  });
  if (!payment) return { ok: false, error: "Referencia de pago desconocida" };

  const map: Record<string, string> = {
    APPROVED: "APROBADO",
    DECLINED: "DECLINADO",
    VOIDED: "ANULADO",
    ERROR: "ERROR",
  };
  const status = map[tx.status] ?? "ERROR";

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status,
      providerTxId: tx.id,
      ...(status === "APROBADO" ? { paidAt: new Date() } : {}),
    },
  });

  await db.caseEvent.create({
    data: {
      caseId: payment.caseId,
      type: "NOTE",
      actor: "wompi",
      message:
        status === "APROBADO"
          ? `✅ Pago de honorarios recibido por ${fmt(payment.amountCOP)} (tx ${tx.id}).`
          : `Pago de honorarios ${status.toLowerCase()} (tx ${tx.id}).`,
    },
  });

  if (status === "APROBADO") {
    await notify(payment.case.clientId, "PAGO_HONORARIOS_RECIBIDO", {
      refCode: payment.case.refCode,
      amount: fmt(payment.amountCOP),
    });
  }
  return { ok: true, status };
}

const fmt = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);
