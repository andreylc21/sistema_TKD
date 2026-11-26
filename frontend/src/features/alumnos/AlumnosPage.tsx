import { useState } from "react";
import type { Bootstrap, Student } from "../../shared/api/contracts";
import { goBack } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { FormScreen } from "../../shared/ui/FormScreen";
import { Link } from "../../shared/ui/Link";
import { PageHeader } from "../../shared/ui/PageHeader";
import { changeStudentStatus } from "./api/alumnos.api";
import { StudentDetail } from "./components/StudentDetail";
import { StudentList } from "./components/StudentList";
import { activeGroups } from "../clases/model/clases.model";
import { StudentForm } from "./StudentForm";

export function AlumnosPage({ data }: { data: Bootstrap }) {
  return (
    <>
      <PageHeader help="Consulta alumnos activos e inactivos y administra su expediente." />
      <StudentList
        students={data.students}
        grades={data.grades}
        groups={data.groups}
        action={
          <Link className="button" to={paths.alumnoNuevo}>
            Registrar alumno
          </Link>
        }
      />
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

  // El cambio de estado cuenta desde hoy: no se pide fecha.
  async function toggleStatus() {
    await changeStudentStatus(student.id, {
      status: active ? "inactive" : "active",
      date: data.demoDate,
      version: student.version,
    });
    setChangingStatus(false);
    await reload();
  }

  return (
    <>
      {active && !data.groups.some((group) => group.students.includes(student.id)) && (
        <div className="callout spacer-bottom">
          <strong>Sin horario</strong>
          <span>
            Este alumno no está en ningún grupo. Asígnale uno desde{" "}
            <Link to={paths.grupos}>Grupos</Link>.
          </span>
        </div>
      )}
      <StudentDetail
        data={data}
        student={student}
        reload={reload}
        onChangeStatus={() => setChangingStatus(true)}
      />
      {changingStatus && (
        <ConfirmDialog
          title={active ? "Desactivar alumno" : "Reactivar alumno"}
          onConfirm={toggleStatus}
          onCancel={() => setChangingStatus(false)}
        >
          {active
            ? `${student.name} dejará de generar mensualidades desde hoy y saldrá de sus grupos. Podrás reactivarlo cuando regrese.`
            : `${student.name} volverá a generar mensualidades desde hoy. Quedará sin horario hasta que le asignes uno.`}
        </ConfirmDialog>
      )}
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
    <>
      <PageHeader
        help={
          student
            ? "Actualiza los datos del expediente. Los campos con * son obligatorios; la fecha de inscripción no se puede cambiar."
            : "Registra a un alumno nuevo. Los campos con * son obligatorios; el correo y los datos de salud son opcionales."
        }
      />
      <FormScreen title="Datos del alumno">
        <StudentForm
          grades={data.grades}
          groups={activeGroups(data.groups)}
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
    </>
  );
}
