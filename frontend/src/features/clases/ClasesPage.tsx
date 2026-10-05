import { useRef, useState } from "react";
import type { Bootstrap, GroupWrite } from "../../shared/api/contracts";
import { date } from "../../shared/lib/format";
import { Dialog } from "../../shared/ui/Dialog";
import { Empty, Notice, PageHeader } from "../../shared/ui/PageHeader";
import { createGroup } from "./api/clases.api";
import { GroupForm } from "./components/GroupForm";
import { SessionDetail } from "./components/SessionDetail";
import { GroupActions } from "./GroupActions";

type View = "day" | "groups";

export function ClasesPage({
  data,
  reload,
  onStudent,
  initialSessionId,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  onStudent: (id: string) => void;
  initialSessionId?: string;
}) {
  const [view, setView] = useState<View>("day");
  const [selectedDate, setSelectedDate] = useState(data.demoDate);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(initialSessionId);
  const [error, setError] = useState("");
  const groupKey = useRef(crypto.randomUUID());
  const selectedSession = data.sessions.find((session) => session.id === selectedSessionId);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate);
  const daySessions = data.sessions
    .filter((session) => validDate && session.date === selectedDate)
    .sort((left, right) => left.time.localeCompare(right.time));

  async function addGroup(body: GroupWrite) {
    setError("");
    try {
      await createGroup(body, groupKey.current);
      groupKey.current = crypto.randomUUID();
      setShowGroupForm(false);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el grupo.");
    }
  }

  if (selectedSession) {
    return (
      <SessionDetail
        data={data}
        session={selectedSession}
        reload={reload}
        onBack={() => setSelectedSessionId(undefined)}
        onStudent={onStudent}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Clases"
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
            <button className="button" onClick={() => setShowGroupForm(true)}>
              Crear grupo
            </button>
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
          onClick={() => setView("day")}
        >
          Clases del día
        </button>
        <button
          id="tab-groups"
          className="tab"
          role="tab"
          aria-selected={view === "groups"}
          aria-controls="panel-clases"
          onClick={() => setView("groups")}
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
                  onChange={(event) => setSelectedDate(event.target.value)}
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
                      <th>Participantes</th>
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
                          <td>{session.time}</td>
                          <td>
                            <span
                              className={`badge ${session.status === "Programada" ? "light" : "warning"}`}
                            >
                              {session.status}
                            </span>
                          </td>
                          <td>Participantes: {session.attendance.length}</td>
                          <td>
                            <button
                              className="button secondary small"
                              onClick={() => setSelectedSessionId(session.id)}
                            >
                              {session.status === "Programada" && pending
                                ? "Pasar lista"
                                : "Abrir clase"}
                            </button>
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
                  <th>Asignaciones</th>
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
                    <td>{group.time}</td>
                    <td>Alumnos: {group.students.length}</td>
                    <td>
                      <GroupActions
                        group={group}
                        data={data}
                        reload={reload}
                        onSession={(id) => setSelectedSessionId(id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>

      {showGroupForm && (
        <Dialog title="Crear grupo" onClose={() => setShowGroupForm(false)}>
          {error && <Notice kind="error">{error}</Notice>}
          <GroupForm onSubmit={addGroup} onCancel={() => setShowGroupForm(false)} />
        </Dialog>
      )}
    </>
  );
}
