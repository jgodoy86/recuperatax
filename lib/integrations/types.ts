// Capa de integración con entidades (UPME / DIAN).
// Hoy no existe API pública en ninguna de las dos, por lo que la plataforma
// soporta DOS canales intercambiables detrás de la misma interfaz:
//
//   - ApiChannel: listo para conectarse el día que la entidad publique API
//     (o para convenios/interoperabilidad). Configurable por variables de
//     entorno (URL + API key).
//   - BotChannel: automatización RPA (Playwright) que radica por los canales
//     web oficiales. Los trabajos entran a la cola `Submission` y un worker
//     los procesa; si el bot falla, el caso cae a gestión MANUAL con alerta.
//
// El canal activo se elige con UPME_CHANNEL / DIAN_CHANNEL = API | BOT | MANUAL.

export type Entity = "UPME" | "DIAN";
export type Channel = "API" | "BOT" | "MANUAL";

export type SubmissionPayload = {
  caseId: string;
  refCode: string;
  entity: Entity;
  expediente: Record<string, unknown>; // expediente serializado
  documents: { type: string; fileName: string; filePath: string }[];
};

export type SubmissionResult = {
  ok: boolean;
  radicado?: string;
  raw?: unknown;
  error?: string;
};

export type StatusResult = {
  status: string; // estado normalizado de la plataforma
  detail?: string;
  raw?: unknown;
};

export interface SubmissionChannel {
  readonly entity: Entity;
  readonly channel: Channel;
  /** Radica el expediente ante la entidad. */
  submit(payload: SubmissionPayload): Promise<SubmissionResult>;
  /** Consulta el estado de un radicado. */
  checkStatus(radicado: string): Promise<StatusResult>;
}
