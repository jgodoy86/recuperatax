export function VerdictBadge({ verdict }: { verdict: string }) {
  const cls =
    verdict === "APTO"
      ? "bg-brand-100 text-brand-800"
      : verdict === "REVISION" || verdict === "PENDIENTE"
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return <span className={`badge ${cls}`}>{verdict.replace("_", " ")}</span>;
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const good = ["APROBADO", "PAGADO", "FINALIZADO", "RADICADO", "SUBSANADO"];
  const bad = ["NEGADO", "RECHAZADO", "NO_APTO", "ERROR"];
  const warn = ["REQUERIDO", "REQUERIMIENTO", "DOCS_PENDIENTES", "PENDIENTE"];
  const cls = good.includes(status)
    ? "bg-brand-100 text-brand-800"
    : bad.includes(status)
      ? "bg-red-100 text-red-800"
      : warn.includes(status)
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-700";
  return <span className={`badge ${cls}`}>{label}</span>;
}
