import type { Bootstrap } from "../../shared/api/contracts";
import { date } from "../../shared/lib/format";
import { paths } from "../../shared/lib/paths";
import { Card } from "../../shared/ui/Card";
import { DetailLayout } from "../../shared/ui/DetailLayout";
import { Link } from "../../shared/ui/Link";
import { Money } from "../../shared/ui/Money";
import { PageHeader } from "../../shared/ui/PageHeader";
import { RowList } from "../../shared/ui/RowList";
import { Status } from "../../shared/ui/Status";
import { SummaryItem, SummaryStrip } from "../../shared/ui/SummaryStrip";
import { GiveClassButton } from "../clases/GroupActions";
import { nextClass, sessionPhase } from "../clases/model/clases.model";
import { chargePresentation } from "../pagos/model/pagos.model";
import { latestNotes, unpaidThisWeek, weeklyAttendance } from "./model/inicio.model";

const notesShown = 6;
const unpaidShown = 8;

const excerpt = (text: string, max = 90) =>
  text.length > max ? `${text.slice(0, max).trim()}…` : text;

/** Inicio: la próxima clase con las notas de sus alumnos y lo que hay que cobrar esta semana. */
export function InicioPage({ data, reload }: { data: Bootstrap; reload: () => Promise<void> }) {
  const attendance = weeklyAttendance(data);
  const next = nextClass(data, data.demoDate);
  const unpaid = unpaidThisWeek(data);
  const unpaidTotal = unpaid.reduce(
    (sum, charge) => sum + chargePresentation(charge, data).balance,
    0,
  );
  const nameOf = (id: string) => data.students.find((student) => student.id === id)?.name ?? "—";
  const notes = next ? latestNotes(data, next.group.students).slice(0, notesShown) : [];
  const isToday = next?.date === data.demoDate;
  const phase = next?.session ? sessionPhase(next.session) : null;

  return (
    <>
      <PageHeader help="La próxima clase con las últimas notas de sus alumnos, para recordar en qué trabajar, y los cobros que vencieron o vencen esta semana." />
      <SummaryStrip compact className="spacer-bottom">
        <SummaryItem label="Asistencia de la semana">
          {attendance.percent === null ? "—" : `${attendance.percent}%`}
        </SummaryItem>
        <SummaryItem label="Por pagar esta semana">
          <Money value={unpaidTotal} />
        </SummaryItem>
      </SummaryStrip>
      <DetailLayout
        variant="columns"
        main={
          <div className="detail-stack">
            <Card
              title="Próxima clase"
              actions={
                <Link className="button small" to={paths.grupos}>
                  Ver grupos
                </Link>
              }
            >
              <RowList
                empty={{
                  title: "No hay clases en horario",
                  text: "Ningún grupo tiene clase en los próximos días.",
                }}
                items={
                  next
                    ? [
                        {
                          id: next.group.id,
                          title: next.group.name,
                          subtitle: `${isToday ? "Hoy" : date(next.date)} · ${next.group.time} · ${next.group.students.length} alumnos`,
                          value: phase && (
                            <Status tone={phase === "En curso" ? "warning" : "success"}>
                              {phase}
                            </Status>
                          ),
                          actions: next.session ? (
                            <Link
                              className="button secondary small"
                              to={paths.sesion(next.group.id, next.session.id)}
                            >
                              Abrir clase
                            </Link>
                          ) : isToday ? (
                            <GiveClassButton group={next.group} data={data} reload={reload} />
                          ) : undefined,
                        },
                      ]
                    : []
                }
              />
            </Card>
            {next && (
              <Card title="Notas de sus alumnos">
                <RowList
                  empty={{
                    title: "Sin notas",
                    text: "Los alumnos de esta clase todavía no tienen notas de seguimiento.",
                  }}
                  items={notes.map((note) => ({
                    id: note.id,
                    title: nameOf(note.studentId),
                    subtitle: `${note.topic}: ${excerpt(note.text)}`,
                    value: <span>{date(note.date)}</span>,
                    actions: (
                      <Link className="button secondary small" to={paths.alumno(note.studentId)}>
                        Ver ficha
                      </Link>
                    ),
                  }))}
                />
              </Card>
            )}
          </div>
        }
        side={
          <Card
            title="Por pagar esta semana"
            actions={
              <Link className="button small" to={paths.pagos()}>
                Ver todos
              </Link>
            }
          >
            <RowList
              empty={{ title: "Todo está al corriente", text: "No hay cobros esta semana." }}
              items={unpaid.slice(0, unpaidShown).map((charge) => ({
                id: charge.id,
                title: nameOf(charge.studentId),
                subtitle: `${charge.concept} · ${date(charge.due)}`,
                value: (
                  <Status tone={charge.due < data.demoDate ? "danger" : "warning"}>
                    {charge.due < data.demoDate ? "Vencido" : "Esta semana"}
                  </Status>
                ),
                actions: (
                  <Link className="button secondary small" to={paths.pagoNuevo(charge.id)}>
                    Registrar pago
                  </Link>
                ),
              }))}
            />
          </Card>
        }
      />
    </>
  );
}
