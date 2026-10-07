import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNotice } from "../lib/navigation";
import { paths } from "../lib/paths";
import { Link } from "../ui/Link";
import { Notice } from "../ui/PageHeader";
import { NavIcon } from "./NavIcon";
export type Section =
  "inicio" | "alumnos" | "clases" | "pagos" | "examenes" | "reportes" | "configuracion";
/** Nivel de la ruta mostrada en el encabezado; el último es la pantalla actual. */
export type Crumb = { label: string; to: string };
const items: [Section, string, string][] = [
  ["inicio", "Inicio", paths.inicio],
  ["alumnos", "Alumnos", paths.alumnos],
  ["clases", "Clases", paths.clases()],
  ["pagos", "Pagos", paths.pagos()],
  ["examenes", "Exámenes", paths.examenes],
  ["reportes", "Reportes", paths.reportes],
  ["configuracion", "Configuración", paths.configuracion],
];
export function AppLayout({
  section,
  crumbs,
  school,
  date,
  children,
  onLogout,
}: {
  section?: Section;
  crumbs: Crumb[];
  school: string;
  date: string;
  children: ReactNode;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const notice = useNotice();
  const parents = crumbs.slice(0, -1);
  const title = crumbs[crumbs.length - 1]?.label ?? "";
  const trail = crumbs.map((crumb) => crumb.label).join(" › ");
  useEffect(() => {
    // Al cambiar de pantalla, el foco pasa al título para anunciar dónde se está.
    document.title = `${trail} · Sistema TKD`;
    heading.current?.focus();
  }, [trail]);
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
            {items.map(([id, label, to]) => (
              <Link
                key={id}
                to={to}
                className="nav-link"
                aria-current={section === id ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">
                  <NavIcon name={id} />
                </span>
                <span>{label}</span>
              </Link>
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
                <span className="topbar-school">{school}</span>
                <div className="topbar-heading">
                  {parents.length > 0 && (
                    <nav className="breadcrumbs" aria-label="Ruta de navegación">
                      <ol>
                        {parents.map((crumb) => (
                          <li key={crumb.to}>
                            <Link to={crumb.to}>{crumb.label}</Link>
                            <span aria-hidden="true">›</span>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  )}
                  <h1 ref={heading} tabIndex={-1}>
                    {title}
                  </h1>
                </div>
              </div>
              <div className="topbar-meta">
                <span className="topbar-date">Fecha operativa · {date}</span>
              </div>
            </div>
          </header>
          <main id="contenido-principal" tabIndex={-1}>
            {notice && <Notice>{notice}</Notice>}
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
