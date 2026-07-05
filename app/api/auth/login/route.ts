import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  if (!user || !(await verifyPassword(password ?? "", user.passwordHash)))
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });

  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
  return NextResponse.json({ ok: true, role: user.role });
}
