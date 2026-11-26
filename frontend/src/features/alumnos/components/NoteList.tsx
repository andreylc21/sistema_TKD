import type { Bootstrap, Note, Student } from "../../../shared/api/contracts";
import { date } from "../../../shared/lib/format";
import { ConfirmAction } from "../../../shared/ui/ConfirmAction";
import { DialogButton } from "../../../shared/ui/DialogButton";
import { editButtonClass, EditLabel } from "../../../shared/ui/EditButton";
import { deleteNote } from "../api/alumnos.api";
import { NoteForm } from "./NoteForm";

/** Notas de seguimiento con sus acciones. */
export function NoteList({
  data,
  student,
  notes,
  reload,
}: {
  data: Bootstrap;
  student: Student;
  notes: Note[];
  reload: () => Promise<void>;
}) {
  return (
    <ul className="list">
      {notes.map((note) => (
        <li className="list-row" key={note.id}>
          <div className="list-row-main">
            <strong>{note.topic}</strong>
            <span className="note-text long-text">{note.text}</span>
            {note.sessionId && (
              <span className="note-origin">{noteOrigin(data, note.sessionId)}</span>
            )}
          </div>
          <div className="list-row-value">
            <span className="nowrap">{date(note.date)}</span>
            <div className="inline-actions">
              <ConfirmAction
                label="Eliminar"
                title="Eliminar nota"
                onConfirm={async () => {
                  await deleteNote(note.id, note.version);
                  await reload();
                }}
              >
                Se eliminará la nota “{note.topic}” del expediente de {student.name}.
              </ConfirmAction>
              <DialogButton
                label={<EditLabel />}
                className={editButtonClass}
                title={`Editar nota · ${student.name}`}
              >
                {(close) => (
                  <NoteForm
                    studentId={student.id}
                    today={data.demoDate}
                    initial={note}
                    onCancel={close}
                    onSaved={async () => {
                      close();
                      await reload();
                    }}
                  />
                )}
              </DialogButton>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function noteOrigin(data: Bootstrap, sessionId: string) {
  const session = data.sessions.find((item) => item.id === sessionId);
  const group = data.groups.find((item) => item.id === session?.groupId);
  return session
    ? `Clase: ${group?.name ?? "Grupo"} · ${date(session.date)}`
    : "Creada desde una clase";
}
