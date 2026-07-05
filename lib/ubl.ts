// Parser de factura electrónica colombiana (UBL 2.1 / DIAN).
//
// Soporta los dos formatos que entregan los facturadores:
//   1. <Invoice> directo (XML de la factura).
//   2. <AttachedDocument> (contenedor DIAN) con la factura embebida como
//      CDATA dentro de cac:Attachment/cac:ExternalReference/cbc:Description.
//
// Extrae los datos fiscales relevantes y los valida contra el caso.

import { XMLParser } from "fast-xml-parser";

export type UblInvoice = {
  invoiceNumber: string | null;
  cufe: string | null;
  issueDate: string | null; // AAAA-MM-DD
  supplierName: string | null;
  supplierId: string | null; // NIT del vendedor
  customerName: string | null;
  customerId: string | null; // cédula o NIT del comprador
  lineExtensionAmount: number | null; // base antes de impuestos
  payableAmount: number | null; // total a pagar
  ivaAmount: number | null; // IVA total (TaxScheme 01)
  ivaPercent: number | null;
  currency: string | null;
  items: string[]; // descripciones de líneas (para detectar el vehículo)
};

export type UblValidation = {
  parsed: UblInvoice;
  checks: { label: string; passed: boolean; detail: string }[];
  verdict: "APROBADO" | "REQUIERE_CORRECCION" | "REVISION_HUMANA";
  reason: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true, // cbc:ID → ID
  parseTagValue: false, // conservar strings; convertimos números a mano
});

const num = (v: unknown): number | null => {
  if (v == null) return null;
  const s = typeof v === "object" ? (v as Record<string, unknown>)["#text"] : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const text = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === "object") {
    const t = (v as Record<string, unknown>)["#text"];
    return t != null ? String(t) : null;
  }
  return String(v);
};

const arr = <T,>(v: T | T[] | undefined): T[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];

/** Extrae el nodo Invoice, desenvolviendo AttachedDocument si es necesario. */
function extractInvoiceNode(xml: string): Record<string, unknown> | null {
  const doc = parser.parse(xml);
  if (doc.Invoice) return doc.Invoice;

  if (doc.AttachedDocument) {
    // La factura viene embebida como CDATA en cbc:Description
    const att = doc.AttachedDocument;
    const desc =
      att?.Attachment?.ExternalReference?.Description ??
      att?.Attachment?.ExternalReference?.[0]?.Description;
    const inner = text(desc);
    if (inner && inner.includes("<Invoice")) {
      const innerDoc = parser.parse(inner);
      if (innerDoc.Invoice) return innerDoc.Invoice;
    }
  }
  return null;
}

function partyInfo(party: Record<string, unknown> | undefined): {
  name: string | null;
  id: string | null;
} {
  if (!party) return { name: null, id: null };
  const p = (party as { Party?: Record<string, unknown> }).Party ?? party;
  const legal = (p as Record<string, unknown>).PartyLegalEntity as
    | Record<string, unknown>
    | undefined;
  const taxScheme = (p as Record<string, unknown>).PartyTaxScheme as
    | Record<string, unknown>
    | undefined;
  const name =
    text(legal?.RegistrationName) ??
    text(taxScheme?.RegistrationName) ??
    text(
      ((p as Record<string, unknown>).PartyName as Record<string, unknown>)
        ?.Name,
    );
  const id =
    text(legal?.CompanyID) ??
    text(taxScheme?.CompanyID) ??
    text(
      ((p as Record<string, unknown>).PartyIdentification as Record<string, unknown>)
        ?.ID,
    );
  return { name, id };
}

