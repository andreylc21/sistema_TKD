import { PageHeader } from "../../shared/ui/PageHeader";
export function ExamenesPage() {
  return (
    <>
      <PageHeader help="Consulta antecedentes de evaluación separados de notas y pagos actuales." />
      <section className="card">
        <div className="card-body">
          <h2>Examen de octubre</h2>
          <p>
            Esta pantalla muestra el antecedente de evaluación en modo consulta. Los cargos de
            examen se revisan en Pagos.
          </p>
        </div>
      </section>
    </>
  );
}
