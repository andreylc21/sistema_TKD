import { useState, type FormEvent } from "react";
import type { Bootstrap, Payment, PaymentWrite } from "../../shared/api/contracts";
import { date, money } from "../../shared/lib/format";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Dialog } from "../../shared/ui/Dialog";
import { Notice } from "../../shared/ui/PageHeader";
import { correctPayment, voidPayment as voidPaymentRequest } from "./api/pagos.api";

export function PaymentHistory({ data, reload }: { data: Bootstrap; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [voiding, setVoiding] = useState<Payment | null>(null);
  async function correct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const v = Object.fromEntries(new FormData(e.currentTarget));
    setError("");
    try {
      const body: PaymentWrite = {
        chargeId: String(v.chargeId),
        amount: String(v.amount),
        date: String(v.date),
        method: String(v.method) as PaymentWrite["method"],
        observation: String(v.observation || ""),
        reason: String(v.reason),
        version: editing.version,
      };
      await correctPayment(editing.id, body);
      setEditing(null);
      await reload();
      setMessage("Pago corregido; saldo y estados actualizados.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo corregir.");
    }
  }
  async function voidPayment(payment: Payment, reason: string) {
    await voidPaymentRequest(payment.id, { reason, version: payment.version });
    setVoiding(null);
    setMessage("");
    await reload();
    setMessage("Pago anulado; el importe dejó de contar en el saldo recibido.");
  }
  return (
    <section className="card spacer-top">
      <div className="card-header">
        <div>
          <h2>Pagos registrados</h2>
          <p>Movimientos manuales; los anulados no cuentan como ingreso vigente.</p>
        </div>
      </div>
      {error && !editing && <Notice kind="error">{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Alumno</th>
              <th>Forma</th>
              <th>Estado</th>
              <th>Importe</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.payments.map((payment) => (
              <tr key={payment.id}>
                <td>{date(payment.date)}</td>
                <td>{data.students.find((s) => s.id === payment.studentId)?.name}</td>
                <td>{payment.method || "Sin especificar"}</td>
                <td>
                  <span className={`badge ${payment.valid ? "success" : "danger"}`}>
                    {payment.valid ? "Vigente" : "Anulado"}
                  </span>
                </td>
                <td>{money(payment.amount)}</td>
                <td>
                  {payment.valid && (
                    <div className="inline-actions">
                      <button
                        className="text-button"
                        onClick={() => {
                          setError("");
                          setEditing(payment);
                        }}
                      >
                        Corregir
                      </button>
                      <button
                        className="text-button danger"
                        onClick={() => {
                          setMessage("");
                          setVoiding(payment);
                        }}
                      >
                        Anular
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {voiding && (
        <ConfirmDialog
          title="Anular pago"
          confirmLabel="Anular pago"
          danger
          field={{ label: "Motivo de la anulación" }}
          onConfirm={(reason) => voidPayment(voiding, reason)}
          onCancel={() => setVoiding(null)}
        >
          {voiding.method || "Sin especificar"} · {money(voiding.amount)} · {date(voiding.date)}. El
          pago dejará de contar como ingreso y se conservará en el historial.
        </ConfirmDialog>
      )}
      {editing && (
        <Dialog title="Corregir pago" onClose={() => setEditing(null)}>
          <form className="form-grid" onSubmit={correct}>
            {error && (
              <div className="full-span">
                <Notice kind="error">{error}</Notice>
              </div>
            )}
            <div className="field full-span">
              <label htmlFor="edit-charge">Concepto</label>
              <select id="edit-charge" name="chargeId" defaultValue={editing.chargeId}>
                {data.charges
                  .filter((c) => c.studentId === editing.studentId)
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.concept}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-amount">Importe</label>
              <input
                id="edit-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={editing.amount.toFixed(2)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="edit-date">Fecha recibida</label>
              <input id="edit-date" name="date" type="date" defaultValue={editing.date} required />
            </div>
            <div className="field">
              <label htmlFor="edit-method">Forma</label>
              <select id="edit-method" name="method" defaultValue={editing.method}>
                <option value="">Sin especificar</option>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta</option>
                <option>Otro</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-observation">Comentario del pago</label>
              <input id="edit-observation" name="observation" defaultValue={editing.reason} />
            </div>
            <div className="field full-span">
              <label htmlFor="edit-reason">
                Motivo de la corrección <b>*</b>
              </label>
              <input id="edit-reason" name="reason" required />
            </div>
            <div className="form-actions full-span">
              <button
                type="button"
                className="button secondary"
                data-dialog-close
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <button className="button">Guardar corrección</button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
