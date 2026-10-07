import type { PaymentsTab } from "../shared/lib/paths";

// Interpreta las URL que construye `shared/lib/paths`. Es puro para poder probarlo sin navegador.
export type Route =
  | { name: "inicio" }
  | { name: "alumnos" }
  | { name: "alumno-nuevo" }
  | { name: "alumno"; studentId: string }
  | { name: "alumno-editar"; studentId: string }
  | { name: "notas"; studentId: string }
  | { name: "nota-nueva"; studentId: string }
  | { name: "nota-editar"; studentId: string; noteId: string }
  | { name: "clases"; view: "day" | "groups"; date?: string }
  | { name: "grupo-nuevo" }
  | { name: "grupo-editar"; groupId: string }
  | { name: "sesion"; sessionId: string }
  | { name: "sesion-nota"; sessionId: string; studentId: string }
  | { name: "pagos"; tab: PaymentsTab; due?: string }
  | { name: "pago-nuevo"; tab: Exclude<PaymentsTab, "pedidos">; chargeId?: string }
  | { name: "pedido-nuevo" }
  | { name: "pedido"; orderId: string }
  | { name: "examenes" }
  | { name: "reportes" }
  | { name: "configuracion" }
  | { name: "no-encontrada" };

export function matchRoute(url: string): Route {
  const { pathname, searchParams } = new URL(url, "http://local");
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const param = (name: string) => searchParams.get(name) || undefined;
  const [section, a, b, c, d] = parts;
  const size = parts.length;
  if (!size) return { name: "inicio" };

  switch (section) {
    case "alumnos":
      if (size === 1) return { name: "alumnos" };
      if (size === 2)
        return a === "nuevo" ? { name: "alumno-nuevo" } : { name: "alumno", studentId: a };
      if (size === 3 && b === "editar") return { name: "alumno-editar", studentId: a };
      if (size === 3 && b === "notas") return { name: "notas", studentId: a };
      if (size === 4 && b === "notas" && c === "nueva") return { name: "nota-nueva", studentId: a };
      if (size === 5 && b === "notas" && d === "editar")
        return { name: "nota-editar", studentId: a, noteId: c };
      break;
    case "clases":
      if (size === 1) return { name: "clases", view: "day", date: param("fecha") };
      if (a === "grupos") {
        if (size === 2) return { name: "clases", view: "groups" };
        if (size === 3 && b === "nuevo") return { name: "grupo-nuevo" };
        if (size === 4 && c === "editar") return { name: "grupo-editar", groupId: b };
      }
      if (a === "sesiones" && b) {
        if (size === 3) return { name: "sesion", sessionId: b };
        if (size === 6 && c === "alumnos" && parts[5] === "nota")
          return { name: "sesion-nota", sessionId: b, studentId: d };
      }
      break;
    case "pagos":
      if (size === 1) return { name: "pagos", tab: "cobros" };
      if (size === 2 && a === "registrar-pago")
        return { name: "pago-nuevo", tab: "cobros", chargeId: param("cargo") };
      if (a === "saldos") {
        if (size === 2) return { name: "pagos", tab: "saldos", due: param("vencimiento") };
        if (size === 3 && b === "registrar-pago")
          return { name: "pago-nuevo", tab: "saldos", chargeId: param("cargo") };
      }
      if (a === "pedidos") {
        if (size === 2) return { name: "pagos", tab: "pedidos" };
        if (size === 3)
          return b === "nuevo" ? { name: "pedido-nuevo" } : { name: "pedido", orderId: b };
      }
      break;
    case "examenes":
    case "reportes":
    case "configuracion":
      if (size === 1) return { name: section };
      break;
  }
  return { name: "no-encontrada" };
}
