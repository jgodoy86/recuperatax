// Cargue masivo de flotas — un caso por vehículo a partir de un CSV.

import { db } from "./db";
import { FEE_MIN, FEE_PCT } from "./constants";
import { evaluateEligibility } from "./eligibility";

export const FLEET_COLUMNS = [
  "marca",
  "modelo",
  "anio",
  "tipo", // BEV | HEV | PHEV | MHEV
  "vin",
  "placa",
  "numero_factura",
  "fecha_factura", // AAAA-MM-DD
  "valor_compra",
  "iva_pagado",
  "iva_discriminado", // si | no
] as const;

export const FLEET_TEMPLATE =
  FLEET_COLUMNS.join(";") +
  "\nBYD;Song Plus DM-i;2026;PHEV;LC0C74C4XN1234567;ABC123;FE-1001;2026-05-10;180000000;28739496;si" +
  "\nToyota;Corolla Cross HEV;2026;HEV;;DEF456;FE-1002;2026-05-12;145000000;23151261;si\n";

export type FleetRow = {
  line: number;
  marca: string;
  modelo: string;
  anio: number;
  tipo: string;
  vin?: string;
  placa?: string;
  numero_factura?: string;
  fecha_factura?: Date;
  valor_compra: number;
  iva_pagado: number;
  iva_discriminado: boolean;
};

export type FleetRowResult = {
  line: number;
  ok: boolean;
  refCode?: string;
  verdict?: string;
  error?: string;
  vehicle: string;
};

/** Parser CSV simple con soporte de comillas y delimitador , o ; */
export function parseCsv(content: string): string[][] {
  const text = content.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const firstLine = text.slice(0, text.indexOf("\n"));
  const delim = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delim) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row.map((f) => f.trim()));
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row.map((f) => f.trim()));
  }
  return rows;
}

const parseMoney = (s: string) => Number(s.replace(/[$.\s]/g, "").replace(",", "."));
const parseBool = (s: string) => ["si", "sí", "true", "1", "x"].includes(s.toLowerCase());