export function parseUblInvoice(xml: string): UblInvoice | null {
  let invoice: Record<string, unknown> | null;
  try {
    invoice = extractInvoiceNode(xml);
  } catch {
    return null;
  }
  if (!invoice) return null;

  // IVA: TaxTotal cuyo TaxSubtotal referencia TaxScheme ID 01 (IVA en DIAN)
  let ivaAmount: number | null = null;
  let ivaPercent: number | null = null;
  for (const taxTotal of arr(invoice.TaxTotal as Record<string, unknown>[])) {
    for (const sub of arr(taxTotal.TaxSubtotal as Record<string, unknown>[])) {
      const cat = sub.TaxCategory as Record<string, unknown> | undefined;
      const scheme = cat?.TaxScheme as Record<string, unknown> | undefined;
      const schemeId = text(scheme?.ID);
      const schemeName = (text(scheme?.Name) ?? "").toUpperCase();
      if (schemeId === "01" || schemeName === "IVA") {
        ivaAmount = (ivaAmount ?? 0) + (num(sub.TaxAmount) ?? 0);
        ivaPercent = num(cat?.Percent) ?? ivaPercent;
      }
    }
    // Facturas sin TaxSubtotal detallado: tomar el TaxAmount del total
    if (ivaAmount == null && num(taxTotal.TaxAmount) != null) {
      ivaAmount = num(taxTotal.TaxAmount);
    }
  }

  const legalTotal = invoice.LegalMonetaryTotal as Record<string, unknown> | undefined;
  const supplier = partyInfo(invoice.AccountingSupplierParty as Record<string, unknown>);
  const customer = partyInfo(invoice.AccountingCustomerParty as Record<string, unknown>);

  const items = arr(invoice.InvoiceLine as Record<string, unknown>[])
    .map((l) => {
      const item = l.Item as Record<string, unknown> | undefined;
      return text(item?.Description) ?? "";
    })
    .filter(Boolean);

  const payable = legalTotal?.PayableAmount;

  return {
    invoiceNumber: text(invoice.ID),
    cufe: text(invoice.UUID),
    issueDate: text(invoice.IssueDate),
    supplierName: supplier.name,
    supplierId: supplier.id,
    customerName: customer.name,
    customerId: customer.id,
    lineExtensionAmount: num(legalTotal?.LineExtensionAmount),
    payableAmount: num(payable),
    ivaAmount,
    ivaPercent,
    currency:
      (typeof payable === "object" &&
        text((payable as Record<string, unknown>)["@_currencyID"])) ||
      text(invoice.DocumentCurrencyCode),
    items,
  };
}

const cleanId = (s: string | null | undefined) =>
  (s ?? "").replace(/[^\dkK]/g, "").replace(/-\d$/, "");

