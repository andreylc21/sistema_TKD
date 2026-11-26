import { useCallback, useEffect, useState, type ReactNode } from "react";
import { bootstrap, logout, request, ApiError } from "../shared/api/client";
import type { Bootstrap } from "../shared/api/contracts";
import { dateLong } from "../shared/lib/format";
import { useLocation } from "../shared/lib/navigation";
import { paths } from "../shared/lib/paths";
import { AppLayout, type Crumb, type Section } from "../shared/layout/AppLayout";
import { Link } from "../shared/ui/Link";
import { Empty } from "../shared/ui/PageHeader";
import { LoginPage } from "../features/acceso/LoginPage";
import { InicioPage } from "../features/inicio/InicioPage";
import { AlumnosPage, StudentFormPage, StudentRecordPage } from "../features/alumnos/AlumnosPage";
import { GroupDetail } from "../features/clases/GroupDetail";
import { GroupFormPage } from "../features/clases/GroupFormPage";
import { GruposPage } from "../features/clases/GruposPage";
import { SessionDetail } from "../features/clases/components/SessionDetail";
import { PagosPage, PaymentPage } from "../features/pagos/PagosPage";
import { OrderFormPage, PedidosPage } from "../features/pedidos/PedidosPage";
import { examName } from "../features/examenes/model/examenes.model";
import {
  ExamDetailPage,
  ExamEditPage,
  ExamenesPage,
  ExamFormPage,
} from "../features/examenes/ExamenesPage";
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
      date={dateLong(data.demoDate)}
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
const gruposCrumb = crumb("Grupos", paths.grupos);
const pagosCrumb = crumb("Pagos", paths.pagos());
const pedidosCrumb = crumb("Pedidos", paths.pedidos);

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
        page: <InicioPage data={data} reload={reload} />,
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
    case "alumno-editar": {
      const student = data.students.find((item) => item.id === route.studentId);
      if (!student)
        return missing("alumnos", [alumnosCrumb], "Alumno no encontrado", paths.alumnos, "alumnos");
      const record = crumb("Ficha del alumno", paths.alumno(student.id));
      const key = `${route.name}:${student.id}`;
      if (route.name === "alumno")
        return {
          section: "alumnos",
          crumbs: [alumnosCrumb, record],
          key,
          page: <StudentRecordPage data={data} student={student} reload={reload} />,
        };
      return {
        section: "alumnos",
        crumbs: [alumnosCrumb, record, crumb("Editar expediente")],
        key,
        page: <StudentFormPage data={data} student={student} reload={reload} />,
      };
    }
    case "grupos":
      return {
        section: "grupos",
        crumbs: [gruposCrumb],
        key: "grupos",
        page: <GruposPage data={data} reload={reload} />,
      };
    case "grupo-nuevo":
      return {
        section: "grupos",
        crumbs: [gruposCrumb, crumb("Crear grupo")],
        key: "grupo-nuevo",
        page: <GroupFormPage reload={reload} />,
      };
    case "grupo": {
      const group = data.groups.find((item) => item.id === route.groupId);
      if (!group)
        return missing(
          "grupos",
          [gruposCrumb],
          "Grupo no encontrado",
          gruposCrumb.to,
          "los grupos",
        );
      return {
        section: "grupos",
        crumbs: [gruposCrumb, crumb("Ficha del grupo")],
        key: `grupo:${group.id}`,
        page: <GroupDetail data={data} group={group} reload={reload} />,
      };
    }
    case "sesion": {
      const session = data.sessions.find((item) => item.id === route.sessionId);
      if (!session)
        return missing(
          "grupos",
          [gruposCrumb],
          "Clase no encontrada",
          gruposCrumb.to,
          "los grupos",
        );
      return {
        section: "grupos",
        crumbs: [gruposCrumb, crumb("Clase", paths.sesion(session.groupId, session.id))],
        key: `sesion:${session.id}`,
        page: <SessionDetail data={data} session={session} reload={reload} />,
      };
    }
    case "pagos":
      return {
        section: "pagos",
        crumbs: [pagosCrumb],
        key: "pagos",
        page: (
          <PagosPage
            data={data}
            reload={reload}
            q={route.q}
            progress={route.progress}
            all={route.all}
          />
        ),
      };
    case "pago-nuevo":
      return {
        section: "pagos",
        crumbs: [pagosCrumb, crumb("Registrar pago")],
        key: `pago-nuevo:${route.chargeId ?? ""}`,
        page: (
          <PaymentPage
            data={data}
            chargeId={route.chargeId}
            studentId={route.studentId}
            reload={reload}
          />
        ),
      };
    case "pedidos":
      return {
        section: "pedidos",
        crumbs: [pedidosCrumb],
        key: "pedidos",
        page: <PedidosPage data={data} reload={reload} />,
      };
    case "pedido-nuevo":
      return {
        section: "pedidos",
        crumbs: [pedidosCrumb, crumb("Registrar pedido")],
        key: "pedido-nuevo",
        page: <OrderFormPage data={data} reload={reload} />,
      };
    case "examenes":
      return {
        section: "examenes",
        crumbs: [crumb("Exámenes", paths.examenes)],
        key: "examenes",
        page: <ExamenesPage data={data} reload={reload} />,
      };
    case "examen-nuevo":
      return {
        section: "examenes",
        crumbs: [crumb("Exámenes", paths.examenes), crumb("Programar examen")],
        key: "examen-nuevo",
        page: <ExamFormPage data={data} reload={reload} />,
      };
    case "examen": {
      const exam = data.exams.find((item) => item.id === route.examId);
      const examenesCrumb = crumb("Exámenes", paths.examenes);
      if (!exam)
        return missing(
          "examenes",
          [examenesCrumb],
          "Examen no encontrado",
          examenesCrumb.to,
          "los exámenes",
        );
      return {
        section: "examenes",
        crumbs: [examenesCrumb, crumb(examName(exam))],
        key: `examen:${exam.id}`,
        page: <ExamDetailPage data={data} exam={exam} reload={reload} enroll={route.enroll} />,
      };
    }
    case "examen-editar": {
      const exam = data.exams.find((item) => item.id === route.examId);
      const examenesCrumb = crumb("Exámenes", paths.examenes);
      if (!exam)
        return missing(
          "examenes",
          [examenesCrumb],
          "Examen no encontrado",
          examenesCrumb.to,
          "los exámenes",
        );
      return {
        section: "examenes",
        crumbs: [examenesCrumb, crumb("Editar examen")],
        key: `examen-editar:${exam.id}`,
        page: <ExamEditPage data={data} exam={exam} reload={reload} />,
      };
    }
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
        page: <ConfiguracionPage data={data} onReset={onReset} reload={reload} />,
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
