import { useEffect, useId, useRef, useState, type ReactNode } from "react";
/** Ayuda, contexto y acciones de la pantalla. El título vive en la barra superior (AppLayout). */
export function PageHeader({
  help,
  context,
  actions,
}: {
  help?: ReactNode;
  context?: ReactNode;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const helpId = useId();
  const helpRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setPinned(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  return (
    <header className="page-header">
      <div className="page-heading">
        <div className="page-title-row">
          {help && (
            <div
              ref={helpRef}
              className="page-help"
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => {
                if (!pinned) setOpen(false);
              }}
              onFocus={() => setOpen(true)}
              onBlur={(event) => {
                if (!pinned && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
              }}
            >
              <button
                type="button"
                className="help-button"
                aria-label="Ayuda sobre esta pantalla"
                aria-expanded={open}
                aria-controls={helpId}
                onClick={() => {
                  setOpen(!pinned);
                  setPinned(!pinned);
                }}
              >
                ?
              </button>
              {open && (
                <div id={helpId} className="help-popover" role="tooltip">
                  {help}
                </div>
              )}
            </div>
          )}
          {context && <div className="page-context">{context}</div>}
        </div>
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
export function Notice({
  children,
  kind = "success",
}: {
  children: ReactNode;
  kind?: "success" | "error";
}) {
  return (
    <div
      className={kind === "error" ? "form-error" : "success-message"}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
