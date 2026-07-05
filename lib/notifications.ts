// Módulo de notificaciones — WhatsApp y correo.
// Proveedores conectables por variables de entorno; sin credenciales las
// notificaciones quedan registradas en BD con estado PENDIENTE (cola).

import { db } from "./db";

export type NotificationTemplate =
  | "DOC_RECIBIDO"
  | "DOC_RECHAZADO"
  | "DOC_FALTANTE"
  | "CASO_RADICADO"
  | "REQUERIMIENTO"
  | "CERTIFICADO_APROBADO"
  | "EXPEDIENTE_DIAN_LISTO"
  | "DEVOLUCION_APROBADA"
  | "PAGO_RECIBIDO"
  | "BIENVENIDA";

const TEMPLATES: Record<NotificationTemplate, { subject: string; body: (v: Record<string, string>) => string }> = {
  BIENVENIDA: {
    subject: "Bienvenido a RecuperaTax",
    body: (v) =>
      `Hola ${v.name}, tu cuenta fue creada. Tu caso ${v.refCode ?? ""} está en diagnóstico. Te avisaremos cada avance.`,
  },
  DOC_RECIBIDO: {
    subject: "Documento recibido",
    body: (v) => `Recibimos tu documento "${v.docType}" del caso ${v.refCode}. Está en validación.`,
  },
  DOC_RECHAZADO: {
    subject: "Documento rechazado",
    body: (v) =>
      `Tu documento "${v.docType}" del caso ${v.refCode} fue rechazado: ${v.reason}. Por favor cárgalo de nuevo.`,
  },
  DOC_FALTANTE: {
    subject: "Falta un documento",
    body: (v) => `Para avanzar con el caso ${v.refCode} necesitamos: ${v.docType}.`,
  },
  CASO_RADICADO: {
    subject: "Caso radicado",
    body: (v) => `Tu caso ${v.refCode} fue radicado ante ${v.entity}. Radicado: ${v.radicado}.`,
  },
  REQUERIMIENTO: {
    subject: "Requerimiento de la entidad",
    body: (v) => `${v.entity} hizo un requerimiento en tu caso ${v.refCode}. Nuestro equipo ya está trabajando en la respuesta.`,
  },
  CERTIFICADO_APROBADO: {
    subject: "¡Certificado UPME aprobado!",
    body: (v) => `El certificado UPME de tu caso ${v.refCode} fue aprobado. Ahora preparamos el expediente DIAN.`,
  },
  EXPEDIENTE_DIAN_LISTO: {
    subject: "Expediente DIAN listo",
    body: (v) => `El expediente DIAN de tu caso ${v.refCode} está listo para radicar.`,
  },
  DEVOLUCION_APROBADA: {
    subject: "¡Devolución aprobada!",
    body: (v) => `La DIAN aprobó la devolución de tu caso ${v.refCode}.`,
  },
  PAGO_RECIBIDO: {
    subject: "Pago recibido",
    body: (v) => `Se registró el pago de la devolución de tu caso ${v.refCode} por ${v.amount}.`,
  },
};

export async function notify(
  userId: string,
  template: NotificationTemplate,
  vars: Record<string, string> = {},
) {
  const t = TEMPLATES[template];
  const body = t.body(vars);

  const channels: ("EMAIL" | "WHATSAPP")[] = ["EMAIL", "WHATSAPP"];
  for (const channel of channels) {
    const notification = await db.notification.create({
      data: { userId, channel, template, subject: t.subject, body },
    });
    // Envío inmediato si el proveedor está configurado; si no, queda en cola.
    try {
      const sent = await dispatch(channel, userId, t.subject, body);
      if (sent) {
        await db.notification.update({
          where: { id: notification.id },
          data: { status: "ENVIADA", sentAt: new Date() },
        });
      }
    } catch (err) {
      await db.notification.update({
        where: { id: notification.id },
        data: { status: "ERROR", error: String(err) },
      });
    }
  }
}

async function dispatch(
  channel: "EMAIL" | "WHATSAPP",
  userId: string,
  subject: string,
  body: string,
): Promise<boolean> {
  if (channel === "WHATSAPP") {
    const url = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_API_TOKEN;
    if (!url || !token) return false; // sin proveedor: queda PENDIENTE en cola
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.phone) return false;
    // Compatible con WhatsApp Cloud API (Meta)
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: user.phone.replace(/\D/g, ""),
        type: "text",
        text: { body: `*${subject}*\n${body}` },
      }),
    });
    if (!res.ok) throw new Error(`WhatsApp API ${res.status}`);
    return true;
  }
  // EMAIL: requiere SMTP_URL — para el MVP queda en cola si no está configurado
  if (!process.env.SMTP_URL) return false;
  // Integración SMTP real se conecta aquí (nodemailer u otro).
  return false;
}
