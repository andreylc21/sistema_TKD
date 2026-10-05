import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

const focusableSelector =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Dialog({
  title,
  children,
  onClose,
  initialFocusRef,
  guardChanges = true,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  guardChanges?: boolean;
}) {
  const panel = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [discarding, setDiscarding] = useState(false);
  const initialValues = useRef("");
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const values = useCallback(() => {
    const form = panel.current?.querySelector("form");
    return form ? JSON.stringify([...new FormData(form).entries()]) : "";
  }, []);
  const attemptClose = useCallback(() => {
    const dirty = guardChanges && values() !== initialValues.current;
    if (dirty) setDiscarding(true);
    else onCloseRef.current();
  }, [guardChanges, values]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    initialValues.current = values();
    const focusables = () =>
      [...(panel.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])].filter(
        (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true",
      );
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        attemptClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) {
        event.preventDefault();
        panel.current?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    // El primer control del contenido (no el botón de cerrar) recibe el foco inicial.
    const firstInBody = body.current?.querySelector<HTMLElement>(focusableSelector);
    (initialFocusRef?.current ?? firstInBody ?? focusables()[0] ?? panel.current)?.focus();
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [attemptClose, initialFocusRef, values]);
  return (
    <div className="modal-layer">
      <button className="modal-backdrop" aria-label="Cerrar diálogo" onClick={attemptClose} />
      <section
        ref={panel}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest("[data-dialog-close]")) {
            event.preventDefault();
            event.stopPropagation();
            attemptClose();
          }
        }}
      >
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-button" type="button" onClick={attemptClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        {discarding && (
          <div className="discard-warning" role="alertdialog" aria-label="Cambios sin guardar">
            <p>Hay cambios sin guardar. ¿Quieres descartarlos?</p>
            <div className="inline-actions">
              <button
                type="button"
                className="button secondary small"
                autoFocus
                onClick={() => setDiscarding(false)}
              >
                Seguir editando
              </button>
              <button
                type="button"
                className="button danger small"
                onClick={() => onCloseRef.current()}
              >
                Descartar cambios
              </button>
            </div>
          </div>
        )}
        <div className="modal-body" ref={body}>
          {children}
        </div>
      </section>
    </div>
  );
}
