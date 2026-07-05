// Motor de reglas de elegibilidad — beneficio IVA vehículos eléctricos/híbridos
// Cada regla es pura y auditable; el resultado agrega el detalle completo.

import { INVOICE_MAX_AGE_DAYS } from "./constants";

export type EligibilityInput = {
  clientType: "NATURAL" | "EMPRESA";
  vehicleType: "BEV" | "HEV" | "PHEV" | "MHEV" | "OTRO";
  hasInvoice: boolean;
  ivaDiscriminated: boolean;
  invoiceDate?: Date | null;
  purchaseValue: number;
  ivaPaid: number;
  ivaAlreadyUsed: boolean; // IVA usado como costo/deducción/descontable
  declaresIncome?: boolean;
};

export type RuleResult = {
  rule: string;
  label: string;
  passed: boolean | null; // null = no se pudo evaluar (falta dato)
  detail: string;
};

export type EligibilityResult = {
  verdict: "APTO" | "REVISION" | "NO_APTO";
  rules: RuleResult[];
  summary: string;
};

export function evaluateEligibility(input: EligibilityInput): EligibilityResult {
  const rules: RuleResult[] = [];

  // 1. Tipo de vehículo
  const vehicleOk = ["BEV", "HEV", "PHEV"].includes(input.vehicleType);
  rules.push({
    rule: "vehicle_type",
    label: "Tipo de vehículo elegible",
    passed: vehicleOk,
    detail: vehicleOk
      ? `El vehículo ${input.vehicleType} califica para el beneficio.`
      : input.vehicleType === "MHEV"
        ? "Los híbridos ligeros (MHEV) NO califican para el beneficio de IVA."
        : "Solo califican vehículos BEV, HEV o PHEV.",
  });

  // 2. Factura
  rules.push({
    rule: "has_invoice",
    label: "Factura de compra",
    passed: input.hasInvoice ? true : null,
    detail: input.hasInvoice
      ? "Cuenta con factura de compra."
      : "Aún no tiene factura — puede iniciar el diagnóstico, pero es requisito para radicar.",
  });

  // 3. IVA discriminado
  rules.push({
    rule: "iva_discriminated",
    label: "IVA discriminado en factura",
    passed: input.hasInvoice ? input.ivaDiscriminated : null,
    detail: input.ivaDiscriminated
      ? "La factura discrimina el IVA."
      : "La factura debe discriminar el IVA para solicitar la devolución.",
  });

  // 4. Vigencia de la factura
  let dateOk: boolean | null = null;
  let dateDetail = "Sin fecha de factura — se validará al cargar el documento.";
  if (input.invoiceDate) {
    const age =
      (Date.now() - input.invoiceDate.getTime()) / (1000 * 60 * 60 * 24);
    dateOk = age <= INVOICE_MAX_AGE_DAYS && age >= 0;
    dateDetail = dateOk
      ? `Factura dentro del plazo (${Math.round(age)} días).`
      : age < 0
        ? "La fecha de factura es futura — requiere revisión."
        : `La factura supera el plazo máximo de ${INVOICE_MAX_AGE_DAYS} días.`;
  }
  rules.push({
    rule: "invoice_date",
    label: "Factura dentro del plazo",
    passed: dateOk,
    detail: dateDetail,
  });

  // 5. IVA no usado contablemente
  rules.push({
    rule: "iva_not_used",
    label: "IVA no usado como costo/deducción/descontable",
    passed: !input.ivaAlreadyUsed,
    detail: input.ivaAlreadyUsed
      ? "El IVA ya fue tratado contablemente como costo, deducción o descontable: no es recuperable por esta vía."
      : "El IVA no ha sido usado contablemente.",
  });

  // 6. Coherencia de valores
  const valuesOk =
    input.purchaseValue > 0 &&
    input.ivaPaid > 0 &&
    input.ivaPaid < input.purchaseValue;
  rules.push({
    rule: "values",
    label: "Valores de compra e IVA coherentes",
    passed: valuesOk,
    detail: valuesOk
      ? "Los valores reportados son coherentes."
      : "Verifique el valor de compra y el IVA pagado.",
  });

  const failed = rules.filter((r) => r.passed === false);
  const pending = rules.filter((r) => r.passed === null);

  const hardFail = failed.some((r) =>
    ["vehicle_type", "iva_not_used"].includes(r.rule),
  );

  let verdict: EligibilityResult["verdict"];
  if (hardFail) verdict = "NO_APTO";
  else if (failed.length > 0 || pending.length > 0) verdict = "REVISION";
  else verdict = "APTO";

  const summary =
    verdict === "APTO"
      ? "Cumple todos los requisitos evaluados: puede iniciar el trámite."
      : verdict === "REVISION"
        ? `Requiere revisión: ${[...failed, ...pending].map((r) => r.label.toLowerCase()).join(", ")}.`
        : `No es apto: ${failed.map((r) => r.detail).join(" ")}`;

  return { verdict, rules, summary };
}
