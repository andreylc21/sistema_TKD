import type { ReactNode } from "react";

/**
 * Tarjeta con título y acciones arriba a la derecha. Es la pieza base de las fichas y listas:
 * se cambia el título, las acciones y el contenido, no el marco.
 * `padded` envuelve el contenido en el cuerpo con margen (formularios); sin él, las listas y
 * tablas ocupan el ancho completo de la tarjeta.
 */
export function Card({
  title,
  actions,
  padded = false,
  className = "",
  children,
}: {
  title: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`card detail-card ${className}`.trim()}>
      <div className="card-header">
        <h2>{title}</h2>
        {actions && <div className="inline-actions">{actions}</div>}
      </div>
      {padded ? <div className="card-body">{children}</div> : children}
    </section>
  );
}
