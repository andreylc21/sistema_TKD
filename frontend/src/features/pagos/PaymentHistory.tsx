import { useState, type FormEvent } from "react";
import type { Bootstrap, Payment, PaymentWrite } from "../../shared/api/contracts";
import { date, money } from "../../shared/lib/format";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Dialog } from "../../shared/ui/Dialog";
import { Money } from "../../shared/ui/Money";
import { Notice } from "../../shared/ui/PageHeader";
import { PaymentSummary } from "./components/PaymentSummary";
import { chargePresentation } from "./model/pagos.model";
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
        <table className="financial-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Alumno</th>
              <th>Forma</th>
              <th>Estado</th>
              <th className="num">Importe</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.payments.map((payment) => (
              <tr key={payment.id}>
                <td className="nowrap">{date(payment.date)}</td>
                <td>{data.students.find((s) => s.id === payment.studentId)?.name}</td>
                <td>{payment.method || "Sin especificar"}</td>
                <td>
                  <span className={`badge ${payment.valid ? "success" : "danger"}`}>
                    {payment.valid ? "Vigente" : "Anulado"}
                  </span>
                </td>
                <td className="num">
                  <Money value={payment.amount} />
                </td>
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
          <CorrectionForm
            data={data}
            payment={editing}
            error={error}
            onSubmit={correct}
            onCancel={() => setEditing(null)}
          />
        </Dialog>
      )}
    </section>
  );
}

function CorrectionForm({
  data,
  payment,
  error,
  onSubmit,
  onCancel,
}: {
  data: Bootstrap;
  payment: Payment;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const [chargeId, setChargeId] = useState(payment.chargeId);
  const [amount, setAmount] = useState(payment.amount.toFixed(2));
  const charges = data.charges.filter((charge) => charge.studentId === payment.studentId);
  const charge = charges.find((item) => item.id === chargeId);
  const state = charge ? chargePresentation(charge, data) : null;
  // El pago que se corrige ya cuenta en el saldo de su cargo actual: se devuelve para comparar.
  const own = chargeId === payment.chargeId ? payment.amount : 0;
  const received = state ? state.received - own : 0;
  const available = state ? state.balance + own : 0;
  const numericAmount = Number(amount || 0);
  const overpayment = Boolean(state && numericAmount > available);
  const blockReason = !charge
    ? "Selecciona el concepto."
    : numericAmount <= 0
      ? "Escribe un importe mayor a $0."
      : overpayment
        ? "Reduce el importe: supera el saldo."
        : "";
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      {error && (
        <div className="full-span">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <div className="field full-span">
        <label htmlFor="edit-charge">Concepto</label>
        <select
          id="edit-charge"
          name="chargeId"
          value={chargeId}
          onChange={(event) => setChargeId(event.target.value)}
        >
          {charges.map((item) => (
            <option value={item.id} key={item.id}>
              {item.concept}
            </option>
          ))}
        </select>
      </div>
      {charge && (
        <PaymentSummary
          charge={charge}
          received={received}
          balance={available}
          amount={numericAmount}
        />
      )}
      <div className="field">
        <label htmlFor="edit-amount">Importe</label>
        <input
          id="edit-amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-invalid={overpayment}
          aria-describedby={overpayment ? "edit-amount-error" : undefined}
          required
        />
        {overpayment && (
          <span id="edit-amount-error" className="field-error">
            El importe supera el saldo disponible de {money(available)}.
          </span>
        )}
        {state && (
          <button
            type="button"
            className="text-button align-start"
            onClick={() => setAmount(available.toFixed(2))}
          >
            Usar saldo completo
          </button>
        )}
      </div>
      <div className="field">
        <label htmlFor="edit-date">Fecha recibida</label>
        <input id="edit-date" name="date" type="date" defaultValue={payment.date} required />
      </div>
      <div className="field">
        <label htmlFor="edit-method">Forma</label>
        <select id="edit-method" name="method" defaultValue={payment.method}>
          <option value="">Sin especificar</option>
          <option>Efectivo</option>
          <option>Transferencia</option>
          <option>Tarjeta</option>
          <option>Otro</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="edit-observation">Comentario del pago</label>
        <input id="edit-observation" name="observation" defaultValue={payment.reason} />
      </div>
      <div className="field full-span">
        <label htmlFor="edit-reason">
          Motivo de la corrección <b>*</b>
        </label>
        <input id="edit-reason" name="reason" required />
      </div>
      <div className="form-actions full-span">
        {blockReason && (
          <span id="edit-block-reason" className="field-hint" role="status">
            {blockReason}
          </span>
        )}
        <button type="button" className="button secondary" data-dialog-close onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="button"
          aria-describedby={blockReason ? "edit-block-reason" : undefined}
          disabled={Boolean(blockReason)}
        >
          Guardar corrección
        </button>
      </div>
    </form>
  );
}
