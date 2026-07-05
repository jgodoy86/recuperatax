import { NextResponse } from "next/server";
import { FLEET_TEMPLATE } from "@/lib/fleet";

export function GET() {
  return new NextResponse("﻿" + FLEET_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-flota-recuperatax.csv"',
    },
  });
}
