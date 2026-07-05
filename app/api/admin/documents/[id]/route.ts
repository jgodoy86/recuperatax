import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { AuthError, requireSession } from "@/lib/auth";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { notify } from "@/lib/notifications";

const schema = z.object({
  status: z.enum(["APROBADO", "RECHAZADO", "REQUIERE_CORRECCION"]),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["ADMIN", "GESTOR"]);
    const { id } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    const doc = await db.document.findUnique({ where: { id }, include: { case: true } });
    if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

    await db.document.update({
      where: { id },
      data: { status: parsed.data.status, reviewNotes: parsed.data.notes, reviewedAt: new Date() },
    });

    const label = DOCUMENT_TYPES[doc.type as keyof typeof DOCUMENT_TYPES] ?? doc.type;
    await db.caseEvent.create({
      data: {
        caseId: doc.caseId,
        type: "DOC_REVIEWED",
        actor: session.email,
        message: `Revisión humana de ${label}: ${parsed.data.status}${parsed.data.notes ? ` — ${parsed.data.notes}` : ""}`,
      },
    });

    if (parsed.data.status !== "APROBADO") {
      await notify(doc.case.clientId, "DOC_RECHAZADO", {
        refCode: doc.case.refCode,
        docType: label,
        reason: parsed.data.notes ?? "Requiere corrección",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
