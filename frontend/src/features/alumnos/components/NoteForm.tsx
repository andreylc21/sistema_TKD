import { useRef, useState, type FormEvent } from "react";
import type { Note, NoteWrite } from "../../../shared/api/contracts";
import { Notice } from "../../../shared/ui/PageHeader";
import { createNote, updateNote } from "../api/alumnos.api";

export function NoteForm({
  studentId,
  today,
  initial,
  sessionId,
  onSaved,
  onCancel,
}: {
  studentId: string;
  today: string;
  initial?: Note;
  sessionId?: string;
  onSaved: () => Promise<void>;
  onCancel?: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const creationKey = useRef(crypto.randomUUID());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body: NoteWrite = {
      date: String(values.date),
      topic: String(values.topic).trim(),
      text: String(values.text).trim(),
      ...(sessionId || initial?.sessionId ? { sessionId: sessionId ?? initial?.sessionId } : {}),
      ...(initial ? { version: initial.version } : {}),
    };
    setBusy(true);
    setError("");
    try {
      if (initial) await updateNote(initial.id, body);
      else await createNote(studentId, body, creationKey.current);
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la nota.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      {error && (
        <div className="full-span">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <div className="field">
        <label htmlFor="note-date">Fecha</label>
        <input
          id="note-date"
          name="date"
          type="date"
          defaultValue={initial?.date || today}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="note-topic">Aspecto trabajado</label>
        <input id="note-topic" name="topic" defaultValue={initial?.topic} required />
      </div>
      <div className="field full-span">
        <label htmlFor="note-text">Contenido de la nota</label>
        <textarea id="note-text" name="text" defaultValue={initial?.text} required />
      </div>
      <div className="form-actions full-span">
        {onCancel && (
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Guardando…" : "Guardar nota"}
        </button>
      </div>
    </form>
  );
}
