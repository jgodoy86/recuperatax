// Datos de demostración: admin, gestor, cliente y un caso de ejemplo.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash("demo1234", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@recuperatax.co" },
    update: {},
    create: { email: "admin@recuperatax.co", passwordHash: pw, name: "Admin RecuperaTax", role: "ADMIN" },
  });

  const gestor = await db.user.upsert({
    where: { email: "gestor@recuperatax.co" },
    update: {},
    create: { email: "gestor@recuperatax.co", passwordHash: pw, name: "Gestora Demo", role: "GESTOR" },
  });

  const cliente = await db.user.upsert({
    where: { email: "cliente@demo.co" },
    update: {},
    create: {
      email: "cliente@demo.co",
      passwordHash: pw,
      name: "Carlos Cliente",
      role: "CLIENT",
      clientType: "NATURAL",
      documentId: "1020304050",
      phone: "+57 300 123 4567",
    },
  });

  const existing = await db.case.findUnique({ where: { refCode: "RTX-2026-0001" } });
  if (!existing) {
    const c = await db.case.create({
      data: {
        refCode: "RTX-2026-0001",
        clientId: cliente.id,
        gestorId: gestor.id,
        vehicleType: "PHEV",
        vehicleBrand: "BYD",
        vehicleModel: "Song Plus DM-i",
        vehicleYear: 2026,
        invoiceNumber: "FE-12345",
        invoiceDate: new Date("2026-03-15"),
        purchaseValue: 180_000_000,
        ivaPaid: 28_739_496,
        ivaDiscriminated: true,
        estimatedRecovery: 28_739_496,
        fees: 2_873_950,
        eligibility: "APTO",
        status: "DOCUMENTOS",
        upmeStatus: "DOCS_PENDIENTES",
      },
    });
    await db.caseEvent.create({
      data: {
        caseId: c.id,
        type: "STATUS_CHANGE",
        actor: "sistema",
        message: "Caso demo creado. Diagnóstico: APTO.",
      },
    });
  }

  console.log("Seed listo:");
  console.log("  admin@recuperatax.co / demo1234  (backoffice)");
  console.log("  gestor@recuperatax.co / demo1234 (backoffice)");
  console.log("  cliente@demo.co / demo1234       (dashboard cliente)");
  void admin;
}

main().finally(() => db.$disconnect());
