import { useState } from "react";
import type { Bootstrap, Note, Student } from "../../../shared/api/contracts";
import { date } from "../../../shared/lib/format";
import { paths } from "../../../shared/lib/paths";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { Link } from "../../../shared/ui/Link";
import { deleteNote } from "../api/alumnos.api";

/** Notas de seguimiento con sus acciones. `preview` recorta cada texto a tres líneas. */
export function NoteList({
  data,
  student,
  notes,
  reload,
  preview = false,
}: {
  data: Bootstrap;
  student: Student;
  notes: Note[];
  reload: () => Promise<void>;
  preview?: boolean;
}) {
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  async function removeNote(note: Note) {
    await deleteNote(note.id, note.version);
    setNoteToDelete(null);
    await reload();
  }

  return (
    <>
      <ul className="list">
        {notes.map((note) => (
          <li className="list-row" key={note.id}>
            <div className="list-row-main">
              <strong>{note.topic}</strong>
              <span className={preview ? "note-text clamp" : "note-text long-text"}>
                {note.text}
              </span>
              {note.sessionId && (
                <span className="note-origin">{noteOrigin(data, note.sessionId)}</span>
              )}
            </div>
            <div className="list-row-value">
              <span className="nowrap">{date(note.date)}</span>
              <div className="inline-actions">
                <Link className="text-button" to={paths.notaEditar(student.id, note.id)}>
                  Editar
                </Link>
                <button className="text-button danger" onClick={() => setNoteToDelete(note)}>
                  Eliminar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {noteToDelete && (
        <ConfirmDialog
          title="Eliminar nota"
          confirmLabel="Eliminar nota"
          danger
          onConfirm={() => removeNote(noteToDelete)}
          onCancel={() => setNoteToDelete(null)}
        >
          Se eliminará la nota “{noteToDelete.topic}” del expediente de {student.name}.
        </ConfirmDialog>
      )}
    </>
  );
}

function noteOrigin(data: Bootstrap, sessionId: string) {
  const session = data.sessions.find((item) => item.id === sessionId);
  const group = data.groups.find((item) => item.id === session?.groupId);
  return session
    ? `Clase: ${group?.name ?? "Grupo"} · ${date(session.date)}`
    : "Creada desde una clase";
}
