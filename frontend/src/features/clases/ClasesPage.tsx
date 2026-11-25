import { useState } from "react";
import type { Bootstrap } from "../../shared/api/contracts";
import { navigate } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { Link } from "../../shared/ui/Link";
import { Empty, PageHeader } from "../../shared/ui/PageHeader";
import { AgeAlertRow } from "./components/AgeAlertRow";
import { GroupActions } from "./GroupActions";
import { ageAlerts, ageLabel } from "./model/clases.model";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function ClasesPage({
  data,
  reload,
  initialDate,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  initialDate?: string;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate ?? data.demoDate);
  const [routeDate, setRouteDate] = useState(initialDate);
  if (initialDate !== routeDate) {
    // Un enlace a /clases sin fecha (menú, Inicio) vuelve a la fecha operativa.
    setRouteDate(initialDate);
    setSelectedDate(initialDate ?? data.demoDate);
  }
  const alerts = ageAlerts(data.groups, data.students);
  const validDate = isoDate.test(selectedDate);
  const daySessions = data.sessions
    .filter((session) => validDate && session.date === selectedDate)
    .sort((left, right) => left.time.localeCompare(right.time));

  function chooseDate(value: string) {
    setSelectedDate(value);
    // La fecha viaja en la URL para que "Atrás" desde una clase regrese al mismo día.
    if (isoDate.test(value)) navigate(paths.clases("day", value), { replace: true });
  }

  return (
    <>
      <PageHeader help="A la izquierda están los grupos y sus horarios; a la derecha, las clases de la fecha elegida para pasar lista." />
      <div className="clases-layout">
        <section className="card panel" aria-label="Grupos">
          <div className="panel-head">
            <h2>Grupos</h2>
            <Link className="button small" to={paths.grupoNuevo}>
              Crear grupo
            </Link>
          </div>
          {data.groups.length ? (
            <div className="group-cards">
              {data.groups.map((group) => (
                <article key={group.id} className="group-card">
                  <h3>{group.name}</h3>
                  <p className="group-schedule">
                    {group.days.join(", ")} · {group.time}
                  </p>
                  <p className="muted">
                    {ageLabel(group)} · {group.students.length}{" "}
                    {group.students.length === 1 ? "alumno" : "alumnos"}
                  </p>
                  {alerts.some((alert) => alert.group.id === group.id) && (
                    <details className="age-alerts">
                      <summary>
                        <span className="badge warning">
                          {alerts.filter((alert) => alert.group.id === group.id).length} fuera del
                          rango de edad
                        </span>
                      </summary>
                      {alerts
                        .filter((alert) => alert.group.id === group.id)
                        .map((alert) => (
                          <AgeAlertRow
                            key={alert.student.id}
                            alert={alert}
                            data={data}
                            reload={reload}
                          />
                        ))}
                    </details>
                  )}
                  <GroupActions group={group} data={data} reload={reload} />
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="Aún no hay grupos"
              text="Crea un grupo con su horario para asignar alumnos y programar clases."
            />
          )}
        </section>
        <aside className="card panel clases-day" aria-label="Clases de la fecha seleccionada">
          <div className="panel-head">
            <h2>Clases del día</h2>
          </div>
          <div className="field">
            <label htmlFor="class-date">Fecha de clases</label>
            <input
              id="class-date"
              type="date"
              value={selectedDate}
              onChange={(event) => chooseDate(event.target.value)}
            />
          </div>
          {daySessions.length ? (
            <ul className="session-list">
              {daySessions.map((session) => {
                const group = data.groups.find((item) => item.id === session.groupId);
                const pending = session.attendance.some(
                  (entry) => entry.status === "Sin registrar",
                );
                return (
                  <li key={session.id} className="session-card">
                    <div className="session-card-head">
                      <strong>{group?.name ?? "Grupo no disponible"}</strong>
                      <span
                        className={`badge ${session.status === "Programada" ? "light" : "warning"}`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <p className="muted">
                      {session.time} · {session.attendance.length}{" "}
                      {session.attendance.length === 1 ? "participante" : "participantes"}
                    </p>
                    <Link className="button secondary small" to={paths.sesion(session.id)}>
                      {session.status === "Programada" && pending ? "Pasar lista" : "Abrir clase"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty
              title={validDate ? "Sin clases en esta fecha" : "Falta la fecha"}
              text={
                validDate
                  ? "Programa una clase desde su grupo o elige otra fecha."
                  : "Escribe o selecciona una fecha completa."
              }
            />
          )}
        </aside>
      </div>
    </>
  );
}
