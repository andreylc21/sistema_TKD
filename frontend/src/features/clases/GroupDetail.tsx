import { useState } from "react";
import type { Bootstrap, Group, GroupWrite } from "../../shared/api/contracts";
import { date } from "../../shared/lib/format";
import { paths } from "../../shared/lib/paths";
import { Link } from "../../shared/ui/Link";
import { Card } from "../../shared/ui/Card";
import { DetailLayout } from "../../shared/ui/DetailLayout";
import { EditButton } from "../../shared/ui/EditButton";
import { Notice } from "../../shared/ui/PageHeader";
import { RowList } from "../../shared/ui/RowList";
import { restoreGroup, updateGroup } from "./api/clases.api";
import { AgeAlertRow } from "./components/AgeAlertRow";
import { GroupForm } from "./components/GroupForm";
import { ArchiveGroupButton, AssignStudentButton, RemoveStudentButton } from "./GroupActions";
import { ageAlerts, sessionHours, sessionPhase } from "./model/clases.model";

/** Ficha del grupo: sus datos a la izquierda y, a la derecha, sus alumnos y sus clases. */
export function GroupDetail({
  data,
  group,
  reload,
}: {
  data: Bootstrap;
  group: Group;
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const alerts = ageAlerts(data.groups, data.students).filter(
    (alert) => alert.group.id === group.id,
  );
  const students = group.students
    .map((id) => data.students.find((student) => student.id === id))
    .filter((student) => student !== undefined)
    .sort((left, right) => left.name.localeCompare(right.name, "es"));

  // Historial: solo las clases que ya se dieron (hasta hoy); las futuras no cuentan todavía.
  const sessions = data.sessions
    .filter((session) => session.groupId === group.id && session.date <= data.demoDate)
    .sort((left, right) => right.date.localeCompare(left.date));

  async function save(body: GroupWrite) {
    setBusy(true);
    setError("");
    try {
      await updateGroup(group.id, body);
      await reload();
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el grupo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {group.archived && (
        <div className="callout spacer-bottom">
          <strong>Grupo archivado</strong>
          <span>
            No aparece en las listas ni recibe alumnos o clases. Su historial se conserva.
          </span>
        </div>
      )}
      {alerts.length > 0 && (
        <div className="callout spacer-bottom">
          <strong>
            {alerts.length} {alerts.length === 1 ? "alumno ya no entra" : "alumnos ya no entran"} en
            el rango de edad
          </strong>
          {alerts.map((alert) => (
            <AgeAlertRow key={alert.student.id} alert={alert} data={data} reload={reload} />
          ))}
        </div>
      )}
      <DetailLayout
        variant="columns"
        main={
          <Card
            title={group.name}
            padded
            actions={
              !editing &&
              (group.archived ? (
                <button
                  className="button small success"
                  onClick={async () => {
                    await restoreGroup(group.id, { version: group.version });
                    await reload();
                  }}
                >
                  Restaurar
                </button>
              ) : (
                <>
                  <ArchiveGroupButton group={group} reload={reload} />
                  <EditButton onClick={() => setEditing(true)} />
                </>
              ))
            }
          >
            {error && <Notice kind="error">{error}</Notice>}
            <GroupForm
              key={editing ? "edit" : "view"}
              readOnly={!editing}
              initial={group}
              busy={busy}
              onSubmit={save}
              onCancel={() => setEditing(false)}
            />
          </Card>
        }
        side={
          <Card
            title="Alumnos"
            actions={
              !group.archived && <AssignStudentButton group={group} data={data} reload={reload} />
            }
          >
            <RowList
              empty={{
                title: "Sin alumnos",
                text: "Todavía no hay alumnos asignados a este grupo.",
              }}
              items={students.map((student) => ({
                id: student.id,
                title: student.name,
                subtitle: `${student.age} años · ${student.grade}`,
                actions: (
                  <>
                    <Link className="button secondary small" to={paths.alumno(student.id)}>
                      Ver ficha
                    </Link>
                    <RemoveStudentButton
                      group={group}
                      studentId={student.id}
                      studentName={student.name}
                      today={data.demoDate}
                      reload={reload}
                    />
                  </>
                ),
              }))}
            />
          </Card>
        }
        wide={
          <Card title="Clases">
            <RowList
              empty={{ title: "Sin clases", text: "Todavía no se ha dado ninguna clase." }}
              items={sessions.map((session) => ({
                id: session.id,
                title: date(session.date),
                subtitle: `${sessionHours(session)} · ${sessionPhase(session)}`,
                actions: (
                  <Link className="button secondary small" to={paths.sesion(group.id, session.id)}>
                    Abrir clase
                  </Link>
                ),
              }))}
            />
          </Card>
        }
      />
    </>
  );
}
