import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { AuthError, requireSession } from "@/lib/auth";
import { SIGNATURE_TYPES, SignatureType } from "@/lib/constants";

const schema = z.object({
  types: z.array(z.enum(Object.keys(SIGNATURE_TYPES) as [SignatureType, ...SignatureType[]])).min(1),
  signerName: z.string().min(3),
  signerDoc: z.string().min(4),
  accepted: z.literal(true),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const c = await db.case.findUnique({ where: { id } });
    if (!c) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    if (session.role === "CLIENT" && c.clientId !== session.userId)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Debe aceptar todos los documentos y diligenciar sus datos" }, { status: 400 });
    const { types, signerName, signerDoc } = parsed.data;

    const ip = req.headers.get("x-forwarded-for") ?? "local";
    const ua = req.headers.get("user-agent") ?? "";
    const signedAt = new Date();

    for (const type of types) {
      const hash = crypto
        .createHash("sha256")
        .update(`${type}|${SIGNATURE_TYPES[type]}|${signerName}|${signerDoc}|${c.refCode}|${signedAt.toISOString()}`)
        .digest("hex");
      await db.signature.create({
        data: { caseId: id, type, signerName, signerDoc, ipAddress: ip, userAgent: ua, hash },
      });
    }

    // Con las 5 firmas el caso pasa a carga documental
    const count = await db.signature.count({ where: { caseId: id } });
    if (count >= Object.keys(SIGNATURE_TYPES).length && c.status === "FIRMA") {
      await db.case.update({ where: { id }, data: { status: "DOCUMENTOS", upmeStatus: "DOCS_PENDIENTES" } });
    }

    await db.caseEvent.create({
      data: {
        caseId: id,
        type: "NOTE",
        actor: session.email,
        message: `Firma digital registrada: ${types.map((t) => SIGNATURE_TYPES[t]).join("; ")}`,
      },
    });

    return NextResponse.json({ ok: true, signed: types.length });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
