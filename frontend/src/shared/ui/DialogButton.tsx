import { useState, type ReactNode } from "react";
import { Dialog } from "./Dialog";

/** Botón que abre una ventana emergente; `children` recibe `close` para cerrarla al terminar. */
export function DialogButton({
  label,
  title,
  className = "button secondary small",
  children,
}: {
  label: ReactNode;
  title: string;
  className?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Dialog title={title} onClose={close}>
          {children(close)}
        </Dialog>
      )}
    </>
  );
}
