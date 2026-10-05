import { useMemo, useState } from "react";
import type { Student } from "../../../shared/api/contracts";
import { Empty } from "../../../shared/ui/PageHeader";

type StudentStatusFilter = "Todos" | Student["status"];

export function StudentList({
  students,
  onSelect,
}: {
  students: Student[];
  onSelect: (studentId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StudentStatusFilter>("Todos");
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-MX");
    return students.filter(
      (student) =>
        (!normalizedQuery || student.name.toLocaleLowerCase("es-MX").includes(normalizedQuery)) &&
        (status === "Todos" || student.status === status),
    );
  }, [query, status, students]);

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
                  </td>
                  <td>{student.grade}</td>
                  <td>
                    <span className={`badge ${student.status === "Activo" ? "success" : "light"}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <button className="button secondary small" onClick={() => onSelect(student.id)}>
                      Ver expediente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <Empty title="No hay coincidencias" text="Cambia la búsqueda o el estado." />
        )}
      </div>
    </>
  );
}
