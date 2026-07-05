// Webhook de eventos de Wompi (transaction.updated).
// Verifica la firma (events secret) y aplica el resultado al pago y al caso.

import { NextRequest, NextResponse } from "next/server";
import { applyTransaction, verifyWompiEvent } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const event = await req.json().catch(() => null);
  if (!event) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  if (!verifyWompiEvent(event))
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });

  const tx = event?.data?.transaction;
  if (!tx?.reference || !tx?.status)
    return NextResponse.json({ error: "Evento sin transacción" }, { status: 400 });

  const result = await applyTransaction(tx);
  if (!result.ok) return NextResponse.json(result, { status: 404 });
  return NextResponse.json(result);
}
