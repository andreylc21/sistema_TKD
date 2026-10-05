import { useCallback, useEffect, useState } from "react";
import { bootstrap, logout, request, ApiError } from "../shared/api/client";
import type { Bootstrap } from "../shared/api/contracts";
import { AppLayout, type Section } from "../shared/layout/AppLayout";
import { LoginPage } from "../features/acceso/LoginPage";
import { InicioPage } from "../features/inicio/InicioPage";
import { AlumnosPage } from "../features/alumnos/AlumnosPage";
import { ClasesPage } from "../features/clases/ClasesPage";
import { PagosPage, type PaymentsTarget } from "../features/pagos/PagosPage";
import { ExamenesPage } from "../features/examenes/ExamenesPage";
import { CalendarioPage } from "../features/calendario/CalendarioPage";
import { ReportesPage } from "../features/reportes/ReportesPage";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";
import { ConfiguracionPage } from "../features/configuracion/ConfiguracionPage";
export function App() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [section, setSection] = useState<Section>("inicio");
  const [studentFocus, setStudentFocus] = useState<string>();
  const [classFocus, setClassFocus] = useState<string>();
  const [paymentsTarget, setPaymentsTarget] = useState<PaymentsTarget>();
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
  let page;
  switch (section) {
    case "alumnos":
      page = <AlumnosPage data={data} reload={load} focusStudentId={studentFocus} />;
      break;
    case "clases":
      page = (
        <ClasesPage
          data={data}
          reload={load}
          initialSessionId={classFocus}
          onStudent={(studentId) => {
            setStudentFocus(studentId);
            setSection("alumnos");
          }}
        />
      );
      break;
    case "pagos":
      page = <PagosPage data={data} reload={load} initialTarget={paymentsTarget} />;
      break;
    case "examenes":
      page = <ExamenesPage />;
      break;
    case "calendario":
      page = <CalendarioPage data={data} />;
      break;
    case "reportes":
      page = <ReportesPage data={data} />;
      break;
    case "configuracion":
      page = <ConfiguracionPage data={data} onReset={resetData} />;
      break;
    default:
      page = (
        <InicioPage
          data={data}
          onClasses={() => {
            setClassFocus(undefined);
            setSection("clases");
          }}
          onClass={(session) => {
            setClassFocus(session.id);
            setSection("clases");
          }}
          onPayments={(target) => {
            setPaymentsTarget(target);
            setSection("pagos");
          }}
          onStudent={(studentId) => {
            setStudentFocus(studentId);
            setSection("alumnos");
          }}
        />
      );
  }
  return (
    <AppLayout
      section={section}
      onSection={(next) => {
        setClassFocus(undefined);
        setPaymentsTarget(undefined);
        setStudentFocus(undefined);
        setSection(next);
      }}
      school={data.school.name}
      date={data.demoDate}
      onLogout={closeSession}
    >
      <ErrorBoundary key={section}>{page}</ErrorBoundary>
    </AppLayout>
  );
}
