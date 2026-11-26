// URL de cada pantalla. La jerarquía de la URL coincide con las migas de pan del encabezado.
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
  grupos: "/grupos",
  grupoNuevo: "/grupos/nuevo",
  grupo: (groupId: string) => `/grupos/${id(groupId)}`,
  sesion: (groupId: string, sessionId: string) => `/grupos/${id(groupId)}/clases/${id(sessionId)}`,
  pagos: (due?: string, filters: { q?: string; progress?: string; all?: boolean } = {}) =>
    `/pagos${query({ vencimiento: due, q: filters.q, avance: filters.progress, todos: filters.all ? "1" : undefined })}`,
  pagoNuevo: (chargeId?: string, studentId?: string) =>
    `/pagos/registrar-pago${query({ cargo: chargeId, alumno: studentId })}`,
  pedidos: "/pedidos",
  pedidoNuevo: "/pedidos/nuevo",
  examenes: "/examenes",
  examenNuevo: "/examenes/nuevo",
  examenEditar: (examId: string) => `/examenes/${id(examId)}/editar`,
  reportes: "/reportes",
  configuracion: "/configuracion",
};
