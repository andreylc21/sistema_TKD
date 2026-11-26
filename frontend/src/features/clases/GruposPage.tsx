import { useMemo, useState } from "react";
import type { Bootstrap } from "../../shared/api/contracts";
import { paths } from "../../shared/lib/paths";
import { Link } from "../../shared/ui/Link";
import { PageHeader } from "../../shared/ui/PageHeader";
import { DataTable } from "../../shared/ui/DataTable";
import { ListTools } from "../../shared/ui/ListTools";
import { ArchivedGroups } from "./components/ArchivedGroups";
import { GiveClassButton } from "./GroupActions";
import { activeGroups, ageAlerts, ageLabel } from "./model/clases.model";

/** Lista de grupos: misma estructura que la de alumnos. Cada grupo se abre en su ficha. */
export function GruposPage({ data, reload }: { data: Bootstrap; reload: () => Promise<void> }) {
  const [query, setQuery] = useState("");
  const alerts = useMemo(() => ageAlerts(data.groups, data.students), [data]);
  const groups = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("es-MX");
    return activeGroups(data.groups).filter(
      (group) => !text || group.name.toLocaleLowerCase("es-MX").includes(text),
    );
  }, [data.groups, query]);

  return (
    <>
      <PageHeader help="Consulta los grupos y entra a uno para ver sus alumnos y modificarlo." />
      <ListTools
        searchId="group-search"
        searchLabel="Buscar por nombre"
        query={query}
        onQuery={(event) => setQuery(event.target.value)}
        action={
          <Link className="button" to={paths.grupoNuevo}>
            Crear grupo
          </Link>
        }
      />
      <DataTable
        rows={groups}
        rowKey={(group) => group.id}
        empty={{
          title: query ? "No hay coincidencias" : "Aún no hay grupos",
          text: query
            ? "Cambia la búsqueda."
            : "Crea un grupo con su horario para asignar alumnos y dar clases.",
        }}
        columns={[
          {
            header: "Grupo",
            primary: true,
            cell: (group) => {
              const outside = alerts.filter((alert) => alert.group.id === group.id).length;
              return (
                <>
                  <strong>{group.name}</strong>
                  {outside > 0 && (
                    <span className="badge warning">{outside} fuera del rango de edad</span>
                  )}
                </>
              );
            },
          },
          { header: "Días", cell: (group) => group.days.join(", ") },
          { header: "Hora", cell: (group) => group.time },
          { header: "Edad", cell: (group) => ageLabel(group) },
          { header: "Alumnos", cell: (group) => group.students.length },
          {
            header: "Acciones",
            actions: true,
            cell: (group) => (
              <>
                <GiveClassButton group={group} data={data} reload={reload} />
                <Link className="button secondary small" to={paths.grupo(group.id)}>
                  Ver grupo
                </Link>
              </>
            ),
          },
        ]}
      />
      <ArchivedGroups data={data} reload={reload} />
    </>
  );
}
