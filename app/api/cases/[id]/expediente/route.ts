import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildExpediente } from "@/lib/expediente";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const c = await db.case.findUnique({ where: { id } });
    if (!c) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    if (session.role === "CLIENT" && c.clientId !== session.userId)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const entity = req.nextUrl.searchParams.get("entity") === "DIAN" ? "DIAN" : "UPME";
    const expediente = await buildExpediente(id, entity);
    return NextResponse.json(expediente);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