export function parseFleetCsv(content: string): { rows: FleetRow[]; errors: FleetRowResult[] } {
  const raw = parseCsv(content);
  if (raw.length < 2) return { rows: [], errors: [{ line: 1, ok: false, error: "El archivo no tiene filas de datos.", vehicle: "" }] };

  const header = raw[0].map((h) => h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_"));
  const idx: Record<string, number> = {};
  for (const col of FLEET_COLUMNS) idx[col] = header.indexOf(col);
  const missing = ["marca", "modelo", "anio", "tipo", "valor_compra"].filter((c) => idx[c] === -1);
  if (missing.length > 0)
    return { rows: [], errors: [{ line: 1, ok: false, error: `Faltan columnas obligatorias: ${missing.join(", ")}. Usa la plantilla.`, vehicle: "" }] };

  const rows: FleetRow[] = [];
  const errors: FleetRowResult[] = [];
  const get = (r: string[], col: string) => (idx[col] >= 0 ? (r[idx[col]] ?? "") : "");

  raw.slice(1).forEach((r, i) => {
    const line = i + 2;
    const vehicle = `${get(r, "marca")} ${get(r, "modelo")}`.trim();
    const anio = Number(get(r, "anio"));
    const tipo = get(r, "tipo").toUpperCase();
    const valor = parseMoney(get(r, "valor_compra") || "0");
    const iva = parseMoney(get(r, "iva_pagado") || "0");
    const fechaStr = get(r, "fecha_factura");
    const fecha = fechaStr ? new Date(fechaStr) : undefined;

    if (!get(r, "marca") || !get(r, "modelo")) return errors.push({ line, ok: false, error: "Marca y modelo son obligatorios.", vehicle });
    if (!Number.isInteger(anio) || anio < 2015 || anio > 2035) return errors.push({ line, ok: false, error: `Año inválido: "${get(r, "anio")}".`, vehicle });
    if (!["BEV", "HEV", "PHEV", "MHEV"].includes(tipo)) return errors.push({ line, ok: false, error: `Tipo inválido: "${get(r, "tipo")}" (usa BEV, HEV, PHEV o MHEV).`, vehicle });
    if (!Number.isFinite(valor) || valor <= 0) return errors.push({ line, ok: false, error: `Valor de compra inválido: "${get(r, "valor_compra")}".`, vehicle });
    if (fecha && isNaN(fecha.getTime())) return errors.push({ line, ok: false, error: `Fecha inválida: "${fechaStr}" (usa AAAA-MM-DD).`, vehicle });

    rows.push({
      line,
      marca: get(r, "marca"),
      modelo: get(r, "modelo"),
      anio,
      tipo,
      vin: get(r, "vin") || undefined,
      placa: get(r, "placa") || undefined,
      numero_factura: get(r, "numero_factura") || undefined,
      fecha_factura: fecha,
      valor_compra: valor,
      iva_pagado: iva,
      iva_discriminado: parseBool(get(r, "iva_discriminado") || "no"),
    });
  });

  return { rows, errors };
}

/** Crea un caso por fila válida, con diagnóstico automático. */
export async function createFleetCases(
  clientId: string,
  rows: FleetRow[],
  actor: string,
): Promise<FleetRowResult[]> {
  const user = await db.user.findUniqueOrThrow({ where: { id: clientId } });
  const results: FleetRowResult[] = [];
  const year = new Date().getFullYear();
  let count = await db.case.count();

  for (const row of rows) {
    try {
      const eligibility = evaluateEligibility({
        clientType: user.clientType as "NATURAL" | "EMPRESA",
        vehicleType: row.tipo as "BEV" | "HEV" | "PHEV" | "MHEV",
        hasInvoice: !!row.numero_factura || !!row.fecha_factura,
        ivaDiscriminated: row.iva_discriminado,
        invoiceDate: row.fecha_factura,
        purchaseValue: row.valor_compra,
        ivaPaid: row.iva_pagado,
        ivaAlreadyUsed: false,
      });
      const recovery = eligibility.verdict === "NO_APTO" ? 0 : row.iva_pagado;
      const refCode = `RTX-${year}-${String(++count).padStart(4, "0")}`;

      const created = await db.case.create({
        data: {
          refCode,
          clientId,
          vehicleType: row.tipo,
          vehicleBrand: row.marca,
          vehicleModel: row.modelo,
          vehicleYear: row.anio,
          vin: row.vin,
          plate: row.placa,
          invoiceNumber: row.numero_factura,
          invoiceDate: row.fecha_factura,
          purchaseValue: row.valor_compra,
          ivaPaid: row.iva_pagado,
          ivaDiscriminated: row.iva_discriminado,
          estimatedRecovery: recovery,
          fees: recovery > 0 ? Math.max(Math.round(recovery * FEE_PCT), FEE_MIN) : 0,
          eligibility: eligibility.verdict,
          eligibilityDetail: JSON.stringify(eligibility),
          status: eligibility.verdict === "NO_APTO" ? "NO_APTO" : "FIRMA",
        },
      });
      await db.caseEvent.create({
        data: {
          caseId: created.id,
          type: "STATUS_CHANGE",
          actor,
          message: `Caso creado por cargue masivo de flota (fila ${row.line}). Diagnóstico: ${eligibility.verdict}.`,
        },
      });
      results.push({ line: row.line, ok: true, refCode, verdict: eligibility.verdict, vehicle: `${row.marca} ${row.modelo}` });
    } catch (err) {
      results.push({ line: row.line, ok: false, error: err instanceof Error ? err.message : "Error creando el caso", vehicle: `${row.marca} ${row.modelo}` });
    }
  }
  return results;
}

/** Matriz de beneficios (CSV) de todos los casos del cliente. */
export async function benefitsMatrixCsv(clientId: string): Promise<string> {
  const cases = await db.case.findMany({
    where: { clientId },
    orderBy: { refCode: "asc" },
    include: { documents: true, payments: true },
  });
  const header = [
    "caso", "marca", "modelo", "anio", "tipo", "placa", "vin",
    "factura", "fecha_factura", "valor_compra", "iva_pagado",
    "iva_a_recuperar", "honorarios", "beneficio_neto",
    "diagnostico", "estado", "estado_upme", "radicado_upme",
    "estado_dian", "radicado_dian", "documentos_aprobados", "honorarios_pagados",
  ].join(";");

  const lines = cases.map((c) =>
    [
      c.refCode, c.vehicleBrand, c.vehicleModel, c.vehicleYear, c.vehicleType,
      c.plate ?? "", c.vin ?? "", c.invoiceNumber ?? "",
      c.invoiceDate?.toISOString().slice(0, 10) ?? "",
      c.purchaseValue, c.ivaPaid, c.estimatedRecovery, c.fees,
      Math.max(c.estimatedRecovery - c.fees, 0),
      c.eligibility, c.status, c.upmeStatus, c.upmeRadicado ?? "",
      c.dianStatus, c.dianRadicado ?? "",
      `${c.documents.filter((d) => d.status === "APROBADO").length}/${c.documents.length}`,
      c.payments.some((p) => p.concept === "HONORARIOS" && p.status === "APROBADO") ? "si" : "no",
    ].join(";"),
  );
  return "﻿" + header + "\n" + lines.join("\n") + "\n";
}
