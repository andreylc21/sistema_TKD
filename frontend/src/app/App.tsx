import { useCallback, useEffect, useState, type ReactNode } from "react";
import { bootstrap, logout, request, ApiError } from "../shared/api/client";
import type { Bootstrap } from "../shared/api/contracts";
import { date } from "../shared/lib/format";
import { useLocation } from "../shared/lib/navigation";
import { paths } from "../shared/lib/paths";
import { AppLayout, type Crumb, type Section } from "../shared/layout/AppLayout";
import { Link } from "../shared/ui/Link";
import { Empty } from "../shared/ui/PageHeader";
import { LoginPage } from "../features/acceso/LoginPage";
import { InicioPage } from "../features/inicio/InicioPage";
import {
  AlumnosPage,
  NoteFormPage,
  StudentFormPage,
  StudentNotesPage,
  StudentRecordPage,
} from "../features/alumnos/AlumnosPage";
import { ClasesPage } from "../features/clases/ClasesPage";
import { GroupFormPage } from "../features/clases/GroupFormPage";
import { SessionDetail } from "../features/clases/components/SessionDetail";
import { OrderFormPage, PagosPage, PaymentPage } from "../features/pagos/PagosPage";
import { OrderDetail } from "../features/pagos/components/OrderDetail";
import { paymentsTabs } from "../features/pagos/model/pagos.model";
import { ExamenesPage } from "../features/examenes/ExamenesPage";
import { ReportesPage } from "../features/reportes/ReportesPage";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";
import { ConfiguracionPage } from "../features/configuracion/ConfiguracionPage";
import { matchRoute, type Route } from "./routes";

export function App() {
  const location = useLocation();
  const [data, setData] = useState<Bootstrap | null>(null);
  const [auth, setAuth] = useState<"loading" | "login" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await bootstrap();
      setData(result);
      setAuth("ready");
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setAuth("login");
      else {
        setError(err instanceof Error ? err.message : "No fue posible cargar el sistema.");
        setAuth("error");
      }
    }
  }, []);
  useEffect(() => {
    let active = true;
    void bootstrap()
      .then((result) => {
        if (!active) return;
        setData(result);
        setAuth("ready");
        setError("");
      })
      .catch((caught: unknown) => {
        if (!active) return;
        if (caught instanceof ApiError && caught.status === 401) setAuth("login");
        else {
          setError(caught instanceof Error ? caught.message : "No fue posible cargar el sistema.");
          setAuth("error");
        }
      });
    return () => {
      active = false;
    };
  }, []);
  async function closeSession() {
    try {
      await logout();
    } finally {
      setData(null);
      setAuth("login");
    }
  }
  async function resetData() {
    await request<void, { confirm: "RESTABLECER" }>("/api/demo/reset", {
      method: "POST",
      body: { confirm: "RESTABLECER" },
    });
    setData(null);
    setAuth("login");
  }
  if (auth === "loading")
    return (
      <main className="loading-state" role="status">
        Cargando Sistema TKD…
      </main>
    );
  if (auth === "login") return <LoginPage onSuccess={load} />;
  if (auth === "error" || !data)
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <h1>No se pudo iniciar</h1>
          <div className="form-error">{error}</div>
          <button className="button" onClick={load}>
            Reintentar
          </button>
        </section>
      </main>
    );
  const screen = resolveScreen(matchRoute(location), data, load, resetData);
  return (
    <AppLayout
      section={screen.section}
      crumbs={screen.crumbs}
      school={data.school.name}
      date={date(data.demoDate)}
      onLogout={closeSession}
    >
      <ErrorBoundary key={screen.key}>{screen.page}</ErrorBoundary>
    </AppLayout>
  );
}

type Screen = {
  /** Opción del menú que se marca como actual. */
  section?: Section;
  /** Ruta mostrada en el encabezado; el último nivel es el título de la pantalla. */
  crumbs: Crumb[];
  /** Cambia sólo al abrir otra pantalla, no al cambiar de pestaña o filtro en la misma. */
  key: string;
  page: ReactNode;
};

