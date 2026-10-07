import type { Bootstrap } from "../../shared/api/contracts";
import { date } from "../../shared/lib/format";
import { useState } from "react";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Money } from "../../shared/ui/Money";
import { PageHeader } from "../../shared/ui/PageHeader";
export function ConfiguracionPage({
  data,
  onReset,
}: {
  data: Bootstrap;
  onReset: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  async function reset(value: string) {
    if (value !== "RESTABLECER")
      throw new Error("Escribe RESTABLECER, en mayúsculas, para continuar.");
    await onReset();
  }
  return (
    <>
      <PageHeader help="Consulta los datos generales y parámetros operativos de la escuela." />
      <section className="card">
        <div className="card-body">
          <dl className="definition-grid">
            <div className="definition-item">
              <dt>Escuela</dt>
              <dd>{data.school.name}</dd>
            </div>
            <div className="definition-item">
              <dt>Propietaria</dt>
              <dd>{data.school.owner}</dd>
            </div>
            <div className="definition-item">
              <dt>Mensualidad general</dt>
              <dd>
                <Money value={data.school.fee} />
              </dd>
            </div>
            <div className="definition-item">
              <dt>Fecha operativa</dt>
              <dd>{date(data.demoDate)}</dd>
            </div>
          </dl>
        </div>
      </section>
      {data.demoMode && (
        <section className="card spacer-top">
          <div className="card-header">
            <div>
              <h2>Restablecimiento de datos</h2>
              <p>Recupera la información inicial de la escuela y cierra la sesión actual.</p>
            </div>
            <button className="button secondary danger" onClick={() => setConfirming(true)}>
              Restablecer datos
            </button>
          </div>
        </section>
      )}
      {confirming && (
        <ConfirmDialog
          title="Restablecer datos"
          confirmLabel="Restablecer datos"
          danger
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
