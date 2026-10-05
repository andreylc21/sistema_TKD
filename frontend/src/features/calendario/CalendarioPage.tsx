import type { Bootstrap } from "../../shared/api/contracts";
import { date } from "../../shared/lib/format";
import { PageHeader } from "../../shared/ui/PageHeader";
export function CalendarioPage({ data }: { data: Bootstrap }) {
  return (
    <>
      <PageHeader title="Calendario" help="Consulta las clases registradas y su estado actual." />
      <div className="grid cols-2">
        {data.sessions.map((s) => (
          <article className="card" key={s.id}>
            <div className="card-body">
              <span className="eyebrow">{s.status}</span>
              <h2>{data.groups.find((g) => g.id === s.groupId)?.name}</h2>
              <p>
                {date(s.date)} · {s.time}
              </p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
