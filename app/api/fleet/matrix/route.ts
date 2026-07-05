import { NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { benefitsMatrixCsv } from "@/lib/fleet";

/** Exporta la matriz de beneficios tributarios del cliente (CSV). */
export async function GET() {
  try {
    const session = await requireSession();
    const csv = await benefitsMatrixCsv(session.userId);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="matriz-beneficios-recuperatax.csv"',
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
