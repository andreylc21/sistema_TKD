import { useState } from "react";
import type { Bootstrap, Note } from "../../shared/api/contracts";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Dialog } from "../../shared/ui/Dialog";
import { PageHeader } from "../../shared/ui/PageHeader";
import { changeStudentStatus, deleteNote } from "./api/alumnos.api";
import { NoteForm } from "./components/NoteForm";
import { StudentDetail } from "./components/StudentDetail";
import { StudentList } from "./components/StudentList";
import { StudentForm } from "./StudentForm";

type DialogName = "new" | "edit" | "note" | "status" | null;

export function AlumnosPage({
  data,
  reload,
  focusStudentId,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  focusStudentId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(focusStudentId ?? null);
  const [dialog, setDialog] = useState<DialogName>(null);
  const [noteDraft, setNoteDraft] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const selected = data.students.find((student) => student.id === selectedId) ?? null;

  function closeNoteDialog() {
    setDialog(null);
    setNoteDraft(null);
  }

  async function toggleStatus(effectiveDate: string) {
    if (!selected) return;
    await changeStudentStatus(selected.id, {
      status: selected.status === "Activo" ? "inactive" : "active",
      date: effectiveDate,
      version: selected.version,
    });
    setDialog(null);
    await reload();
  }

  async function removeNote(note: Note) {
    await deleteNote(note.id, note.version);
    setNoteToDelete(null);
    await reload();
  }

  if (selected) {
    return (
      <>
        <StudentDetail
          data={data}
          student={selected}
          onBack={() => setSelectedId(null)}
          onEdit={() => setDialog("edit")}
          onAddNote={() => {
            setNoteDraft(null);
            setDialog("note");
          }}
          onEditNote={(note) => {
            setNoteDraft(note);
            setDialog("note");
          }}
          onDeleteNote={setNoteToDelete}
          onChangeStatus={() => setDialog("status")}
        />
        {dialog === "status" && (
          <ConfirmDialog
            title={selected.status === "Activo" ? "Desactivar alumno" : "Reactivar alumno"}
            confirmLabel={selected.status === "Activo" ? "Desactivar" : "Reactivar"}
            danger={selected.status === "Activo"}
            field={{
              label:
                selected.status === "Activo"
                  ? "Fecha de desactivación"
                  : "Fecha de reinicio de cobros",
              type: "date",
              initial: data.demoDate,
              help:
                selected.status === "Activo"
                  ? "Desde esta fecha dejan de generarse mensualidades."
                  : "Desde esta fecha se vuelven a generar mensualidades.",
            }}
            onConfirm={toggleStatus}
            onCancel={() => setDialog(null)}
          >
            {selected.name}
          </ConfirmDialog>
        )}
        {noteToDelete && (
          <ConfirmDialog
            title="Eliminar nota"
            confirmLabel="Eliminar nota"
            danger
            onConfirm={() => removeNote(noteToDelete)}
            onCancel={() => setNoteToDelete(null)}
          >
            Se eliminará la nota “{noteToDelete.topic}” del expediente de {selected.name}.
          </ConfirmDialog>
        )}
        {dialog === "edit" && (
          <Dialog title="Editar expediente" onClose={() => setDialog(null)}>
            <StudentForm
              grades={data.grades}
              today={data.demoDate}
              initial={selected}
              onCancel={() => setDialog(null)}
              onSaved={async () => {
                setDialog(null);
                await reload();
              }}
            />
          </Dialog>
        )}
        {dialog === "note" && (
          <Dialog title={noteDraft ? "Editar nota" : "Agregar nota"} onClose={closeNoteDialog}>
            <NoteForm
              studentId={selected.id}
              today={data.demoDate}
              initial={noteDraft ?? undefined}
              onCancel={closeNoteDialog}
              onSaved={async () => {
                closeNoteDialog();
                await reload();
              }}
            />
          </Dialog>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Alumnos"
        help="Consulta alumnos activos e inactivos y administra su expediente."
        actions={
          <button className="button" onClick={() => setDialog("new")}>
            Registrar alumno
          </button>
        }
      />
      <StudentList students={data.students} onSelect={setSelectedId} />
      {dialog === "new" && (
        <Dialog title="Registrar alumno" onClose={() => setDialog(null)}>
          <StudentForm
            grades={data.grades}
            today={data.demoDate}
            onCancel={() => setDialog(null)}
            onSaved={async () => {
              setDialog(null);
              await reload();
            }}
          />
        </Dialog>
      )}
    </>
  );
}
