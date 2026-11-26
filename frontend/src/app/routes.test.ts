import { describe, expect, it } from "vitest";
import { paths } from "../shared/lib/paths";
import { matchRoute } from "./routes";

describe("matchRoute", () => {
  it("interpreta cada URL que construyen los enlaces", () => {
    expect(matchRoute(paths.inicio)).toEqual({ name: "inicio" });
    expect(matchRoute(paths.alumnoNuevo)).toEqual({ name: "alumno-nuevo" });
    expect(matchRoute(paths.alumno("s1"))).toEqual({ name: "alumno", studentId: "s1" });
    expect(matchRoute(paths.alumnoEditar("s1"))).toEqual({
      name: "alumno-editar",
      studentId: "s1",
    });
    expect(matchRoute(paths.grupoNuevo)).toEqual({ name: "grupo-nuevo" });
    expect(matchRoute(paths.grupos)).toEqual({ name: "grupos" });
    expect(matchRoute(paths.grupo("g1"))).toEqual({ name: "grupo", groupId: "g1" });
    expect(matchRoute("/clases/grupos")).toEqual({ name: "grupos" });
    expect(matchRoute("/clases/grupos/g1/editar")).toEqual({ name: "grupo", groupId: "g1" });
    expect(matchRoute(paths.sesion("g1", "c1"))).toEqual({ name: "sesion", sessionId: "c1" });
    expect(matchRoute("/clases/sesiones/c1")).toEqual({ name: "sesion", sessionId: "c1" });
    expect(matchRoute(paths.pedidoNuevo)).toEqual({ name: "pedido-nuevo" });
    expect(matchRoute("/pedidos/P-102")).toEqual({ name: "pedidos" });
    expect(matchRoute(paths.reportes)).toEqual({ name: "reportes" });
  });

  it("conserva la vista y los filtros que viajan en la URL", () => {
    expect(matchRoute("/clases?fecha=2026-10-05")).toEqual({ name: "grupos" });
    expect(matchRoute(paths.pagos("Por vencer"))).toEqual({
      name: "pagos",
      due: "Por vencer",
    });
    expect(matchRoute(paths.pagos("Vencido", { q: "ana", progress: "Pagado" }))).toEqual({
      name: "pagos",
      due: "Vencido",
      q: "ana",
      progress: "Pagado",
    });
    expect(matchRoute(paths.pagos(undefined, { all: true }))).toEqual({
      name: "pagos",
      all: true,
    });
    expect(matchRoute("/pagos/saldos")).toMatchObject({ name: "pagos" });
    expect(matchRoute("/pagos/pedidos")).toEqual({ name: "pedidos" });
    expect(matchRoute(paths.pedidos)).toEqual({ name: "pedidos" });
    expect(matchRoute(paths.pagoNuevo(undefined, "s1"))).toEqual({
      name: "pago-nuevo",
      chargeId: undefined,
      studentId: "s1",
    });
    expect(matchRoute(paths.pagoNuevo("c9"))).toEqual({ name: "pago-nuevo", chargeId: "c9" });
    expect(matchRoute(paths.pagoNuevo())).toEqual({ name: "pago-nuevo", chargeId: undefined });
  });

  it("decodifica identificadores y rechaza rutas desconocidas", () => {
    expect(matchRoute(paths.alumno("A/01"))).toEqual({ name: "alumno", studentId: "A/01" });
    expect(matchRoute(paths.examenes)).toEqual({ name: "examenes" });
    expect(matchRoute(paths.examenNuevo)).toEqual({ name: "examen-nuevo" });
    expect(matchRoute(paths.examenEditar("x"))).toEqual({ name: "examen-editar", examId: "x" });
    expect(matchRoute("/desconocida")).toEqual({ name: "no-encontrada" });
    expect(matchRoute("/alumnos/s1/otra")).toEqual({ name: "no-encontrada" });
  });
});
