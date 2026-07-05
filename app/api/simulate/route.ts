import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { simulate } from "@/lib/simulator";

const schema = z.object({
  clientType: z.enum(["NATURAL", "EMPRESA"]),
  vehicleType: z.enum(["BEV", "HEV", "PHEV", "MHEV", "OTRO"]),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.coerce.number().int().min(2015).max(2030).optional(),
  purchaseValue: z.coerce.number().positive(),
  ivaPaid: z.coerce.number().min(0).default(0),
  hasInvoice: z.coerce.boolean().default(false),
  ivaDiscriminated: z.coerce.boolean().default(false),
  invoiceDate: z.coerce.date().optional(),
  ivaAlreadyUsed: z.coerce.boolean().default(false),
  declaresIncome: z.coerce.boolean().default(false),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 });

  const input = parsed.data;
  const result = simulate(input);

  const record = await db.simulation.create({
    data: {
      clientType: input.clientType,
      vehicleType: input.vehicleType,
      vehicleBrand: input.vehicleBrand,
      vehicleModel: input.vehicleModel,
      vehicleYear: input.vehicleYear,
      purchaseValue: input.purchaseValue,
      ivaPaid: result.ivaPaid,
      hasInvoice: input.hasInvoice,
      declaresIncome: input.declaresIncome,
      invoiceDate: input.invoiceDate,
      eligibility: result.eligibility.verdict,
      estimatedRefund: result.estimatedRefund,
      fees: result.fees,
      detail: JSON.stringify(result),
      email: input.email,
    },
  });

  return NextResponse.json({ simulationId: record.id, ...result });
}
