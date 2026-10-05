import { useState, type ReactNode } from "react";
import { NavIcon } from "./NavIcon";
export type Section =
  | "inicio"
  | "alumnos"
  | "clases"
  | "pagos"
  | "examenes"
  | "calendario"
  | "reportes"
  | "configuracion";
const items: [Section, string][] = [
  ["inicio", "Inicio"],
  ["alumnos", "Alumnos"],
  ["clases", "Clases"],
  ["pagos", "Pagos"],
  ["examenes", "Exámenes"],
  ["calendario", "Calendario"],
  ["reportes", "Reportes"],
  ["configuracion", "Configuración"],
];
export function AppLayout({
  section,
  onSection,
  school,
  date,
  children,
  onLogout,
}: {
  section: Section;
  onSection: (s: Section) => void;
  school: string;
  date: string;
  children: ReactNode;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const choose = (s: Section) => {
    onSection(s);
    setOpen(false);
  };
  return (
    <>
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido principal
      </a>
      <div className="app-shell">
        <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Navegación principal">
          <div className="brand-block">
            <div className="brand-mark" aria-hidden="true">
              TKD
            </div>
            <div>
              <strong>Sistema TKD</strong>
              <span>Gestión escolar</span>
            </div>
            <button
              className="icon-button sidebar-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <NavIcon name="close" />
            </button>
          </div>
          <nav>
            {items.map(([id, label]) => (
              <button
                key={id}
                className="nav-link"
                aria-current={section === id ? "page" : undefined}
                onClick={() => choose(id)}
              >
                <span className="nav-icon" aria-hidden="true">
                  <NavIcon name={id} />
                </span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <button className="nav-link logout-link" onClick={onLogout}>
            <span className="nav-icon">
              <NavIcon name="logout" />
            </span>
            <span>Cerrar sesión</span>
          </button>
        </aside>
        {open && (
          <button className="scrim" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
        )}
        <div className="workspace">
          <header className="topbar">
            <div className="topbar-inner">
              <button
                className="icon-button menu-button"
                onClick={() => setOpen(true)}
                aria-label="Abrir menú"
              >
                <NavIcon name="menu" />
              </button>
              <div className="topbar-title">
                <strong>{school}</strong>
              </div>
              <div className="topbar-meta">
                <span className="topbar-date">Fecha operativa · {date}</span>
              </div>
            </div>
          </header>
          <main id="contenido-principal" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
