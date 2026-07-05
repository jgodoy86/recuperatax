// Worker RPA de radicaciones — procesa la cola `Submission` (canal BOT).
//
// Ejecutar con:  npm run worker
//
// Flujo por trabajo:
//   1. Toma la siguiente Submission EN_COLA (o REINTENTO).
//   2. Lanza el bot Playwright correspondiente (UPME o DIAN).
//   3. Si radica con éxito: guarda el radicado y actualiza el caso.
//   4. Si falla 3 veces: marca ERROR y deja el caso en gestión MANUAL con alerta.
//
// Los bots de portal (upmeBot / dianBot) contienen la estructura de
// automatización; los selectores/URLs definitivos se ajustan contra los
// portales reales (ventanilla UPME y servicios en línea DIAN) y las
// credenciales institucionales van en variables de entorno.

import { PrismaClient } from "@prisma/client";
import { applyEntityUpdate } from "../lib/integrations/orchestrator";

const db = new PrismaClient();
const MAX_ATTEMPTS = 3;
const POLL_MS = 15_000;

type BotResult = { ok: boolean; radicado?: string; error?: string };

async function upmeBot(payload: Record<string, unknown>): Promise<BotResult> {
  // Estructura del bot (Playwright). En producción:
  //   const { chromium } = await import("playwright");
  //   const browser = await chromium.launch();
  //   ... login con credenciales institucionales (env UPME_PORTAL_USER/PASS)
  //   ... diligenciar formulario de solicitud de certificación
  //   ... adjuntar documentos del expediente
  //   ... capturar número de radicado de la página de confirmación
  if (!process.env.UPME_PORTAL_USER) {
    return {
      ok: false,
      error:
        "Credenciales del portal UPME no configuradas (UPME_PORTAL_USER/UPME_PORTAL_PASS). El caso pasa a gestión manual.",
    };
  }
  void payload;
  return { ok: false, error: "Bot UPME pendiente de calibración de selectores." };
}

async function dianBot(payload: Record<string, unknown>): Promise<BotResult> {
  if (!process.env.DIAN_PORTAL_USER) {
    return {
      ok: false,
      error:
        "Credenciales DIAN no configuradas (DIAN_PORTAL_USER/DIAN_PORTAL_PASS). El caso pasa a gestión manual.",
    };
  }
  void payload;
  return { ok: false, error: "Bot DIAN pendiente de calibración de selectores." };
}

async function processOne(): Promise<boolean> {
  const job = await db.submission.findFirst({
    where: { channel: "BOT", status: { in: ["EN_COLA", "REINTENTO"] } },
    orderBy: { scheduledAt: "asc" },
  });
  if (!job) return false;

  await db.submission.update({
    where: { id: job.id },
    data: { status: "PROCESANDO", attempts: { increment: 1 } },
  });

  const payload = JSON.parse(job.payload ?? "{}");
  const bot = job.entity === "UPME" ? upmeBot : dianBot;
  const attempts = job.attempts + 1;

  try {
    const result = await bot(payload);
    if (result.ok && result.radicado) {
      await db.submission.update({
        where: { id: job.id },
        data: { status: "RADICADO", radicado: result.radicado, processedAt: new Date() },
      });
      await applyEntityUpdate(
        job.caseId,
        job.entity as "UPME" | "DIAN",
        "RADICADO",
        "Radicado automáticamente por bot",
        "bot",
        result.radicado,
      );
      console.log(`✔ ${job.entity} ${job.id} radicado: ${result.radicado}`);
    } else {
      throw new Error(result.error ?? "Bot no obtuvo radicado");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const exhausted = attempts >= MAX_ATTEMPTS;
    await db.submission.update({
      where: { id: job.id },
      data: {
        status: exhausted ? "ERROR" : "REINTENTO",
        lastError: message,
        ...(exhausted ? { processedAt: new Date() } : {}),
      },
    });
    if (exhausted) {
      await db.caseEvent.create({
        data: {
          caseId: job.caseId,
          type: "NOTE",
          actor: "bot",
          message: `⚠ Radicación automática ${job.entity} falló (${MAX_ATTEMPTS} intentos): ${message}. Requiere radicación manual del gestor.`,
        },
      });
      console.error(`✖ ${job.entity} ${job.id} agotó reintentos: ${message}`);
    } else {
      console.warn(`↻ ${job.entity} ${job.id} reintento ${attempts}: ${message}`);
    }
  }
  return true;
}

async function main() {
  console.log("Worker RPA iniciado — procesando cola de radicaciones…");
  for (;;) {
    try {
      const had = await processOne();
      if (!had) await new Promise((r) => setTimeout(r, POLL_MS));
    } catch (err) {
      console.error("Error en el loop del worker:", err);
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
}

main();
