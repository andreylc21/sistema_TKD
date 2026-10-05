import { useEffect, useSyncExternalStore } from "react";

/*
 * Navegación con la History API: cada pantalla tiene URL propia y el botón "Atrás" del navegador
 * funciona. El servidor responde index.html a cualquier ruta que no sea /api ni un archivo.
 */

/** Devuelve true si detuvo la navegación; `proceed` la completa cuando la persona lo confirma. */
export type NavigationBlocker = (proceed: () => void) => boolean;
type HistoryState = { from?: string } | null;

const listeners = new Set<() => void>();
let blocker: NavigationBlocker | null = null;
let skipBlockerOnPop = false;
let current = currentUrl();
let pendingNotice = "";
let notice: { text: string; url: string } | null = null;

function currentUrl() {
  return window.location.pathname + window.location.search;
}

function commit() {
  current = currentUrl();
  if (pendingNotice) {
    notice = { text: pendingNotice, url: current };
    pendingNotice = "";
  } else if (notice && notice.url !== current) {
    notice = null;
  }
  listeners.forEach((listener) => listener());
}

function go(to: string, replace: boolean) {
  if (replace) {
    window.history.replaceState(window.history.state, "", to);
  } else {
    const state: HistoryState = { from: current };
    window.history.pushState(state, "", to);
    window.scrollTo(0, 0);
  }
  commit();
}

window.addEventListener("popstate", () => {
  const skip = skipBlockerOnPop;
  skipBlockerOnPop = false;
  const proceed = () => {
    skipBlockerOnPop = true;
    window.history.back();
  };
  if (!skip && blocker?.(proceed)) {
    // La URL ya cambió: se restaura mientras la persona decide si descarta sus cambios.
    const state: HistoryState = { from: currentUrl() };
    window.history.pushState(state, "", current);
    return;
  }
  commit();
});

export function navigate(to: string, options: { replace?: boolean } = {}) {
  if (to === current) return;
  const proceed = () => go(to, options.replace ?? false);
  if (blocker?.(proceed)) return;
  proceed();
}

/**
 * Cierra una pantalla como se cerraba un diálogo: vuelve a la pantalla que la abrió o, si se
 * entró directamente por URL, a su ruta padre. `notice` se muestra al llegar.
 */
export function goBack(fallback: string, options: { notice?: string; force?: boolean } = {}) {
  const proceed = () => {
    pendingNotice = options.notice ?? "";
    if ((window.history.state as HistoryState)?.from) {
      skipBlockerOnPop = true;
      window.history.back();
    } else {
      go(fallback, true);
    }
  };
  if (!options.force && blocker?.(proceed)) return;
  proceed();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Ruta actual con su consulta, por ejemplo `/clases?fecha=2026-10-05`. */
export function useLocation() {
  return useSyncExternalStore(subscribe, () => current);
}

/** Confirmación pendiente de la última acción, visible sólo en la pantalla a la que se volvió. */
export function useNotice() {
  return useSyncExternalStore(subscribe, () => (notice?.url === current ? notice.text : ""));
}

export function useNavigationBlocker(block: NavigationBlocker) {
  useEffect(() => {
    blocker = block;
    return () => {
      if (blocker === block) blocker = null;
    };
  }, [block]);
}
