// Catálogos y etiquetas de la plataforma

export const VEHICLE_TYPES = {
  BEV: "Eléctrico (BEV)",
  HEV: "Híbrido (HEV)",
  PHEV: "Híbrido enchufable (PHEV)",
  MHEV: "Híbrido ligero (MHEV) — no aplica",
  OTRO: "Otro",
} as const;

export const CLIENT_TYPES = {
  NATURAL: "Persona natural",
  EMPRESA: "Empresa",
} as const;

export const DOCUMENT_TYPES = {
  CEDULA: "Cédula de ciudadanía",
  RUT: "RUT",
  FACTURA_PDF: "Factura electrónica (PDF)",
  FACTURA_XML: "Factura electrónica (XML)",
  FICHA_TECNICA: "Ficha técnica del vehículo",
  TARJETA_PROPIEDAD: "Tarjeta de propiedad",
  SOPORTE_PAGO: "Soporte de pago",
  CAMARA_COMERCIO: "Certificado cámara de comercio",
  CERTIFICACION_CONTABLE: "Certificación contable",
  PODER: "Poder / autorización",
  CERTIFICADO_UPME: "Certificado UPME",
  OTRO: "Otro documento",
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

export const DOCUMENT_STATUS = {
  PENDIENTE: "Pendiente",
  EN_VALIDACION: "En validación",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  REQUIERE_CORRECCION: "Requiere corrección",
  REVISION_HUMANA: "Revisión humana",
} as const;

export const CASE_STATUS = {
  DIAGNOSTICO: "Diagnóstico",
  DOCUMENTOS: "Carga documental",
  FIRMA: "Firma de documentos",
  UPME: "Trámite UPME",
  DIAN: "Devolución DIAN",
  FINALIZADO: "Finalizado",
  NO_APTO: "No apto",
  CERRADO: "Cerrado",
} as const;

export const UPME_STATUS = {
  PENDIENTE: "Pendiente",
  DOCS_PENDIENTES: "Documentos pendientes",
  REVISION_INTERNA: "En revisión interna",
  EXPEDIENTE_LISTO: "Expediente listo",
  RADICADO: "Radicado UPME",
  REVISION_COMPLETITUD: "En revisión de completitud",
  REQUERIDO: "Requerido por UPME",
  SUBSANADO: "Subsanado",
  EN_EVALUACION: "En evaluación",
  APROBADO: "Certificado aprobado",
  NEGADO: "Negado",
  CERRADO: "Cerrado",
} as const;

export const DIAN_STATUS = {
  PENDIENTE: "Pendiente",
  EXPEDIENTE_LISTO: "Expediente DIAN listo",
  RADICADO: "Radicado DIAN",
  EN_REVISION: "En revisión",
  REQUERIMIENTO: "Requerimiento DIAN",
  SUBSANADO: "Subsanado",
  APROBADO: "Devolución aprobada",
  RECHAZADO: "Rechazado",
  PAGADO: "Devolución pagada",
  CERRADO: "Cerrado",
} as const;

export const SIGNATURE_TYPES = {
  CONTRATO_SERVICIOS: "Contrato de prestación de servicios",
  HABEAS_DATA: "Autorización de tratamiento de datos personales",
  MANDATO: "Mandato para gestión del trámite",
  VERACIDAD: "Declaración de veracidad de la información",
  NO_GARANTIA: "Aceptación de no garantía de resultado",
} as const;

export type SignatureType = keyof typeof SIGNATURE_TYPES;

// Documentos mínimos requeridos según tipo de cliente
export function requiredDocuments(clientType: string): DocumentType[] {
  const base: DocumentType[] = [
    "CEDULA",
    "RUT",
    "FACTURA_PDF",
    "FICHA_TECNICA",
    "SOPORTE_PAGO",
  ];
  if (clientType === "EMPRESA") {
    return [...base, "CAMARA_COMERCIO", "CERTIFICACION_CONTABLE"];
  }
  return base;
}

// IVA general en Colombia
export const IVA_RATE = 0.19;
// Tope de devolución en UVT/valores — parametrizable
export const FEE_PCT = 0.1; // honorarios de éxito: 10 %
export const FEE_MIN = 900_000; // honorario mínimo COP
// Plazo máximo desde fecha de factura para solicitar devolución (2 años)
export const INVOICE_MAX_AGE_DAYS = 730;

export const fmtCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);
