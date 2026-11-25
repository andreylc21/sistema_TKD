// URL de cada pantalla. La jerarquía de la URL coincide con las migas de pan del encabezado.
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
  pagos: (due?: string, filters: { q?: string; progress?: string; all?: boolean } = {}) =>
    `/pagos${query({ vencimiento: due, q: filters.q, avance: filters.progress, todos: filters.all ? "1" : undefined })}`,
  pagoNuevo: (chargeId?: string, studentId?: string) =>
    `/pagos/registrar-pago${query({ cargo: chargeId, alumno: studentId })}`,
  pedidos: "/pedidos",
  pedidoNuevo: "/pedidos/nuevo",
  pedido: (orderId: string) => `/pedidos/${id(orderId)}`,
  examenes: "/examenes",
  examenNuevo: "/examenes/nuevo",
  reportes: "/reportes",
  configuracion: "/configuracion",
};
