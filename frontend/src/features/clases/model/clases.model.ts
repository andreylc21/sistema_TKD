import type { Group, Session, Student } from "../../../shared/api/contracts";

/** "6 a 9 años", "Desde 16 años", "Hasta 9 años" o "Todas las edades". */
export function ageLabel(group: Pick<Group, "minAge" | "maxAge">) {
  const { minAge, maxAge } = group;
  if (minAge != null && maxAge != null) return `${minAge} a ${maxAge} años`;
  if (minAge != null) return `Desde ${minAge} años`;
  if (maxAge != null) return `Hasta ${maxAge} años`;
  return "Todas las edades";
}

export function ageFits(group: Pick<Group, "minAge" | "maxAge">, age: number) {
  return (
    (group.minAge == null || age >= group.minAge) && (group.maxAge == null || age <= group.maxAge)
  );
}

export type AgeAlert = { student: Student; group: Group; reason: string };

function reasonFor(group: Group, age: number) {
  const base = `tiene ${age} años y el grupo es `;
  if (group.maxAge != null && age > group.maxAge) return `${base}hasta ${group.maxAge}`;
  return `${base}desde ${group.minAge}`;
}

/** Alumnos activos fuera del perfil de edad de su grupo, salvo los que la maestra decidió mantener. */
/** Grupos en uso: los archivados solo se consultan en su historial. */
export const activeGroups = (groups: Group[]) => groups.filter((group) => !group.archived);

export function ageAlerts(groups: Group[], students: Student[]): AgeAlert[] {
  const byId = new Map(students.map((student) => [student.id, student]));
  return activeGroups(groups).flatMap((group) =>
    group.students.flatMap((id) => {
      const student = byId.get(id);
      if (!student || student.status !== "Activo" || group.kept.includes(id)) return [];
      return ageFits(group, student.age)
        ? []
        : [{ student, group, reason: reasonFor(group, student.age) }];
    }),
  );
}

const minutes = (clock: string) => {
  const [hours, mins] = clock.split(":").map(Number);
  return hours * 60 + mins;
};
const weekdayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/**
 * Otros grupos con clase a la misma hora que `group` el día `today`: los que ya tienen su clase
 * abierta ese día o los que la tienen en su horario semanal. Sirve para avisar, no para impedir.
 */
export function overlappingGroups(
  data: {
    groups: Group[];
    sessions: { groupId: string; date: string; time: string; status: string }[];
  },
  group: Group,
  today: string,
): Group[] {
  const [start, end] = group.time.split("–").map(minutes);
  const overlaps = (time: string) => {
    const [otherStart, otherEnd] = time.split("–").map(minutes);
    return start < otherEnd && otherStart < end;
  };
  const weekday = weekdayNames[new Date(`${today}T12:00:00`).getDay()];
  return activeGroups(data.groups).filter((other) => {
    if (other.id === group.id) return false;
    const opened = data.sessions.some(
      (session) =>
        session.groupId === other.id &&
        session.date === today &&
        session.status === "Programada" &&
        overlaps(session.time),
    );
    return opened || (other.days.includes(weekday) && overlaps(other.time));
  });
}

export type SessionPhase = Session["status"] | "En curso" | "Terminada";

const minutesOf = (clock: string) => {
  const [hours, mins] = clock.split(":").map(Number);
  return hours * 60 + mins;
};

/** Duración del horario de la clase en milisegundos ("17:00–18:00" → 1 h). */
const scheduledMs = (time: string) => {
  const [start, end] = time.split("–").map(minutesOf);
  return (end - start) * 60_000;
};

/** Momento en que la clase termina: el botón "Terminar" o, si nadie lo pulsó, su duración desde que se dio. */
export function sessionEnd(session: Session): number | null {
  if (session.endedAt) return new Date(session.endedAt).getTime();
  if (session.startedAt) return new Date(session.startedAt).getTime() + scheduledMs(session.time);
  return null;
}

/** Programada (aún no se da), En curso o Terminada; las canceladas y reprogramadas conservan su estado. */
export function sessionPhase(session: Session, now = Date.now()): SessionPhase {
  if (session.status !== "Programada") return session.status;
  const end = sessionEnd(session);
  if (end === null) return "Programada";
  return now >= end ? "Terminada" : "En curso";
}

const clock = (value: number) =>
  new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(value),
  );

/** Horario real ("17:05–18:00") si la clase ya se dio; si no, el programado. */
export function sessionHours(session: Session, now = Date.now()): string {
  if (!session.startedAt) return session.time;
  const end = sessionEnd(session);
  const started = new Date(session.startedAt).getTime();
  return end !== null && now >= end ? `${clock(started)}–${clock(end)}` : `Desde ${clock(started)}`;
}

/** Grupos activos que tienen clase el día de la semana de `today` según su horario. */
export function groupsOn(groups: Group[], today: string): Group[] {
  const weekday = weekdayNames[new Date(`${today}T12:00:00`).getDay()];
  return activeGroups(groups)
    .filter((group) => group.days.includes(weekday))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export type NextClass = { group: Group; date: string; session: Session | null };

const addDays = (day: string, count: number) => {
  const next = new Date(`${day}T12:00:00`);
  next.setDate(next.getDate() + count);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
};

/**
 * La siguiente clase según los horarios de los grupos, de hoy en adelante (hasta una semana).
 * Hoy cuenta mientras la clase no haya terminado; si ya se está dando, trae su sesión.
 */
export function nextClass(
  data: { groups: Group[]; sessions: Session[] },
  today: string,
  now = Date.now(),
): NextClass | null {
  for (let offset = 0; offset < 8; offset += 1) {
    const day = addDays(today, offset);
    for (const group of groupsOn(data.groups, day)) {
      const session =
        data.sessions.find(
          (item) =>
            item.groupId === group.id &&
            item.date === day &&
            item.status === "Programada" &&
            item.startedAt !== null,
        ) ?? null;
      if (session && sessionPhase(session, now) === "Terminada") continue;
      return { group, date: day, session };
    }
  }
  return null;
}
