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
    expect(matchRoute(paths.notas("s1"))).toEqual({ name: "notas", studentId: "s1" });
    expect(matchRoute(paths.notaNueva("s1"))).toEqual({ name: "nota-nueva", studentId: "s1" });
    expect(matchRoute(paths.notaEditar("s1", "n1"))).toEqual({
      name: "nota-editar",
      studentId: "s1",
      noteId: "n1",
    });
    expect(matchRoute(paths.grupoNuevo)).toEqual({ name: "grupo-nuevo" });
    expect(matchRoute(paths.grupoEditar("g1"))).toEqual({ name: "grupo-editar", groupId: "g1" });
    expect(matchRoute(paths.sesion("c1"))).toEqual({ name: "sesion", sessionId: "c1" });
    expect(matchRoute(paths.sesionNota("c1", "s1"))).toEqual({
      name: "sesion-nota",
      sessionId: "c1",
      studentId: "s1",
    });
    expect(matchRoute(paths.pedidoNuevo)).toEqual({ name: "pedido-nuevo" });
    expect(matchRoute(paths.pedido("o1"))).toEqual({ name: "pedido", orderId: "o1" });
    expect(matchRoute(paths.reportes)).toEqual({ name: "reportes" });
  });

  it("conserva la vista y los filtros que viajan en la URL", () => {
    expect(matchRoute(paths.clases("day", "2026-10-05"))).toEqual({
      name: "clases",
      view: "day",
      date: "2026-10-05",
    });
    expect(matchRoute(paths.clases("groups"))).toEqual({ name: "clases", view: "groups" });
    expect(matchRoute(paths.pagos("saldos", "Por vencer"))).toEqual({
      name: "pagos",
      tab: "saldos",
      due: "Por vencer",
    });
    expect(matchRoute(paths.pagoNuevo("saldos", "c9"))).toEqual({
      name: "pago-nuevo",
      tab: "saldos",
      chargeId: "c9",
    });
    expect(matchRoute(paths.pagoNuevo())).toEqual({
      name: "pago-nuevo",
      tab: "cobros",
      chargeId: undefined,
    });
  });

  it("decodifica identificadores y rechaza rutas desconocidas", () => {
    expect(matchRoute(paths.pedido("P/01"))).toEqual({ name: "pedido", orderId: "P/01" });
    expect(matchRoute("/desconocida")).toEqual({ name: "no-encontrada" });
    expect(matchRoute("/alumnos/s1/otra")).toEqual({ name: "no-encontrada" });
  });
});
