import { useState } from "react";
import type { Bootstrap } from "../../shared/api/contracts";
import { date } from "../../shared/lib/format";
import { navigate } from "../../shared/lib/navigation";
import { paths, type ClassesView } from "../../shared/lib/paths";
import { Link } from "../../shared/ui/Link";
import { Empty, PageHeader } from "../../shared/ui/PageHeader";
import { GroupActions } from "./GroupActions";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function ClasesPage({
  data,
  reload,
  view,
  initialDate,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  view: ClassesView;
  initialDate?: string;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate ?? data.demoDate);
  const [routeDate, setRouteDate] = useState(initialDate);
  if (view === "day" && initialDate !== routeDate) {
    // Un enlace a /clases sin fecha (menú, Inicio) vuelve a la fecha operativa.
    setRouteDate(initialDate);
    setSelectedDate(initialDate ?? data.demoDate);
  }
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
      <PageHeader
        help="Consulta una clase por fecha para pasar lista, o administra los grupos y sus horarios recurrentes."
        context={
          view === "day"
            ? validDate
              ? `Fecha seleccionada: ${date(selectedDate)}`
              : "Elige una fecha para consultar las clases."
            : undefined
        }
        actions={
          view === "groups" ? (
            <Link className="button" to={paths.grupoNuevo}>
              Crear grupo
            </Link>
          ) : undefined
        }
      />
      <div className="tabs" role="tablist" aria-label="Vistas de clases">
        <button
          id="tab-day"
          className="tab"
          role="tab"
          aria-selected={view === "day"}
          aria-controls="panel-clases"
          onClick={() =>
            navigate(paths.clases("day", validDate ? selectedDate : undefined), { replace: true })
          }
        >
          Clases del día
        </button>
        <button
          id="tab-groups"
          className="tab"
          role="tab"
          aria-selected={view === "groups"}
          aria-controls="panel-clases"
          onClick={() => navigate(paths.clases("groups"), { replace: true })}
        >
          Grupos y horarios
        </button>
      </div>

      <div id="panel-clases" role="tabpanel" aria-labelledby={`tab-${view}`}>
        {view === "day" ? (
          <section aria-label="Clases de la fecha seleccionada">
            <div className="toolbar">
              <div className="field compact">
                <label htmlFor="class-date">Fecha de clases</label>
                <input
                  id="class-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => chooseDate(event.target.value)}
                />
              </div>
              <p className="results-meta">
                <strong>{daySessions.length}</strong>{" "}
                {daySessions.length === 1 ? "clase" : "clases"}
              </p>
            </div>
            {daySessions.length ? (
              <div className="table-surface table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Grupo</th>
                      <th>Horario</th>
                      <th>Estado</th>
                      <th className="num">Participantes</th>
                      <th>
                        <span className="sr-only">Acción</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {daySessions.map((session) => {
                      const group = data.groups.find((item) => item.id === session.groupId);
                      const pending = session.attendance.some(
                        (entry) => entry.status === "Sin registrar",
                      );
                      return (
                        <tr key={session.id}>
                          <td className="primary-cell">
                            <strong>{group?.name ?? "Grupo no disponible"}</strong>
                            <span>{date(session.date)}</span>
                          </td>
                          <td className="nowrap">{session.time}</td>
                          <td>
                            <span
                              className={`badge ${session.status === "Programada" ? "light" : "warning"}`}
                            >
                              {session.status}
                            </span>
                          </td>
                          <td className="num">{session.attendance.length}</td>
                          <td>
                            <Link className="button secondary small" to={paths.sesion(session.id)}>
                              {session.status === "Programada" && pending
                                ? "Pasar lista"
                                : "Abrir clase"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card">
                <Empty
                  title={validDate ? "Sin clases en esta fecha" : "Falta la fecha"}
                  text={
                    validDate
                      ? "Programa una clase desde Grupos y horarios o elige otra fecha."
                      : "Escribe o selecciona una fecha completa."
                  }
                />
              </div>
            )}
          </section>
        ) : (
          <section className="table-surface table-wrap" aria-label="Grupos y horarios">
            <table>
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Días</th>
                  <th>Horario</th>
                  <th className="num">Alumnos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <strong>{group.name}</strong>
                    </td>
                    <td>{group.days.join(", ")}</td>
                    <td className="nowrap">{group.time}</td>
                    <td className="num">{group.students.length}</td>
                    <td>
                      <GroupActions group={group} data={data} reload={reload} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </>
  );
}
