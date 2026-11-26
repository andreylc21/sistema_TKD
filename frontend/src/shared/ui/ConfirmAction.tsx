import { useState, type ReactNode } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

/** Botón que pide confirmación antes de actuar: "Cancelar" y "Aceptar" (verde). */
export function ConfirmAction({
  label,
  title,
  className = "button secondary small danger",
  onConfirm,
  children,
}: {
  label: ReactNode;
  title: string;
  className?: string;
  onConfirm: () => Promise<void>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <ConfirmDialog
          title={title}
          onConfirm={async () => {
            await onConfirm();
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        >
          {children}
        </ConfirmDialog>
      )}
    </>
  );
}
