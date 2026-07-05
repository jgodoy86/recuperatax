import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { AuthError, requireSession } from "@/lib/auth";
import { submitCase, applyEntityUpdate } from "@/lib/integrations/orchestrator";
import { UPME_STATUS, DIAN_STATUS } from "@/lib/constants";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("assign"), gestorId: z.string() }),
  z.object({
    action: z.literal("set_status"),
    entity: z.enum(["UPME", "DIAN"]),
    status: z.string(),
    detail: z.string().optional(),
    radicado: z.string().optional(),
  }),
  z.object({ action: z.literal("submit"), entity: z.enum(["UPME", "DIAN"]) }),
  z.object({ action: z.literal("note"), message: z.string().min(1) }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["ADMIN", "GESTOR"]);
    const { id } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Acción inválida", detail: parsed.error.flatten() }, { status: 400 });
    const body = parsed.data;

    const c = await db.case.findUnique({ where: { id } });
    if (!c) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });

    switch (body.action) {
      case "assign": {
        await db.case.update({ where: { id }, data: { gestorId: body.gestorId } });
        await db.caseEvent.create({
          data: { caseId: id, type: "NOTE", actor: session.email, message: "Gestor asignado al caso." },
        });
        break;
      }
      case "set_status": {
        const valid =
          body.entity === "UPME" ? body.status in UPME_STATUS : body.status in DIAN_STATUS;
        if (!valid)
          return NextResponse.json({ error: `Estado ${body.status} inválido para ${body.entity}` }, { status: 400 });
        await applyEntityUpdate(id, body.entity, body.status, body.detail, session.email, body.radicado);
        break;
      }
      case "submit": {
        const result = await submitCase(id, body.entity, session.email);
        return NextResponse.json({ ok: true, ...result });
      }
      case "note": {
        await db.caseEvent.create({
          data: { caseId: id, type: "NOTE", actor: session.email, message: body.message },
        });
        break;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
