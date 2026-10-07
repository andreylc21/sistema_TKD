import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigationBlocker } from "../lib/navigation";

/**
 * Contenedor de un formulario completo mostrado como pantalla. Igual que el diálogo al que
 * sustituye, avisa antes de descartar cambios sin guardar al salir por el menú, las migas de pan,
 * "Cancelar" o el botón "Atrás" del navegador.
 */
export function FormScreen({ children }: { children: ReactNode }) {
  const panel = useRef<HTMLElement>(null);
  const initialValues = useRef<string | null>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const values = useCallback(() => {
    const form = panel.current?.querySelector("form");
    return form ? JSON.stringify([...new FormData(form).entries()]) : "";
  }, []);
  const dirty = useCallback(
    () => initialValues.current !== null && values() !== initialValues.current,
    [values],
  );
  const block = useCallback(
    (proceed: () => void) => {
      if (!dirty()) return false;
      setPending(() => proceed);
      return true;
    },
    [dirty],
  );
  useNavigationBlocker(block);
  useEffect(() => {
    initialValues.current = values();
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty()) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, values]);

  return (
    <section ref={panel} className="form-screen">
      {pending && (
        <div className="discard-warning" role="alertdialog" aria-label="Cambios sin guardar">
          <p>Hay cambios sin guardar. ¿Quieres descartarlos?</p>
          <div className="inline-actions">
            <button
              type="button"
              className="button secondary small"
              autoFocus
              onClick={() => setPending(null)}
            >
              Seguir editando
            </button>
            <button
              type="button"
              className="button danger small"
              onClick={() => {
                setPending(null);
                pending();
              }}
            >
              Descartar cambios
            </button>
          </div>
        </div>
      )}
      {children}
    </section>
  );
}
