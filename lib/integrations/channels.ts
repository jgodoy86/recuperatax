import {
  Channel,
  Entity,
  StatusResult,
  SubmissionChannel,
  SubmissionPayload,
  SubmissionResult,
} from "./types";

/**
 * Canal API — se activa cuando exista API/convenio con la entidad.
 * Contrato REST genérico: POST {base}/radicaciones, GET {base}/radicaciones/{id}.
 */
export class ApiChannel implements SubmissionChannel {
  readonly channel: Channel = "API";
  constructor(
    readonly entity: Entity,
    private baseUrl: string,
    private apiKey: string,
  ) {}

  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    const res = await fetch(`${this.baseUrl}/radicaciones`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referencia: payload.refCode,
        expediente: payload.expediente,
        documentos: payload.documents.map((d) => ({
          tipo: d.type,
          nombre: d.fileName,
        })),
      }),
    });
    if (!res.ok) return { ok: false, error: `API ${this.entity} respondió ${res.status}` };
    const data = (await res.json()) as { radicado?: string };
    return { ok: true, radicado: data.radicado, raw: data };
  }

  async checkStatus(radicado: string): Promise<StatusResult> {
    const res = await fetch(`${this.baseUrl}/radicaciones/${radicado}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) return { status: "ERROR", detail: `API respondió ${res.status}` };
    const data = (await res.json()) as { estado?: string };
    return { status: data.estado ?? "EN_REVISION", raw: data };
  }
}

/**
 * Canal BOT — RPA sobre los portales web oficiales (VUCE/ventanilla UPME,
 * MUISCA/servicios en línea DIAN). El bot corre como worker separado
 * (scripts/worker.ts) usando Playwright; este canal encola el trabajo y el
 * worker actualiza la Submission cuando termina.
 *
 * Aquí NO se ejecuta el navegador (esto corre dentro de Next.js): solo se
 * marca el trabajo como EN_COLA. El worker (proceso aparte) hace la
 * radicación real y escribe el radicado.
 */
export class BotChannel implements SubmissionChannel {
  readonly channel: Channel = "BOT";
  constructor(readonly entity: Entity) {}

  async submit(_payload: SubmissionPayload): Promise<SubmissionResult> {
    // El orquestador ya creó la Submission EN_COLA; el worker RPA la procesa.
    return { ok: true, radicado: undefined };
  }

  async checkStatus(_radicado: string): Promise<StatusResult> {
    // El worker RPA consulta el portal y reporta vía webhook interno.
    return { status: "EN_REVISION", detail: "Consulta programada al bot RPA" };
  }
}

/** Canal MANUAL — un gestor humano radica y registra el radicado a mano. */
export class ManualChannel implements SubmissionChannel {
  readonly channel: Channel = "MANUAL";
  constructor(readonly entity: Entity) {}
  async submit(): Promise<SubmissionResult> {
    return { ok: true };
  }
  async checkStatus(): Promise<StatusResult> {
    return { status: "EN_REVISION", detail: "Seguimiento manual por gestor" };
  }
}

export function getChannel(entity: Entity): SubmissionChannel {
  const mode = (
    entity === "UPME" ? process.env.UPME_CHANNEL : process.env.DIAN_CHANNEL
  )?.toUpperCase() as Channel | undefined;

  if (mode === "API") {
    const base =
      entity === "UPME" ? process.env.UPME_API_URL : process.env.DIAN_API_URL;
    const key =
      entity === "UPME" ? process.env.UPME_API_KEY : process.env.DIAN_API_KEY;
    if (base && key) return new ApiChannel(entity, base, key);
    console.warn(`${entity}: canal API sin credenciales, usando BOT.`);
  }
  if (mode === "MANUAL") return new ManualChannel(entity);
  return new BotChannel(entity);
}
