// Validación automática de documentos con IA (Claude API).
// Si no hay ANTHROPIC_API_KEY configurada, se aplica una validación heurística
// básica y el documento queda en REVISION_HUMANA.

import fs from "fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { DOCUMENT_TYPES, DocumentType } from "../constants";

const ValidationSchema = z.object({
  legible: z.boolean(),
  matches_type: z
    .boolean()
    .describe("El contenido corresponde al tipo de documento declarado"),
  buyer_name: z.string().nullable().describe("Nombre del comprador si aparece"),
  buyer_matches: z
    .boolean()
    .nullable()
    .describe("El comprador coincide con el nombre del cliente"),
  invoice_date: z.string().nullable().describe("Fecha de factura AAAA-MM-DD si aplica"),
  iva_discriminated: z
    .boolean()
    .nullable()
    .describe("La factura discrimina el IVA (solo facturas)"),
  iva_value: z.number().nullable().describe("Valor del IVA en COP si aparece"),
  vehicle_type_detected: z
    .enum(["BEV", "HEV", "PHEV", "MHEV", "DESCONOCIDO"])
    .nullable()
    .describe("Tipo de vehículo detectado en ficha técnica o factura"),
  issues: z.array(z.string()).describe("Inconsistencias o problemas detectados"),
  verdict: z.enum(["APROBADO", "RECHAZADO", "REQUIERE_CORRECCION", "REVISION_HUMANA"]),
  reason: z.string().describe("Explicación breve del veredicto en español"),
});

export type DocumentValidation = z.infer<typeof ValidationSchema> & {
  engine: "ia" | "heuristica";
};

type ValidateArgs = {
  filePath: string;
  mimeType: string;
  documentType: DocumentType;
  clientName: string;
  caseContext: {
    vehicleType: string;
    vehicleBrand: string;
    vehicleModel: string;
    ivaPaid: number;
  };
};

export async function validateDocument(
  args: ValidateArgs,
): Promise<DocumentValidation> {
  if (!process.env.ANTHROPIC_API_KEY) return heuristicValidation(args);
  try {
    return await aiValidation(args);
  } catch (err) {
    console.error("Validación IA falló, usando heurística:", err);
    return heuristicValidation(args);
  }
}

async function aiValidation(args: ValidateArgs): Promise<DocumentValidation> {
  const client = new Anthropic();
  const data = (await fs.readFile(args.filePath)).toString("base64");

  const isPdf = args.mimeType === "application/pdf";
  const isImage = args.mimeType.startsWith("image/");
  if (!isPdf && !isImage) {
    // XML u otros: revisión humana con chequeo básico
    return heuristicValidation(args);
  }

  const docBlock = isPdf
    ? {
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data,
        },
      }
    : {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: args.mimeType as "image/png" | "image/jpeg" | "image/webp",
          data,
        },
      };

  const prompt = `Eres el validador documental de una plataforma colombiana de recuperación de IVA para vehículos eléctricos e híbridos.

Documento declarado: ${DOCUMENT_TYPES[args.documentType]}
Cliente: ${args.clientName}
Vehículo del caso: ${args.caseContext.vehicleBrand} ${args.caseContext.vehicleModel} (tipo declarado ${args.caseContext.vehicleType})
IVA reportado por el cliente: ${args.caseContext.ivaPaid} COP

Valida:
1. Que el documento sea legible.
2. Que el contenido corresponda al tipo declarado.
3. Si es factura: que discrimine el IVA, la fecha, el valor del IVA y que el comprador coincida con el cliente.
4. Si es ficha técnica: el tipo de vehículo (BEV/HEV/PHEV/MHEV). Los MHEV NO califican.
5. Cualquier inconsistencia con los datos del caso.

Sé conservador: si tienes dudas, usa REVISION_HUMANA. Usa RECHAZADO solo si claramente no sirve (ilegible, tipo equivocado, MHEV, sin IVA discriminado en una factura).`;

  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [docBlock, { type: "text", text: prompt }],
      },
    ],
    output_config: { format: zodOutputFormat(ValidationSchema) },
  });

  if (!response.parsed_output) {
    return heuristicValidation(args);
  }
  return { ...response.parsed_output, engine: "ia" };
}

function heuristicValidation(args: ValidateArgs): DocumentValidation {
  const issues: string[] = [];
  const expectedMimes: Record<string, string[]> = {
    FACTURA_XML: ["text/xml", "application/xml"],
    FACTURA_PDF: ["application/pdf"],
  };
  const expected = expectedMimes[args.documentType];
  if (expected && !expected.includes(args.mimeType)) {
    issues.push(
      `El archivo (${args.mimeType}) no corresponde al formato esperado para ${DOCUMENT_TYPES[args.documentType]}.`,
    );
  }
  return {
    legible: true,
    matches_type: issues.length === 0,
    buyer_name: null,
    buyer_matches: null,
    invoice_date: null,
    iva_discriminated: null,
    iva_value: null,
    vehicle_type_detected: null,
    issues,
    verdict: issues.length > 0 ? "REQUIERE_CORRECCION" : "REVISION_HUMANA",
    reason:
      issues.length > 0
        ? issues.join(" ")
        : "Validación IA no disponible: el documento pasa a revisión humana del gestor.",
    engine: "heuristica",
  };
}
