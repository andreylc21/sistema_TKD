// URL de cada pantalla. La jerarquía de la URL coincide con las migas de pan del encabezado.
export type PaymentsTab = "cobros" | "saldos" | "pedidos";
export type ClassesView = "day" | "groups";

const id = (value: string) => encodeURIComponent(value);
const query = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString();
  return search ? `?${search}` : "";
};

export const paths = {
  inicio: "/",
  alumnos: "/alumnos",
  alumnoNuevo: "/alumnos/nuevo",
  alumno: (studentId: string) => `/alumnos/${id(studentId)}`,
  alumnoEditar: (studentId: string) => `/alumnos/${id(studentId)}/editar`,
  notas: (studentId: string) => `/alumnos/${id(studentId)}/notas`,
  notaNueva: (studentId: string) => `/alumnos/${id(studentId)}/notas/nueva`,
  notaEditar: (studentId: string, noteId: string) =>
    `/alumnos/${id(studentId)}/notas/${id(noteId)}/editar`,
  clases: (view: ClassesView = "day", date?: string) =>
    view === "groups" ? "/clases/grupos" : `/clases${query({ fecha: date })}`,
  grupoNuevo: "/clases/grupos/nuevo",
  grupoEditar: (groupId: string) => `/clases/grupos/${id(groupId)}/editar`,
  sesion: (sessionId: string) => `/clases/sesiones/${id(sessionId)}`,
  sesionNota: (sessionId: string, studentId: string) =>
    `/clases/sesiones/${id(sessionId)}/alumnos/${id(studentId)}/nota`,
  pagos: (tab: PaymentsTab = "cobros", due?: string) =>
    `${tab === "cobros" ? "/pagos" : `/pagos/${tab}`}${query({ vencimiento: due })}`,
  pagoNuevo: (tab: Exclude<PaymentsTab, "pedidos"> = "cobros", chargeId?: string) =>
    `${tab === "cobros" ? "/pagos" : `/pagos/${tab}`}/registrar-pago${query({ cargo: chargeId })}`,
  pedidoNuevo: "/pagos/pedidos/nuevo",
  pedido: (orderId: string) => `/pagos/pedidos/${id(orderId)}`,
  examenes: "/examenes",
  reportes: "/reportes",
  configuracion: "/configuracion",
};
