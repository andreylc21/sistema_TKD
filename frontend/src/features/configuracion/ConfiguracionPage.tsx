import { useState } from "react";
import type { Bootstrap } from "../../shared/api/contracts";
import { Card } from "../../shared/ui/Card";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { EditButton } from "../../shared/ui/EditButton";
import { PageHeader } from "../../shared/ui/PageHeader";
import { Tabs } from "../../shared/ui/Tabs";
import { CatalogTable } from "./components/CatalogCard";
import { GradesTable } from "./components/GradesCard";
import { SchoolForm } from "./components/SchoolForm";

const tabs = [
  { id: "escuela", label: "Escuela" },
  { id: "articulos", label: "Artículos" },
  { id: "grados", label: "Grados" },
] as const;
type Tab = (typeof tabs)[number]["id"];

export function ConfiguracionPage({
  data,
  onReset,
  reload,
}: {
  data: Bootstrap;
  onReset: () => Promise<void>;
  reload: () => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("escuela");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function reset(value: string) {
    if (value !== "RESTABLECER")
      throw new Error("Escribe RESTABLECER, en mayúsculas, para continuar.");
    await onReset();
  }

  function change(next: Tab) {
    setTab(next);
    setAdding(false);
  }

  return (
    <>
      <PageHeader help="Escuela: nombre, propietaria y mensualidad. Artículos: catálogo para los pedidos. Grados: lista de cintas; al terminar las de color, el alumno puede pasar al examen de cinta negra." />
      <Tabs
        label="Configuración"
        items={tabs}
        value={tab}
        onChange={change}
        action={
          tab === "articulos" ? (
            <button className="button" onClick={() => setAdding(true)}>
              Agregar artículo
            </button>
          ) : tab === "grados" ? (
            <button className="button" onClick={() => setAdding(true)}>
              Agregar grado
            </button>
          ) : undefined
        }
      />
      {tab === "escuela" && (
        <>
          <Card
            title="Datos de la escuela"
            padded
            actions={!editing && <EditButton onClick={() => setEditing(true)} />}
          >
            <SchoolForm
              key={editing ? "edit" : "view"}
              school={data.school}
              today={data.demoDate}
              readOnly={!editing}
              onDone={async () => {
                await reload();
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          </Card>
          {data.demoMode && (
            <Card
              title="Restablecimiento de datos"
              className="spacer-top"
              actions={
                <button
                  className="button secondary small danger"
                  onClick={() => setConfirming(true)}
                >
                  Restablecer datos
                </button>
              }
            >
              <p className="help card-note">
                Recupera la información inicial de la escuela y cierra la sesión actual.
              </p>
            </Card>
          )}
        </>
      )}
      {tab === "articulos" && (
        <CatalogTable
          data={data}
          reload={reload}
          adding={adding}
          onCloseAdd={() => setAdding(false)}
        />
      )}
      {tab === "grados" && (
        <GradesTable
          data={data}
          reload={reload}
          adding={adding}
          onCloseAdd={() => setAdding(false)}
        />
      )}
      {confirming && (
        <ConfirmDialog
          title="Restablecer datos"
          field={{ label: "Escribe RESTABLECER para confirmar" }}
          onConfirm={reset}
          onCancel={() => setConfirming(false)}
        >
          Se eliminarán los cambios guardados y se cerrará la sesión.
        </ConfirmDialog>
      )}
    </>
  );
}
