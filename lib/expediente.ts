// Generador de expedientes UPME y DIAN a partir del caso y sus documentos.

import { db } from "./db";
import { DOCUMENT_TYPES, SIGNATURE_TYPES, fmtCOP } from "./constants";

export async function buildExpediente(caseId: string, entity: "UPME" | "DIAN") {
  const c = await db.case.findUniqueOrThrow({
    where: { id: caseId },
    include: { client: true, documents: true, signatures: true },
  });

  const approvedDocs = c.documents.filter((d) => d.status === "APROBADO");

  const base = {
    generado: new Date().toISOString(),
    referencia: c.refCode,
    solicitante: {
      tipo: c.client.clientType,
      nombre: c.client.companyName ?? c.client.name,
      identificacion: c.client.documentId,
      email: c.client.email,
      telefono: c.client.phone,
    },
    vehiculo: {
      tipo: c.vehicleType,
      marca: c.vehicleBrand,
      modelo: c.vehicleModel,
      anio: c.vehicleYear,
      vin: c.vin,
      placa: c.plate,
    },
    factura: {
      numero: c.invoiceNumber,
      fecha: c.invoiceDate?.toISOString().slice(0, 10),
      valorCompra: c.purchaseValue,
      ivaPagado: c.ivaPaid,
      ivaDiscriminado: c.ivaDiscriminated,
    },
    firmas: c.signatures.map((s) => ({
      tipo: SIGNATURE_TYPES[s.type as keyof typeof SIGNATURE_TYPES] ?? s.type,
      firmante: s.signerName,
      fecha: s.signedAt.toISOString(),
      hash: s.hash,
    })),
    soportes: approvedDocs.map((d) => ({
      tipo: DOCUMENT_TYPES[d.type as keyof typeof DOCUMENT_TYPES] ?? d.type,
      archivo: d.fileName,
      aprobado: d.reviewedAt?.toISOString(),
    })),
  };

  if (entity === "UPME") {
    return {
      ...base,
      tramite: "Certificación UPME — incentivo tributario vehículo eléctrico/híbrido",
      observacionesTecnicas: `Vehículo ${c.vehicleBrand} ${c.vehicleModel} ${c.vehicleYear}, tecnología ${c.vehicleType}. Se solicita certificación para acceder a la exclusión/devolución de IVA.`,
      checklist: buildChecklist(c.documents.map((d) => d.type), "UPME", c.client.clientType),
    };
  }

  return {
    ...base,
    tramite: "Solicitud de devolución de IVA ante DIAN",
    certificadoUpme: c.upmeCertificate ?? c.upmeRadicado,
    memorial: buildMemorial(c),
    relacionFacturas: [
      {
        numero: c.invoiceNumber,
        fecha: c.invoiceDate?.toISOString().slice(0, 10),
        proveedor: "(según factura)",
        base: c.purchaseValue - c.ivaPaid,
        iva: c.ivaPaid,
      },
    ],
    checklist: buildChecklist(c.documents.map((d) => d.type), "DIAN", c.client.clientType),
  };
}

function buildChecklist(
  docTypes: string[],
  entity: "UPME" | "DIAN",
  clientType: string,
) {
  const required =
    entity === "UPME"
      ? ["CEDULA", "RUT", "FACTURA_PDF", "FICHA_TECNICA"]
      : [
          "CERTIFICADO_UPME",
          "FACTURA_PDF",
          "FACTURA_XML",
          "SOPORTE_PAGO",
          ...(clientType === "EMPRESA" ? ["CAMARA_COMERCIO", "CERTIFICACION_CONTABLE"] : []),
        ];
  return required.map((r) => ({
    documento: DOCUMENT_TYPES[r as keyof typeof DOCUMENT_TYPES] ?? r,
    presente: docTypes.includes(r),
  }));
}

function buildMemorial(c: {
  refCode: string;
  ivaPaid: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  client: { name: string; companyName: string | null; documentId: string | null };
}) {
  const nombre = c.client.companyName ?? c.client.name;
  return (
    `Señores DIAN:\n\n` +
    `${nombre}, identificado(a) con ${c.client.documentId ?? "(documento)"}, ` +
    `solicita respetuosamente la devolución del IVA pagado por valor de ${fmtCOP(c.ivaPaid)} ` +
    `en la adquisición del vehículo ${c.vehicleBrand} ${c.vehicleModel} ${c.vehicleYear}, ` +
    `de conformidad con el beneficio tributario aplicable a vehículos eléctricos e híbridos, ` +
    `adjuntando el certificado UPME, la factura electrónica con IVA discriminado y los soportes relacionados. ` +
    `Referencia interna: ${c.refCode}.`
  );
}
