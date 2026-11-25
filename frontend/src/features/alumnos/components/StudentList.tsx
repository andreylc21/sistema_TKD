import { useMemo, useState, type ReactNode } from "react";
import type { Grade, Group, Student } from "../../../shared/api/contracts";
import { paths } from "../../../shared/lib/paths";
import { Link } from "../../../shared/ui/Link";
import { Empty } from "../../../shared/ui/PageHeader";
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
      <div className="list-tools">
        <div className="field grow">
          <label htmlFor="student-search">Buscar por nombre</label>
          <input
            id="student-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="field compact">
          <label htmlFor="student-status">Estado</label>
          <select
            id="student-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as StudentStatusFilter)}
          >
            <option>Todos</option>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>
        <div className="field compact">
          <label htmlFor="student-grade">Grado</label>
          <select
            id="student-grade"
            value={gradeId}
            onChange={(event) => setGradeId(event.target.value)}
          >
            <option value="">Todos</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field compact">
          <label htmlFor="student-age">Categoría</label>
          <select
            id="student-age"
            value={age}
            onChange={(event) => setAge(event.target.value as AgeFilter)}
          >
            <option>Todas</option>
            <option>Menores</option>
            <option>Adultos</option>
          </select>
        </div>
        {action && <div className="list-tools-action">{action}</div>}
      </div>
      <p className="results-meta" aria-live="polite">
        <strong>{filtered.length}</strong> alumnos
      </p>
      <div className="table-surface">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Grado</th>
                <th>Estado</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id}>
                  <td className="primary-cell">
                    <strong>{student.name}</strong>
                    <span>{student.minor ? "Menor de edad" : "Persona adulta"}</span>
                    {outOfRange.has(student.id) && (
                      <span className="badge warning">
                        Ya no entra en {outOfRange.get(student.id)}
                      </span>
                    )}
                  </td>
                  <td>{student.grade}</td>
                  <td>
                    <span className={`badge ${student.status === "Activo" ? "success" : "light"}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <Link className="button secondary small" to={paths.alumno(student.id)}>
                      Ver expediente
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <Empty title="No hay coincidencias" text="Cambia la búsqueda o los filtros." />
        )}
      </div>
    </>
  );
}
