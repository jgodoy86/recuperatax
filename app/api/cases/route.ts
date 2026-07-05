import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { AuthError, requireSession } from "@/lib/auth";
import { evaluateEligibility } from "@/lib/eligibility";
import { FEE_MIN, FEE_PCT } from "@/lib/constants";

const schema = z.object({
  simulationId: z.string().optional(),
  vehicleType: z.enum(["BEV", "HEV", "PHEV", "MHEV", "OTRO"]),
  vehicleBrand: z.string().min(1),
  vehicleModel: z.string().min(1),
  vehicleYear: z.coerce.number().int(),
  vin: z.string().optional(),
  plate: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.coerce.date().optional(),
  purchaseValue: z.coerce.number().positive(),
  ivaPaid: z.coerce.number().min(0),
  ivaDiscriminated: z.coerce.boolean().default(false),
  ivaAlreadyUsed: z.coerce.boolean().default(false),
  dealerCode: z.string().optional(), // referido por concesionario
});

async function nextRefCode() {
  const year = new Date().getFullYear();
  const count = await db.case.count();
  return `RTX-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["CLIENT", "ADMIN", "GESTOR"]);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;

    const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

    const eligibility = evaluateEligibility({
      clientType: user.clientType as "NATURAL" | "EMPRESA",
      vehicleType: data.vehicleType,
      hasInvoice: !!data.invoiceNumber || !!data.invoiceDate,
      ivaDiscriminated: data.ivaDiscriminated,
      invoiceDate: data.invoiceDate,
      purchaseValue: data.purchaseValue,
      ivaPaid: data.ivaPaid,
      ivaAlreadyUsed: data.ivaAlreadyUsed,
    });

    const estimatedRecovery = eligibility.verdict === "NO_APTO" ? 0 : data.ivaPaid;
    const fees = estimatedRecovery > 0 ? Math.max(Math.round(estimatedRecovery * FEE_PCT), FEE_MIN) : 0;

    let dealerId: string | undefined;
    if (data.dealerCode) {
      const dealer = await db.dealer.findUnique({ where: { id: data.dealerCode } });
      dealerId = dealer?.id;
    }

    const created = await db.case.create({
      data: {
        refCode: await nextRefCode(),
        clientId: session.userId,
        dealerId,
        vehicleType: data.vehicleType,
        vehicleBrand: data.vehicleBrand,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear,
        vin: data.vin,
        plate: data.plate,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        purchaseValue: data.purchaseValue,
        ivaPaid: data.ivaPaid,
        ivaDiscriminated: data.ivaDiscriminated,
        ivaAlreadyUsed: data.ivaAlreadyUsed,
        estimatedRecovery,
        fees,
        eligibility: eligibility.verdict,
        eligibilityDetail: JSON.stringify(eligibility),
        status: eligibility.verdict === "NO_APTO" ? "NO_APTO" : "FIRMA",
      },
    });

    if (data.simulationId) {
      await db.simulation
        .update({ where: { id: data.simulationId }, data: { convertedCaseId: created.id } })
        .catch(() => {});
    }

    await db.caseEvent.create({
      data: {
        caseId: created.id,
        type: "STATUS_CHANGE",
        actor: session.email,
        message: `Caso creado. Diagnóstico: ${eligibility.verdict}. ${eligibility.summary}`,
      },
    });

    return NextResponse.json({ ok: true, caseId: created.id, refCode: created.refCode, eligibility });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    const cases = await db.case.findMany({
      where: session.role === "CLIENT" ? { clientId: session.userId } : {},
      orderBy: { updatedAt: "desc" },
      include: { client: { select: { name: true, email: true } } },
    });
    return NextResponse.json({ cases });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
