import { NextResponse, type NextRequest } from "next/server";
import { apiFetch } from "@/lib/api-server";

const TYPES = { pdf: "application/pdf", csv: "text/csv; charset=utf-8" } as const;

// §4.6 — relais du registre du personnel formé (PDF ou CSV) ; l'API vérifie que
// la réservation appartient au compte connecté et que la session est clôturée.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; format: string }> }) {
  const { id, format } = await params;
  if (format !== "pdf" && format !== "csv") return NextResponse.json({ message: "Format inconnu." }, { status: 404 });
  const res = await apiFetch(`/reservations/${id}/participants/registre.${format}`);
  if (!res.ok) return NextResponse.json({ message: "Registre indisponible." }, { status: res.status });
  return new NextResponse(res.body, {
    status: 200,
    headers: {
      "Content-Type": TYPES[format],
      "Content-Disposition": res.headers.get("content-disposition") ?? `attachment; filename=registre.${format}`,
    },
  });
}
