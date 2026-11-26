import type { Student } from "../../../shared/api/contracts";
import { DialogButton } from "../../../shared/ui/DialogButton";
import { NoteForm } from "./NoteForm";

/** "Agregar nota" en una ventana emergente: es un formulario corto, no merece pantalla propia. */
export function AddNoteButton({
  student,
  today,
  reload,
  sessionId,
  className = "button small",
}: {
  student: Student;
  today: string;
  reload: () => Promise<void>;
  /** Si la nota nace de una clase, queda ligada a ella. */
  sessionId?: string;
  className?: string;
}) {
  return (
    <DialogButton
      label="Agregar nota"
      title={`Agregar nota · ${student.name}`}
      className={className}
    >
      {(close) => (
        <NoteForm
          studentId={student.id}
          today={today}
          sessionId={sessionId}
          onCancel={close}
          onSaved={async () => {
            close();
            await reload();
          }}
        />
      )}
    </DialogButton>
  );
}
