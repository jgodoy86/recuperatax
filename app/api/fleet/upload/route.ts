import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { createFleetCases, parseFleetCsv } from "@/lib/fleet";

const MAX_ROWS = 500;

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["CLIENT", "ADMIN", "GESTOR"]);
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Archivo CSV requerido" }, { status: 400 });
    if (file.size > 2 * 1024 * 1024)
      return NextResponse.json({ error: "El CSV supera 2 MB" }, { status: 400 });

    const content = Buffer.from(await file.arrayBuffer()).toString("utf8");
    const { rows, errors } = parseFleetCsv(content);
    if (rows.length > MAX_ROWS)
      return NextResponse.json({ error: `Máximo ${MAX_ROWS} vehículos por cargue` }, { status: 400 });
    if (rows.length === 0)
      return NextResponse.json({ error: "Ninguna fila válida", results: errors }, { status: 400 });

    const created = await createFleetCases(session.userId, rows, session.email);
    const results = [...errors, ...created].sort((a, b) => a.line - b.line);

    return NextResponse.json({
      ok: true,
      total: results.length,
      creados: created.filter((r) => r.ok).length,
      aptos: created.filter((r) => r.verdict === "APTO").length,
      conError: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
