import { PencilIcon } from "./PencilIcon";

/** Clase y contenido del botón "Editar" (azul, con lápiz) para usarlos también dentro de `DialogButton`. */
export const editButtonClass = "button secondary small edit-button";

export function EditLabel() {
  return (
    <>
      <PencilIcon />
      Editar
    </>
  );
}

/** "Editar": botón azul con lápiz. Siempre igual en fichas, listas y notas. */
export function EditButton({
  onClick,
  disabled,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button className={editButtonClass} disabled={disabled} title={title} onClick={onClick}>
      <EditLabel />
    </button>
  );
}
