// Webhook interno: el worker RPA (o una futura API de entidad) reporta
// resultados de radicación y cambios de estado.
// Autenticación por token compartido (header x-worker-token = AUTH_SECRET).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { applyEntityUpdate } from "@/lib/integrations/orchestrator";

const schema = z.object({
  submissionId: z.string().optional(),
  caseId: z.string(),
  entity: z.enum(["UPME", "DIAN"]),
  status: z.string(),
  radicado: z.string().optional(),
  detail: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-worker-token");
  if (!token || token !== process.env.AUTH_SECRET)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  const body = parsed.data;

  if (body.submissionId) {
    await db.submission
      .update({
        where: { id: body.submissionId },
        data: {
          status: body.radicado ? "RADICADO" : "PROCESANDO",
          radicado: body.radicado,
          processedAt: body.radicado ? new Date() : undefined,
        },
      })
      .catch(() => {});
  }

  await applyEntityUpdate(body.caseId, body.entity, body.status, body.detail, "bot", body.radicado);
  return NextResponse.json({ ok: true });
}
