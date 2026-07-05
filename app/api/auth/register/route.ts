import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { notify } from "@/lib/notifications";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  clientType: z.enum(["NATURAL", "EMPRESA"]).default("NATURAL"),
  documentId: z.string().optional(),
  companyName: z.string().optional(),
  role: z.enum(["CLIENT", "DEALER"]).default("CLIENT"),
  dealershipName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const exists = await db.user.findUnique({ where: { email: data.email } });
  if (exists)
    return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      phone: data.phone,
      clientType: data.clientType,
      documentId: data.documentId,
      companyName: data.companyName,
      role: data.role,
    },
  });

  if (data.role === "DEALER") {
    await db.dealer.create({
      data: { userId: user.id, dealershipName: data.dealershipName ?? data.name },
    });
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
  await notify(user.id, "BIENVENIDA", { name: user.name });
  return NextResponse.json({ ok: true, role: user.role });
}
