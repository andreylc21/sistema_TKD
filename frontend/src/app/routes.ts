// Interpreta las URL que construye `shared/lib/paths`. Es puro para poder probarlo sin navegador.
export type Route =
  | { name: "inicio" }
  | { name: "alumnos" }
  | { name: "alumno-nuevo" }
  | { name: "alumno"; studentId: string }
  | { name: "alumno-editar"; studentId: string }
  | { name: "grupos" }
  | { name: "grupo-nuevo" }
  | { name: "grupo"; groupId: string }
  | { name: "sesion"; sessionId: string }
  | { name: "pagos"; due?: string; q?: string; progress?: string; all?: boolean }
  | { name: "pago-nuevo"; chargeId?: string; studentId?: string }
  | { name: "pedidos" }
  | { name: "pedido-nuevo" }
  | { name: "examenes" }
  | { name: "examen-nuevo" }
  | { name: "examen"; examId: string; enroll?: boolean }
  | { name: "examen-editar"; examId: string }
  | { name: "reportes" }
  | { name: "configuracion" }
  | { name: "no-encontrada" };

export function matchRoute(url: string): Route {
  const { pathname, searchParams } = new URL(url, "http://local");
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const param = (name: string) => searchParams.get(name) || undefined;
  const [section, a, b, c] = parts;
  const size = parts.length;
  if (!size) return { name: "inicio" };

  switch (section) {
    case "alumnos":
      if (size === 1) return { name: "alumnos" };
      if (size === 2)
        return a === "nuevo" ? { name: "alumno-nuevo" } : { name: "alumno", studentId: a };
      if (size === 3 && b === "editar") return { name: "alumno-editar", studentId: a };
      break;
    case "grupos":
      if (size === 1) return { name: "grupos" };
      if (size === 2)
        return a === "nuevo" ? { name: "grupo-nuevo" } : { name: "grupo", groupId: a };
      if (b === "clases") {
        if (size === 4) return { name: "sesion", sessionId: c };
      }
      break;
    // Las URL antiguas de Clases siguen abriendo las pantallas nuevas.
    case "clases":
      if (size === 1) return { name: "grupos" };
      if (a === "grupos") {
        if (size === 2) return { name: "grupos" };
        if (size === 3 && b === "nuevo") return { name: "grupo-nuevo" };
        if (size === 4 && c === "editar") return { name: "grupo", groupId: b };
      }
      if (a === "sesiones" && b) {
        if (size === 3) return { name: "sesion", sessionId: b };
      }
      break;
    case "pagos":
      // Las URL antiguas de "saldos" siguen abriendo la lista de cobros.
      if (size === 1 || (a === "saldos" && size === 2))
        return {
          name: "pagos",
          due: param("vencimiento"),
          q: param("q"),
          progress: param("avance"),
          ...(param("todos") === "1" ? { all: true } : {}),
        };
      if (
        (size === 2 && a === "registrar-pago") ||
        (size === 3 && a === "saldos" && b === "registrar-pago")
      )
        return { name: "pago-nuevo", chargeId: param("cargo"), studentId: param("alumno") };
      // Los pedidos ya no cuelgan de Pagos; estas rutas antiguas siguen funcionando.
      if (a === "pedidos") {
        if (size === 2) return { name: "pedidos" };
        if (size === 3) return b === "nuevo" ? { name: "pedido-nuevo" } : { name: "pedidos" };
      }
      break;
    case "pedidos":
      if (size === 1) return { name: "pedidos" };
      if (size === 2) return a === "nuevo" ? { name: "pedido-nuevo" } : { name: "pedidos" };
      break;
    case "examenes":
      if (size === 1) return { name: "examenes" };
      if (size === 2)
        return a === "nuevo"
          ? { name: "examen-nuevo" }
          : { name: "examen", examId: a, enroll: param("inscribir") === "1" };
      if (size === 3 && b === "editar") return { name: "examen-editar", examId: a };
      break;
    case "reportes":
    case "configuracion":
      if (size === 1) return { name: section };
      break;
  }
  return { name: "no-encontrada" };
}
