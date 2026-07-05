import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkoutParams, wompiConfigured } from "@/lib/payments";

/** Devuelve el estado de pago de honorarios del caso y el link de checkout. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const c = await db.case.findUnique({ where: { id }, include: { payments: true } });
    if (!c) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    if (session.role === "CLIENT" && c.clientId !== session.userId)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const payment = c.payments.find((p) => p.concept === "HONORARIOS");
    if (!payment) return NextResponse.json({ payment: null });

    const checkout =
      payment.status === "PENDIENTE" || payment.status === "DECLINADO"
        ? checkoutParams(payment)
        : null;

    return NextResponse.json({
      payment: {
        reference: payment.reference,
        amountCOP: payment.amountCOP,
        status: payment.status,
        paidAt: payment.paidAt,
      },
      checkoutUrl: checkout?.checkoutUrl ?? null,
      providerConfigured: wompiConfigured(),
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
