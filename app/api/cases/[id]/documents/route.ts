import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";
import { AuthError, requireSession } from "@/lib/auth";
import { DOCUMENT_TYPES, DocumentType } from "@/lib/constants";
import { validateDocument } from "@/lib/ai/validator";
import { validateUblAgainstCase } from "@/lib/ubl";
import { INVOICE_MAX_AGE_DAYS } from "@/lib/constants";
import { notify } from "@/lib/notifications";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/xml",
  "application/xml",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const c = await db.case.findUnique({ where: { id }, include: { client: true } });
    if (!c) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    if (session.role === "CLIENT" && c.clientId !== session.userId)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const type = String(form.get("type") ?? "OTRO") as DocumentType;

    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    if (!(type in DOCUMENT_TYPES))
      return NextResponse.json({ error: "Tipo de documento inválido" }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: "Archivo supera 15 MB" }, { status: 400 });
    if (!ALLOWED_MIME.includes(file.type))
      return NextResponse.json({ error: `Formato no permitido: ${file.type}` }, { status: 400 });

    await fs.mkdir(path.join(UPLOAD_DIR, id), { recursive: true });
    const safeName = `${crypto.randomUUID()}${path.extname(file.name).slice(0, 10)}`;
    const filePath = path.join(UPLOAD_DIR, id, safeName);
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    const doc = await db.document.create({
      data: {
        caseId: id,
        type,
        status: "EN_VALIDACION",
        fileName: file.name,
        filePath,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    });

    await db.caseEvent.create({
      data: {
        caseId: id,
        type: "DOC_UPLOADED",
        actor: session.email,
        message: `Documento cargado: ${DOCUMENT_TYPES[type]} (${file.name})`,
      },
    });

    // Validación automática: parser UBL determinístico para el XML de la
    // factura electrónica; IA (visión/PDF) para el resto de documentos.
    let validation: {
      verdict: string;
      reason: string;
      engine: string;
      [k: string]: unknown;
    };
    if (type === "FACTURA_XML") {
      const xml = Buffer.from(await file.arrayBuffer()).toString("utf8");
      const ubl = validateUblAgainstCase(xml, {
        clientName: c.client.companyName ?? c.client.name,
        clientDocumentId: c.client.documentId,
        ivaPaid: c.ivaPaid,
        invoiceDate: c.invoiceDate,
        invoiceNumber: c.invoiceNumber,
        maxAgeDays: INVOICE_MAX_AGE_DAYS,
      });
      validation = { ...ubl, engine: "ubl" };

      // Si la factura es válida, completar el caso con los valores exactos
      if (ubl.verdict === "APROBADO" && ubl.parsed.ivaAmount) {
        await db.case.update({
          where: { id },
          data: {
            ivaPaid: ubl.parsed.ivaAmount,
            ivaDiscriminated: true,
            ...(ubl.parsed.invoiceNumber ? { invoiceNumber: ubl.parsed.invoiceNumber } : {}),
            ...(ubl.parsed.issueDate ? { invoiceDate: new Date(ubl.parsed.issueDate) } : {}),
            estimatedRecovery: ubl.parsed.ivaAmount,
          },
        });
        await db.caseEvent.create({
          data: {
            caseId: id,
            type: "NOTE",
            actor: "sistema",
            message: `Datos del caso actualizados con los valores exactos del XML de la factura: IVA ${ubl.parsed.ivaAmount.toLocaleString("es-CO")} COP, factura ${ubl.parsed.invoiceNumber ?? ""} del ${ubl.parsed.issueDate ?? ""}. CUFE registrado.`,
          },
        });
      }
    } else {
      validation = await validateDocument({
        filePath,
        mimeType: file.type,
        documentType: type,
        clientName: c.client.companyName ?? c.client.name,
        caseContext: {
          vehicleType: c.vehicleType,
          vehicleBrand: c.vehicleBrand,
          vehicleModel: c.vehicleModel,
          ivaPaid: c.ivaPaid,
        },
      });
    }

    await db.document.update({
      where: { id: doc.id },
      data: {
        status: validation.verdict,
        aiValidation: JSON.stringify(validation),
        ...(validation.verdict === "APROBADO" || validation.verdict === "RECHAZADO"
          ? { reviewedAt: new Date() }
          : {}),
      },
    });

    await db.caseEvent.create({
      data: {
        caseId: id,
        type: "DOC_REVIEWED",
        actor: validation.engine === "ia" ? "ia" : "sistema",
        message: `Validación de ${DOCUMENT_TYPES[type]}: ${validation.verdict} — ${validation.reason}`,
      },
    });

    await notify(
      c.clientId,
      validation.verdict === "RECHAZADO" ? "DOC_RECHAZADO" : "DOC_RECIBIDO",
      { refCode: c.refCode, docType: DOCUMENT_TYPES[type], reason: validation.reason },
    );

    return NextResponse.json({ ok: true, documentId: doc.id, validation });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
