import { useState } from "react";
import type { Bootstrap, Student } from "../../../shared/api/contracts";
import { date } from "../../../shared/lib/format";
import { Card } from "../../../shared/ui/Card";
import { DetailLayout } from "../../../shared/ui/DetailLayout";
import { EditButton } from "../../../shared/ui/EditButton";
import { Empty } from "../../../shared/ui/PageHeader";
import { RowList } from "../../../shared/ui/RowList";
import { Status } from "../../../shared/ui/Status";
import { AgeAlertRow } from "../../clases/components/AgeAlertRow";
import { activeGroups, ageAlerts } from "../../clases/model/clases.model";
import { examKindLabel, resultLabel, studentExams } from "../../examenes/model/examenes.model";
import { studentNotes } from "../model/alumnos.model";
import { StudentForm } from "../StudentForm";
import { AddNoteButton } from "./AddNoteButton";
import { NoteList } from "./NoteList";

const resultTone = { passed: "success", failed: "danger", pending: "neutral" } as const;

export function StudentDetail({
  data,
  student,
  reload,
  onChangeStatus,
}: {
  data: Bootstrap;
  student: Student;
  reload: () => Promise<void>;
  onChangeStatus: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const active = student.status === "Activo";
  const notes = studentNotes(data.notes, student.id);
  const alerts = ageAlerts(data.groups, data.students).filter(
    (alert) => alert.student.id === student.id,
  );
  const exams = studentExams(data.exams, student.id);

  return (
    <>
      {alerts.map((alert) => (
        <div key={alert.group.id} className="callout spacer-bottom">
          <strong>Ya no entra en {alert.group.name}</strong>
          <AgeAlertRow alert={alert} data={data} reload={reload} />
        </div>
      ))}
      <DetailLayout
        main={
          <Card
            title={student.name}
            padded
            actions={
              !editing && (
                <>
                  <button
                    className={`button small ${active ? "secondary danger" : "success"}`}
                    onClick={onChangeStatus}
                  >
                    {active ? "Desactivar" : "Reactivar"}
                  </button>
                  <EditButton
                    disabled={!active}
                    title={active ? undefined : "Reactiva al alumno para poder editarlo."}
                    onClick={() => setEditing(true)}
                  />
                </>
              )
            }
          >
            <StudentForm
              key={editing ? "edit" : "view"}
              readOnly={!editing}
              grades={data.grades}
              groups={activeGroups(data.groups)}
              today={data.demoDate}
              initial={student}
              onCancel={() => setEditing(false)}
              onSaved={async () => {
                await reload();
                setEditing(false);
              }}
            />
          </Card>
        }
        side={
          <>
            <Card
              title="Notas de seguimiento"
              actions={<AddNoteButton student={student} today={data.demoDate} reload={reload} />}
            >
              {notes.length ? (
                <NoteList data={data} student={student} notes={notes} reload={reload} />
              ) : (
                <Empty title="Sin notas" text="Todavía no hay notas de seguimiento." />
              )}
            </Card>
            <Card title="Exámenes">
              <RowList
                empty={{
                  title: "Sin exámenes",
                  text: "Todavía no se ha inscrito a ningún examen.",
                }}
                items={exams.map(({ exam, entry }) => ({
                  id: entry.id,
                  title: examKindLabel(exam.kind),
                  subtitle: `${date(exam.date)} · ${
                    entry.gradeTo ? `${entry.gradeFrom} → ${entry.gradeTo}` : entry.gradeFrom
                  }`,
                  value: (
                    <Status tone={resultTone[entry.result]}>{resultLabel[entry.result]}</Status>
                  ),
                }))}
              />
            </Card>
          </>
        }
      />
    </>
  );
}
