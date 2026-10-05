import { useState } from "react";
import type { Bootstrap, Note, Student } from "../../shared/api/contracts";
import { goBack } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { FormScreen } from "../../shared/ui/FormScreen";
import { Link } from "../../shared/ui/Link";
import { Empty, PageHeader } from "../../shared/ui/PageHeader";
import { changeStudentStatus } from "./api/alumnos.api";
import { NoteForm } from "./components/NoteForm";
import { NoteList } from "./components/NoteList";
import { StudentDetail } from "./components/StudentDetail";
import { StudentList } from "./components/StudentList";
import { studentNotes } from "./model/alumnos.model";
import { StudentForm } from "./StudentForm";

export function AlumnosPage({ data }: { data: Bootstrap }) {
  return (
    <>
      <PageHeader
        help="Consulta alumnos activos e inactivos y administra su expediente."
        actions={
          <Link className="button" to={paths.alumnoNuevo}>
            Registrar alumno
          </Link>
        }
      />
      <StudentList students={data.students} />
    </>
  );
}

export function StudentRecordPage({
  data,
  student,
  reload,
}: {
  data: Bootstrap;
  student: Student;
  reload: () => Promise<void>;
}) {
  const [changingStatus, setChangingStatus] = useState(false);
  const active = student.status === "Activo";

  async function toggleStatus(effectiveDate: string) {
    await changeStudentStatus(student.id, {
      status: active ? "inactive" : "active",
      date: effectiveDate,
      version: student.version,
    });
    setChangingStatus(false);
    await reload();
  }

  return (
    <>
      <StudentDetail
        data={data}
        student={student}
        reload={reload}
        onChangeStatus={() => setChangingStatus(true)}
      />
      {changingStatus && (
        <ConfirmDialog
          title={active ? "Desactivar alumno" : "Reactivar alumno"}
          confirmLabel={active ? "Desactivar" : "Reactivar"}
          danger={active}
          field={{
            label: active ? "Fecha de desactivación" : "Fecha de reinicio de cobros",
            type: "date",
            initial: data.demoDate,
            help: active
              ? "Desde esta fecha dejan de generarse mensualidades."
              : "Desde esta fecha se vuelven a generar mensualidades.",
          }}
          onConfirm={toggleStatus}
          onCancel={() => setChangingStatus(false)}
        >
          {student.name}
        </ConfirmDialog>
      )}
    </>
  );
}

export function StudentNotesPage({
  data,
  student,
  reload,
}: {
  data: Bootstrap;
  student: Student;
  reload: () => Promise<void>;
}) {
  const notes = studentNotes(data.notes, student.id);
  return (
    <>
      <PageHeader
        help="Todas las notas de seguimiento del expediente, de la más reciente a la más antigua."
        context={`${notes.length} ${notes.length === 1 ? "nota" : "notas"}`}
        actions={
          <Link className="button" to={paths.notaNueva(student.id)}>
            Agregar nota
          </Link>
        }
      />
      <section className="card">
        {notes.length ? (
          <NoteList data={data} student={student} notes={notes} reload={reload} />
        ) : (
          <Empty title="Sin notas" text="Todavía no hay notas de seguimiento." />
        )}
      </section>
    </>
  );
}

export function StudentFormPage({
  data,
  student,
  reload,
}: {
  data: Bootstrap;
  student?: Student;
  reload: () => Promise<void>;
}) {
  const parent = student ? paths.alumno(student.id) : paths.alumnos;
  return (
    <FormScreen>
      <StudentForm
        grades={data.grades}
        today={data.demoDate}
        initial={student}
        onCancel={() => goBack(parent)}
        onSaved={async () => {
          await reload();
          goBack(parent, {
            notice: student ? "Expediente actualizado." : "Alumno registrado.",
            force: true,
          });
        }}
      />
    </FormScreen>
  );
}

export function NoteFormPage({
  data,
  student,
  note,
  sessionId,
  parent,
  reload,
}: {
  data: Bootstrap;
  student: Student;
  note?: Note;
  sessionId?: string;
  parent: string;
  reload: () => Promise<void>;
}) {
  return (
    <FormScreen>
      <NoteForm
        studentId={student.id}
        today={data.demoDate}
        initial={note}
        sessionId={sessionId}
        onCancel={() => goBack(parent)}
        onSaved={async () => {
          await reload();
          goBack(parent, {
            notice: sessionId ? "Nota de seguimiento guardada en el expediente." : "Nota guardada.",
            force: true,
          });
        }}
      />
    </FormScreen>
  );
}