const crumb = (label: string, to = ""): Crumb => ({ label, to });
const alumnosCrumb = crumb("Alumnos", paths.alumnos);
const clasesCrumb = crumb("Clases", paths.clases());
const gruposCrumb = crumb("Grupos y horarios", paths.clases("groups"));
const pagosCrumb = crumb("Pagos", paths.pagos());
const pedidosCrumb = crumb("Pedidos", paths.pagos("pedidos"));

function resolveScreen(
  route: Route,
  data: Bootstrap,
  reload: () => Promise<void>,
  onReset: () => Promise<void>,
): Screen {
  switch (route.name) {
    case "inicio":
      return {
        section: "inicio",
        crumbs: [crumb("Inicio", paths.inicio)],
        key: "inicio",
        page: <InicioPage data={data} />,
      };
    case "alumnos":
      return {
        section: "alumnos",
        crumbs: [alumnosCrumb],
        key: "alumnos",
        page: <AlumnosPage data={data} />,
      };
    case "alumno-nuevo":
      return {
        section: "alumnos",
        crumbs: [alumnosCrumb, crumb("Registrar alumno")],
        key: "alumno-nuevo",
        page: <StudentFormPage data={data} reload={reload} />,
      };
    case "alumno":
    case "alumno-editar":
    case "notas":
    case "nota-nueva":
    case "nota-editar": {
      const student = data.students.find((item) => item.id === route.studentId);
      if (!student)
        return missing("alumnos", [alumnosCrumb], "Alumno no encontrado", paths.alumnos, "alumnos");
      const record = crumb(student.name, paths.alumno(student.id));
      const notes = crumb("Notas", paths.notas(student.id));
      const key = `${route.name}:${student.id}`;
      if (route.name === "alumno")
        return {
          section: "alumnos",
          crumbs: [alumnosCrumb, record],
          key,
          page: <StudentRecordPage data={data} student={student} reload={reload} />,
        };
      if (route.name === "alumno-editar")
        return {
          section: "alumnos",
          crumbs: [alumnosCrumb, record, crumb("Editar expediente")],
          key,
          page: <StudentFormPage data={data} student={student} reload={reload} />,
        };
      if (route.name === "notas")
        return {
          section: "alumnos",
          crumbs: [alumnosCrumb, record, notes],
          key,
          page: <StudentNotesPage data={data} student={student} reload={reload} />,
        };
      if (route.name === "nota-nueva")
        return {
          section: "alumnos",
          crumbs: [alumnosCrumb, record, notes, crumb("Agregar nota")],
          key,
          page: <NoteFormPage data={data} student={student} parent={notes.to} reload={reload} />,
        };
      const note = data.notes.find(
        (item) => item.id === route.noteId && item.studentId === student.id,
      );
      if (!note)
        return missing(
          "alumnos",
          [alumnosCrumb, record, notes],
          "Nota no encontrada",
          notes.to,
          "las notas",
        );
      return {
        section: "alumnos",
        crumbs: [alumnosCrumb, record, notes, crumb("Editar nota")],
        key: `${key}:${note.id}`,
        page: (
          <NoteFormPage
            data={data}
            student={student}
            note={note}
            parent={notes.to}
            reload={reload}
          />
        ),
      };
    }
    case "clases":
      return {
        section: "clases",
        crumbs: [clasesCrumb],
        key: "clases",
        page: <ClasesPage data={data} reload={reload} view={route.view} initialDate={route.date} />,
      };
    case "grupo-nuevo":
      return {
        section: "clases",
        crumbs: [clasesCrumb, gruposCrumb, crumb("Crear grupo")],
        key: "grupo-nuevo",
        page: <GroupFormPage reload={reload} />,
      };
    case "grupo-editar": {
      const group = data.groups.find((item) => item.id === route.groupId);
      if (!group)
        return missing(
          "clases",
          [clasesCrumb, gruposCrumb],
          "Grupo no encontrado",
          gruposCrumb.to,
          "los grupos",
        );
      return {
        section: "clases",
        crumbs: [clasesCrumb, gruposCrumb, crumb(`Editar ${group.name}`)],
        key: `grupo-editar:${group.id}`,
        page: <GroupFormPage group={group} reload={reload} />,
      };
    }
    case "sesion":
    case "sesion-nota": {
      const session = data.sessions.find((item) => item.id === route.sessionId);
      if (!session)
        return missing(
          "clases",
          [clasesCrumb],
          "Clase no encontrada",
          clasesCrumb.to,
          "las clases",
        );
      const group = data.groups.find((item) => item.id === session.groupId);
      // La clase cuelga del día en que ocurre, para que "Clases" regrese a esa fecha.
      const day = crumb("Clases", paths.clases("day", session.date));
      const sessionCrumb = crumb(
        `${group?.name ?? "Clase"} · ${date(session.date)}`,
        paths.sesion(session.id),
      );
      if (route.name === "sesion")
        return {
          section: "clases",
          crumbs: [day, sessionCrumb],
          key: `sesion:${session.id}`,
          page: <SessionDetail data={data} session={session} reload={reload} />,
        };
      const student = data.students.find((item) => item.id === route.studentId);
      if (!student)
        return missing(
          "clases",
          [day, sessionCrumb],
          "Alumno no encontrado",
          sessionCrumb.to,
          "la clase",
        );
      return {
        section: "clases",
        crumbs: [day, sessionCrumb, crumb(`Nota de seguimiento · ${student.name}`)],
        key: `sesion-nota:${session.id}:${student.id}`,
        page: (
          <NoteFormPage
            data={data}
            student={student}
            sessionId={session.id}
            parent={sessionCrumb.to}
            reload={reload}
          />
        ),
      };
    }
    case "pagos":
      return {
        section: "pagos",
        crumbs: [pagosCrumb],
        key: "pagos",
        page: <PagosPage data={data} reload={reload} tab={route.tab} due={route.due} />,
      };
    case "pago-nuevo": {
      const tab = paymentsTabs.find((item) => item.id === route.tab);
      return {
        section: "pagos",
        crumbs: [
          pagosCrumb,
          ...(route.tab === "saldos" && tab ? [crumb(tab.label, paths.pagos("saldos"))] : []),
          crumb("Registrar pago"),
        ],
        key: `pago-nuevo:${route.tab}:${route.chargeId ?? ""}`,
        page: <PaymentPage data={data} tab={route.tab} chargeId={route.chargeId} reload={reload} />,
      };
    }
    case "pedido-nuevo":
      return {
        section: "pagos",
        crumbs: [pagosCrumb, pedidosCrumb, crumb("Registrar pedido")],
        key: "pedido-nuevo",
        page: <OrderFormPage data={data} reload={reload} />,
      };
    case "pedido": {
      const order = data.orders.find(
        (item) => item.uuid === route.orderId || item.id === route.orderId,
      );
      if (!order)
        return missing(
          "pagos",
          [pagosCrumb, pedidosCrumb],
          "Pedido no encontrado",
          pedidosCrumb.to,
          "los pedidos",
        );
      return {
        section: "pagos",
        crumbs: [pagosCrumb, pedidosCrumb, crumb(`Pedido ${order.id}`)],
        key: `pedido:${order.uuid}`,
        page: <OrderDetail data={data} order={order} reload={reload} />,
      };
    }
    case "examenes":
      return {
        section: "examenes",
        crumbs: [crumb("Exámenes", paths.examenes)],
        key: "examenes",
        page: <ExamenesPage />,
      };
    case "reportes":
      return {
        section: "reportes",
        crumbs: [crumb("Reportes", paths.reportes)],
        key: "reportes",
        page: <ReportesPage data={data} />,
      };
    case "configuracion":
      return {
        section: "configuracion",
        crumbs: [crumb("Configuración", paths.configuracion)],
        key: "configuracion",
        page: <ConfiguracionPage data={data} onReset={onReset} />,
      };
    case "no-encontrada":
      return missing(undefined, [], "Página no encontrada", paths.inicio, "inicio");
  }
}

/** Registro o dirección inexistente: se explica y se ofrece volver a un lugar conocido. */
function missing(
  section: Section | undefined,
  parents: Crumb[],
  title: string,
  to: string,
  destination: string,
): Screen {
  return {
    section,
    crumbs: [...parents, crumb(title)],
    key: `missing:${title}`,
    page: (
      <section className="card">
        <Empty
          title="No está disponible"
          text="La dirección no existe o el registro ya no está disponible."
        />
        <div className="card-footer">
          <Link className="button secondary" to={to}>
            Ir a {destination}
          </Link>
        </div>
      </section>
    ),
  };
}
