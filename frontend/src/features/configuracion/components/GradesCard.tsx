import { useState, type FormEvent } from "react";
import type { Bootstrap, Grade } from "../../../shared/api/contracts";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { DataTable } from "../../../shared/ui/DataTable";
import { Dialog } from "../../../shared/ui/Dialog";
import { EditButton } from "../../../shared/ui/EditButton";
import { Notice } from "../../../shared/ui/PageHeader";
import { createGrade, renameGrade } from "../api/configuracion.api";
import { gradeUsage, trackLabel } from "../model/grados.model";

/** Grados: lista fija de cintas; aquí solo se cambia el nombre o se agrega uno nuevo. */
export function GradesTable({
  data,
  reload,
  adding,
  onCloseAdd,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  adding: boolean;
  onCloseAdd: () => void;
}) {
  const [renaming, setRenaming] = useState<Grade | null>(null);
  const rows = gradeUsage(data);
  const colors = data.grades.filter((grade) => grade.track === "color");

  return (
    <>
      <DataTable
        rows={rows}
        rowKey={({ grade }) => grade.id}
        empty={{ title: "Sin grados", text: "Agrega el primer grado." }}
        columns={[
          { header: "Grado", primary: true, cell: ({ grade }) => <strong>{grade.name}</strong> },
          { header: "Tipo", cell: ({ grade }) => trackLabel[grade.track] },
          { header: "Alumnos", cell: ({ students }) => students },
          {
            header: "Acciones",
            actions: true,
            cell: ({ grade }) => <EditButton onClick={() => setRenaming(grade)} />,
          },
        ]}
      />
      {renaming && (
        <ConfirmDialog
          title="Renombrar grado"
          field={{ label: "Nombre del grado", initial: renaming.name }}
          onConfirm={async (name) => {
            await renameGrade(renaming.id, { name });
            setRenaming(null);
            await reload();
          }}
          onCancel={() => setRenaming(null)}
        />
      )}
      {adding && (
        <Dialog title="Agregar grado" onClose={onCloseAdd}>
          <AddGradeForm
            colors={colors}
            onDone={async () => {
              onCloseAdd();
              await reload();
            }}
            onCancel={onCloseAdd}
          />
        </Dialog>
      )}
    </>
  );
}

function AddGradeForm({
  colors,
  onDone,
  onCancel,
}: {
  colors: Grade[];
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [track, setTrack] = useState<Grade["track"]>("color");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    try {
      await createGrade({
        name: String(values.name),
        track,
        afterId: track === "color" && values.afterId ? String(values.afterId) : undefined,
      });
      await onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo agregar el grado.");
    }
  }
  return (
    <form className="form-grid" onSubmit={submit}>
      {error && (
        <div className="full-span">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <div className="field full-span">
        <label htmlFor="grade-name">Nombre del grado</label>
        <input id="grade-name" name="name" maxLength={40} required placeholder="Ej. Cinta verde" />
      </div>
      <div className="field full-span">
        <label htmlFor="grade-track">Tipo</label>
        <select
          id="grade-track"
          value={track}
          onChange={(event) => setTrack(event.target.value as Grade["track"])}
        >
          <option value="color">{trackLabel.color}</option>
          <option value="poom">{trackLabel.poom}</option>
          <option value="dan">{trackLabel.dan}</option>
        </select>
        {track !== "color" && (
          <p className="help">
            Se agrega como el siguiente nivel, después del último de este tipo.
          </p>
        )}
      </div>
      {track === "color" && (
        <div className="field full-span">
          <label htmlFor="grade-after">Va después de</label>
          <select id="grade-after" name="afterId" defaultValue={colors[colors.length - 1]?.id}>
            {colors.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-actions full-span">
        <button type="button" className="button danger" data-dialog-close onClick={onCancel}>
          Cancelar
        </button>
        <button className="button confirm">Aceptar</button>
      </div>
    </form>
  );
}
