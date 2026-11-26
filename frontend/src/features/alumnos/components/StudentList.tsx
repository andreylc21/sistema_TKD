import { useMemo, useState, type ReactNode } from "react";
import type { Grade, Group, Student } from "../../../shared/api/contracts";
import { paths } from "../../../shared/lib/paths";
import { Link } from "../../../shared/ui/Link";
import { DataTable } from "../../../shared/ui/DataTable";
import { FilterSelect } from "../../../shared/ui/FilterSelect";
import { ListTools } from "../../../shared/ui/ListTools";
import { Status } from "../../../shared/ui/Status";
import { ageAlerts } from "../../clases/model/clases.model";

type StudentStatusFilter = "Todos" | Student["status"];

type AgeFilter = "Todas" | "Menores" | "Adultos";

export function StudentList({
  students,
  grades,
  groups,
  action,
}: {
  students: Student[];
  grades: Grade[];
  groups: Group[];
  action?: ReactNode;
}) {
  const outOfRange = useMemo(
    () => new Map(ageAlerts(groups, students).map((alert) => [alert.student.id, alert.group.name])),
    [groups, students],
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StudentStatusFilter>("Todos");
  const [gradeId, setGradeId] = useState("");
  const [age, setAge] = useState<AgeFilter>("Todas");
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-MX");
    return students.filter(
      (student) =>
        (!normalizedQuery || student.name.toLocaleLowerCase("es-MX").includes(normalizedQuery)) &&
        (status === "Todos" || student.status === status) &&
        (!gradeId || student.gradeId === gradeId) &&
        (age === "Todas" || (age === "Menores") === student.minor),
    );
  }, [query, status, gradeId, age, students]);

  return (
    <>
      <ListTools
        searchId="student-search"
        searchLabel="Buscar por nombre"
        query={query}
        onQuery={(event) => setQuery(event.target.value)}
        action={action}
        filters={
          <>
            <FilterSelect
              id="student-status"
              label="Estado"
              value={status}
              onChange={(event) => setStatus(event.target.value as StudentStatusFilter)}
            >
              <option>Todos</option>
              <option>Activo</option>
              <option>Inactivo</option>
            </FilterSelect>
            <FilterSelect
              id="student-grade"
              label="Grado"
              value={gradeId}
              onChange={(event) => setGradeId(event.target.value)}
            >
              <option value="">Todos</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              id="student-age"
              label="Categoría"
              value={age}
              onChange={(event) => setAge(event.target.value as AgeFilter)}
            >
              <option>Todas</option>
              <option>Menores</option>
              <option>Adultos</option>
            </FilterSelect>
          </>
        }
      />
      <DataTable
        rows={filtered}
        rowKey={(student) => student.id}
        rowClassName={(student) => (student.status === "Activo" ? undefined : "row-inactive")}
        empty={{ title: "No hay coincidencias", text: "Cambia la búsqueda o los filtros." }}
        columns={[
          {
            header: "Alumno",
            primary: true,
            cell: (student) => (
              <>
                <strong>{student.name}</strong>
                {student.status !== "Activo" && <Status tone="neutral">{student.status}</Status>}
                {outOfRange.has(student.id) && (
                  <span className="badge warning">Ya no entra en {outOfRange.get(student.id)}</span>
                )}
              </>
            ),
          },
          { header: "Edad", cell: (student) => `${student.age} años` },
          { header: "Grado", cell: (student) => student.grade },
          {
            header: "Acciones",
            actions: true,
            cell: (student) => (
              <Link className="button secondary small" to={paths.alumno(student.id)}>
                Ver ficha
              </Link>
            ),
          },
        ]}
      />
    </>
  );
}