/** Valida la factura parseada contra los datos del caso. */
export function validateUblAgainstCase(
  xml: string,
  ctx: {
    clientName: string;
    clientDocumentId: string | null;
    ivaPaid: number;
    invoiceDate: Date | null;
    invoiceNumber: string | null;
    maxAgeDays: number;
  },
): UblValidation {
  const parsed = parseUblInvoice(xml);
  if (!parsed) {
    return {
      parsed: {} as UblInvoice,
      checks: [],
      verdict: "REVISION_HUMANA",
      reason:
        "El XML no pudo interpretarse como factura electrónica UBL (Invoice o AttachedDocument). Un gestor lo revisará.",
    };
  }

  const checks: UblValidation["checks"] = [];

  // 1. IVA discriminado
  const hasIva = (parsed.ivaAmount ?? 0) > 0;
  checks.push({
    label: "IVA discriminado",
    passed: hasIva,
    detail: hasIva
      ? `IVA discriminado por ${fmt(parsed.ivaAmount!)}${parsed.ivaPercent ? ` (${parsed.ivaPercent} %)` : ""}.`
      : "La factura no discrimina IVA (TaxTotal/IVA ausente o en cero).",
  });

  // 2. IVA coincide con lo reportado (tolerancia 1 %)
  if (hasIva && ctx.ivaPaid > 0) {
    const diff = Math.abs(parsed.ivaAmount! - ctx.ivaPaid) / ctx.ivaPaid;
    checks.push({
      label: "IVA coincide con lo reportado",
      passed: diff <= 0.01,
      detail:
        diff <= 0.01
          ? `IVA de la factura (${fmt(parsed.ivaAmount!)}) coincide con el reportado.`
          : `IVA de la factura ${fmt(parsed.ivaAmount!)} difiere del reportado ${fmt(ctx.ivaPaid)} (${(diff * 100).toFixed(1)} %).`,
    });
  }

  // 3. Comprador coincide con el cliente
  if (parsed.customerId && ctx.clientDocumentId) {
    const match = cleanId(parsed.customerId).startsWith(cleanId(ctx.clientDocumentId)) ||
      cleanId(ctx.clientDocumentId).startsWith(cleanId(parsed.customerId));
    checks.push({
      label: "Comprador coincide con el cliente",
      passed: match,
      detail: match
        ? `Comprador ${parsed.customerName ?? parsed.customerId} coincide con el cliente.`
        : `El comprador de la factura (${parsed.customerId}) no coincide con la identificación del cliente (${ctx.clientDocumentId}).`,
    });
  }

  // 4. Fecha dentro del plazo
  if (parsed.issueDate) {
    const age = (Date.now() - new Date(parsed.issueDate).getTime()) / 86_400_000;
    const inRange = age >= 0 && age <= ctx.maxAgeDays;
    checks.push({
      label: "Fecha dentro del plazo",
      passed: inRange,
      detail: inRange
        ? `Factura emitida el ${parsed.issueDate} (${Math.round(age)} días).`
        : `La factura del ${parsed.issueDate} está fuera del plazo de ${ctx.maxAgeDays} días.`,
    });
    // 4b. Coincide con la fecha declarada en el caso
    if (ctx.invoiceDate) {
      const same =
        parsed.issueDate === ctx.invoiceDate.toISOString().slice(0, 10);
      checks.push({
        label: "Fecha coincide con la declarada",
        passed: same,
        detail: same
          ? "La fecha coincide con la declarada al crear el caso."
          : `La factura dice ${parsed.issueDate} pero el caso declaró ${ctx.invoiceDate.toISOString().slice(0, 10)}.`,
      });
    }
  }

  // 5. Número de factura coincide (si fue declarado)
  if (ctx.invoiceNumber && parsed.invoiceNumber) {
    const same =
      parsed.invoiceNumber.replace(/\s/g, "").toUpperCase() ===
      ctx.invoiceNumber.replace(/\s/g, "").toUpperCase();
    checks.push({
      label: "Número de factura coincide",
      passed: same,
      detail: same
        ? `Número de factura ${parsed.invoiceNumber} coincide.`
        : `La factura es la ${parsed.invoiceNumber} pero el caso declaró ${ctx.invoiceNumber}.`,
    });
  }

  // 6. CUFE presente (obligatorio en factura electrónica DIAN)
  checks.push({
    label: "CUFE presente",
    passed: !!parsed.cufe,
    detail: parsed.cufe
      ? "La factura tiene CUFE (validable ante la DIAN)."
      : "La factura no tiene CUFE: verificar que sea la representación electrónica oficial.",
  });

  const failed = checks.filter((c) => !c.passed);
  const hardFail = failed.some((c) =>
    ["IVA discriminado", "Comprador coincide con el cliente"].includes(c.label),
  );

  const verdict = hardFail
    ? "REQUIERE_CORRECCION"
    : failed.length > 0
      ? "REVISION_HUMANA"
      : "APROBADO";

  const reason =
    verdict === "APROBADO"
      ? `Factura ${parsed.invoiceNumber ?? ""} válida: IVA ${fmt(parsed.ivaAmount ?? 0)} discriminado y datos coherentes con el caso.`
      : failed.map((c) => c.detail).join(" ");

  return { parsed, checks, verdict, reason };
}

const fmt = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);
