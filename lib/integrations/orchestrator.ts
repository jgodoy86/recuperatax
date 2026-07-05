// Orquestador de radicaciones — automatiza el pipeline completo:
// expediente listo → radicación (API o BOT) → seguimiento → transición de estado.

import { db } from "../db";
import { buildExpediente } from "../expediente";
import { notify } from "../notifications";
import { getChannel } from "./channels";
import { Entity } from "./types";

/** Encola y ejecuta la radicación de un caso ante UPME o DIAN. */
export async function submitCase(caseId: string, entity: Entity, actor: string) {
  const c = await db.case.findUniqueOrThrow({
    where: { id: caseId },
    include: { documents: true },
  });

  const expediente = await buildExpediente(caseId, entity);
  const channel = getChannel(entity);

  const submission = await db.submission.create({
    data: {
      caseId,
      entity,
      channel: channel.channel,
      status: channel.channel === "BOT" ? "EN_COLA" : "PROCESANDO",
      payload: JSON.stringify(expediente),
    },
  });

  let radicado: string | undefined;

  if (channel.channel === "API") {
    const result = await channel.submit({
      caseId,
      refCode: c.refCode,
      entity,
      expediente,
      documents: c.documents
        .filter((d) => d.status === "APROBADO")
        .map((d) => ({ type: d.type, fileName: d.fileName, filePath: d.filePath })),
    });
    await db.submission.update({
      where: { id: submission.id },
      data: {
        status: result.ok ? "RADICADO" : "ERROR",
        radicado: result.radicado,
        response: JSON.stringify(result.raw ?? null),
        lastError: result.error,
        attempts: 1,
        processedAt: new Date(),
      },
    });
    if (!result.ok) throw new Error(result.error ?? "Error radicando vía API");
    radicado = result.radicado;
  }
  // BOT: queda EN_COLA; el worker RPA (scripts/worker.ts) la procesa y
  // reporta el radicado vía /api/webhooks/submissions.
  // MANUAL: el gestor registra el radicado desde el backoffice.

  // Transición de estado del caso
  if (entity === "UPME") {
    await db.case.update({
      where: { id: caseId },
      data: {
        status: "UPME",
        upmeStatus: radicado ? "RADICADO" : "EXPEDIENTE_LISTO",
        upmeRadicado: radicado,
      },
    });
  } else {
    await db.case.update({
      where: { id: caseId },
      data: {
        status: "DIAN",
        dianStatus: radicado ? "RADICADO" : "EXPEDIENTE_LISTO",
        dianRadicado: radicado,
      },
    });
  }

  await db.caseEvent.create({
    data: {
      caseId,
      type: "SUBMISSION",
      actor,
      message: radicado
        ? `Radicado ante ${entity}: ${radicado}`
        : `Expediente ${entity} ${channel.channel === "BOT" ? "encolado para radicación automática (bot)" : "listo para radicación"}`,
      meta: JSON.stringify({ submissionId: submission.id, channel: channel.channel }),
    },
  });

  if (radicado) {
    await notify(c.clientId, "CASO_RADICADO", {
      refCode: c.refCode,
      entity,
      radicado,
    });
  }

  return { submissionId: submission.id, channel: channel.channel, radicado };
}

/** Aplica una actualización de estado reportada por la entidad (API, bot o gestor). */
export async function applyEntityUpdate(
  caseId: string,
  entity: Entity,
  newStatus: string,
  detail: string | undefined,
  actor: string,
  radicado?: string,
) {
  const c = await db.case.findUniqueOrThrow({ where: { id: caseId } });

  if (entity === "UPME") {
    await db.case.update({
      where: { id: caseId },
      data: {
        upmeStatus: newStatus,
        ...(radicado ? { upmeRadicado: radicado } : {}),
        ...(newStatus === "APROBADO" ? { dianStatus: "PENDIENTE" } : {}),
      },
    });
  } else {
    await db.case.update({
      where: { id: caseId },
      data: {
        dianStatus: newStatus,
        ...(radicado ? { dianRadicado: radicado } : {}),
        ...(newStatus === "PAGADO"
          ? { status: "FINALIZADO", refundPaidAt: new Date() }
          : {}),
      },
    });
  }

  await db.caseEvent.create({
    data: {
      caseId,
      type: "STATUS_CHANGE",
      actor,
      message: `${entity}: estado actualizado a ${newStatus}${detail ? ` — ${detail}` : ""}`,
    },
  });

  // Notificaciones automáticas según el evento
  const vars = { refCode: c.refCode, entity, radicado: radicado ?? "" };
  if (newStatus === "RADICADO") await notify(c.clientId, "CASO_RADICADO", vars);
  if (newStatus === "REQUERIDO" || newStatus === "REQUERIMIENTO")
    await notify(c.clientId, "REQUERIMIENTO", vars);
  if (entity === "UPME" && newStatus === "APROBADO")
    await notify(c.clientId, "CERTIFICADO_APROBADO", vars);
  if (entity === "DIAN" && newStatus === "APROBADO")
    await notify(c.clientId, "DEVOLUCION_APROBADA", vars);
  if (entity === "DIAN" && newStatus === "PAGADO")
    await notify(c.clientId, "PAGO_RECIBIDO", { ...vars, amount: "" });
}
