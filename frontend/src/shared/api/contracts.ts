import type { components } from "./generated";

export type Grade = { id: string; name: string };
export type Student = {
  id: string;
  name: string;
  firstNames: string;
  lastNames: string;
  birthDate: string;
  age: number;
  minor: boolean;
  grade: string;
  gradeId: string;
  status: "Activo" | "Inactivo";
  email: string;
  emailOwner: string;
  primary: string;
  primaryName: string;
  primaryRelation: string;
  primaryPhone: string;
  emergency: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  restrictions: string;
  healthConsent: boolean;
  enrollmentDate: string;
  billingDay: number;
  groups: string[];
  notes: string[];
  version: number;
};
export type Note = {
  id: string;
  studentId: string;
  date: string;
  topic: string;
  text: string;
  sessionId?: string | null;
  version: number;
};
export type Group = {
  id: string;
  name: string;
  days: string[];
  time: string;
  minAge: number | null;
  maxAge: number | null;
  students: string[];
  /** Alumnos fuera del perfil de edad que la maestra decidió mantener en el grupo. */
  kept: string[];
  version: number;
};
export type Attendance = {
  studentId: string;
  status: "Presente" | "Ausente" | "Falta justificada" | "Sin registrar";
  observation: string;
  temporary?: boolean;
  version: number;
};
export type Session = {
  id: string;
  groupId: string;
  date: string;
  time: string;
  status: "Programada" | "Cancelada" | "Reprogramada";
  attendance: Attendance[];
  version: number;
};
export type Charge = {
  id: string;
  studentId: string;
  concept: string;
  category: string;
  original: number;
  discount: number;
  total: number;
  due: string;
};
export type Payment = {
  id: string;
  studentId: string;
  chargeId: string;
  date: string;
  amount: number;
  method: string;
  valid: boolean;
  reason: string;
  version: number;
};
export type OrderItem = {
  id: string;
  name: string;
  size: string;
  quantity: number;
  received: number;
  delivered: number;
  price: number;
  requested: boolean;
  cancelled: boolean;
  version: number;
};
export type Order = {
  id: string;
  uuid: string;
  studentId: string;
  items: OrderItem[];
  total: number;
  paid: number;
  status: string;
  version: number;
};
export type ExamEntry = {
  id: string;
  studentId: string;
  gradeFrom: string;
  gradeTo: string | null;
  result: "pending" | "passed" | "failed";
  reason: string;
  chargeId: string;
  /** Motivo con que la maestra autorizó continuar sin el pago; vacío si no hay excepción. */
  exception: string;
  owed: number;
  total: number;
};
export type Exam = {
  id: string;
  kind: "partial" | "black";
  date: string;
  fee: number;
  paymentDeadline: string;
  entries: ExamEntry[];
};
export type ExamProgress = {
  target: number;
  track: "poom" | "dan";
  partials: number;
  required: number;
  months: number | null;
  minMonths: number;
  ready: boolean;
  missing: string[];
};
export type Bootstrap = {
  school: { name: string; owner: string; fee: number };
  demoDate: string;
  demoMode?: boolean;
  csrfToken: string;
  grades: Grade[];
  students: Student[];
  notes: Note[];
  groups: Group[];
  sessions: Session[];
  charges: Charge[];
  payments: Payment[];
  orders: Order[];
  exams: Exam[];
  examProgress: Record<string, ExamProgress>;
};

// Los DTO de escritura vienen del contrato OpenAPI. Si el contrato cambia,
// TypeScript obliga a actualizar los consumidores antes de compilar.
export type LoginRequest = components["schemas"]["LoginRequest"];
export type SessionResponse = components["schemas"]["SessionResponse"];
export type StudentWrite = components["schemas"]["StudentWrite"];
export type StudentStatusWrite = components["schemas"]["StudentStatusWrite"];
export type NoteWrite = components["schemas"]["NoteWrite"];
export type GroupWrite = components["schemas"]["GroupWrite"];
export type MoveStudentWrite = components["schemas"]["MoveStudentWrite"];
export type KeepStudentWrite = components["schemas"]["KeepStudentWrite"];
export type AssignmentWrite = components["schemas"]["AssignmentWrite"];
export type ParticipantWrite = components["schemas"]["ParticipantWrite"];
export type SessionWrite = components["schemas"]["SessionWrite"];
export type SessionStatusWrite = components["schemas"]["SessionStatusWrite"];
export type AttendanceWrite = components["schemas"]["AttendanceWrite"];
export type PaymentWrite = components["schemas"]["PaymentWrite"];
export type VoidPaymentWrite = components["schemas"]["VoidPaymentWrite"];
export type DiscountWrite = components["schemas"]["DiscountWrite"];
export type ExamWrite = components["schemas"]["ExamWrite"];
export type ExamEnrollWrite = components["schemas"]["ExamEnrollWrite"];
export type ExamExceptionWrite = components["schemas"]["ExamExceptionWrite"];
export type ExamResultWrite = components["schemas"]["ExamResultWrite"];
export type OrderWrite = components["schemas"]["OrderWrite"];
export type OrderProgressWrite = components["schemas"]["OrderProgressWrite"];
export type OrderBulkProgressWrite = components["schemas"]["OrderBulkProgressWrite"];
export type ResourceCreated = components["schemas"]["ResourceCreated"];
