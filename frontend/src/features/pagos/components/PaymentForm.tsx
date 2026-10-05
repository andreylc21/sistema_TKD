import { useMemo, useRef, useState, type FormEvent } from "react";
import type { Bootstrap, Charge, PaymentWrite } from "../../../shared/api/contracts";
import { date, money } from "../../../shared/lib/format";
import { Empty, Notice } from "../../../shared/ui/PageHeader";
import { createPayment } from "../api/pagos.api";
import { chargePresentation } from "../model/pagos.model";

export function PaymentForm({
  data,
  charges,
  initialChargeId,
  onSaved,
  onCancel,
}: {
  data: Bootstrap;
  charges: Charge[];
  initialChargeId?: string;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const initialCharge = charges.find((charge) => charge.id === initialChargeId);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentId, setStudentId] = useState(initialCharge?.studentId ?? "");
  const [chargeId, setChargeId] = useState(initialCharge?.id ?? "");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(crypto.randomUUID());
  const students = useMemo(
    () =>
      data.students.filter(
        (student) =>
          charges.some((charge) => charge.studentId === student.id) &&
          student.name.toLocaleLowerCase("es").includes(studentQuery.toLocaleLowerCase("es")),
      ),
    [charges, data.students, studentQuery],
  );
  const studentCharges = charges.filter((charge) => charge.studentId === studentId);
  const selected = studentCharges.find((charge) => charge.id === chargeId);
  const state = selected ? chargePresentation(selected, data) : null;
  const numericAmount = Number(amount || 0);
  const overpayment = Boolean(state && numericAmount > state.balance);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || overpayment || numericAmount <= 0) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body: PaymentWrite = {
      chargeId: selected.id,
      amount,
      date: String(values.date),
      method: String(values.method) as PaymentWrite["method"],
      observation: String(values.observation || ""),
    };
    setBusy(true);
    setError("");
    try {
      await createPayment(body, idempotencyKey.current);
      idempotencyKey.current = crypto.randomUUID();
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar el pago.");
    } finally {
      setBusy(false);
    }
  }

  if (!charges.length)
    return (
      <>
        <Empty
          title="Sin cargos pendientes"
          text="No hay saldos disponibles para registrar un pago."
        />
        <div className="form-actions">
          <button className="button secondary" onClick={onCancel}>
            Cerrar
          </button>
        </div>
      </>
    );

  return (
    <form className="form-grid" onSubmit={submit}>
      {error && (
        <div className="full-span">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <div className="field full-span">
        <label htmlFor="student-search">Buscar alumno</label>
        <input
          id="student-search"
          type="search"
          value={studentQuery}
          onChange={(event) => setStudentQuery(event.target.value)}
          placeholder="Escribe parte del nombre"
        />
      </div>
      <div className="field full-span">
        <label htmlFor="payment-student">Alumno</label>
        <select
          id="payment-student"
          value={studentId}
          onChange={(event) => {
            setStudentId(event.target.value);
            setChargeId("");
            setAmount("");
          }}
          required
        >
          <option value="">Selecciona un alumno</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>
      {studentId && (
        <div className="field full-span">
          <label htmlFor="charge">Cargo con saldo</label>
          <select
            id="charge"
            value={chargeId}
            onChange={(event) => {
              setChargeId(event.target.value);
              setAmount("");
            }}
            required
          >
            <option value="">Selecciona un cargo</option>
            {studentCharges.map((charge) => (
              <option key={charge.id} value={charge.id}>
                {charge.concept} · saldo {money(chargePresentation(charge, data).balance)}
              </option>
            ))}
          </select>
        </div>
      )}
      {selected && state && (
        <div className="payment-summary full-span">
          <div>
            <span>Concepto</span>
            <strong>{selected.concept}</strong>
          </div>
          <div>
            <span>Vencimiento</span>
            <strong>{date(selected.due)}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{money(selected.total)}</strong>
          </div>
          <div>
            <span>Recibido</span>
            <strong>{money(state.received)}</strong>
          </div>
          <div>
            <span>Saldo actual</span>
            <strong>{money(state.balance)}</strong>
          </div>
          <div>
            <span>Saldo resultante</span>
            <strong>{money(Math.max(0, state.balance - numericAmount))}</strong>
          </div>
        </div>
      )}
      <div className="field">
        <label htmlFor="amount">Importe recibido</label>
        <input
          id="amount"
          name="amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          min="0.01"
          step="0.01"
          type="number"
          aria-invalid={overpayment}
          aria-describedby={overpayment ? "amount-error" : undefined}
          required
        />
        {overpayment && (
          <span id="amount-error" className="field-error">
            El importe supera el saldo de {money(state?.balance ?? 0)}.
          </span>
        )}
        {state && (
          <button
            type="button"
            className="text-button align-start"
            onClick={() => setAmount(state.balance.toFixed(2))}
          >
            Usar saldo completo
          </button>
        )}
      </div>
      <div className="field">
        <label htmlFor="pay-date">Fecha real de recepción</label>
        <input id="pay-date" name="date" type="date" defaultValue={data.demoDate} required />
      </div>
      <div className="field">
        <label htmlFor="method">
          Forma <span>(opcional)</span>
        </label>
        <select id="method" name="method">
          <option value="">Sin especificar</option>
          <option>Efectivo</option>
          <option>Transferencia</option>
          <option>Tarjeta</option>
          <option>Otro</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="observation">
          Comentario del pago <span>(opcional)</span>
        </label>
        <input id="observation" name="observation" />
      </div>
      <p className="help full-span">
        Registro manual: no comprueba automáticamente una transferencia bancaria.
      </p>
      <div className="form-actions full-span">
        <button type="button" className="button secondary" data-dialog-close onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="button"
          disabled={busy || !selected || overpayment || numericAmount <= 0}
        >
          {busy ? "Registrando…" : "Registrar pago"}
        </button>
      </div>
    </form>
  );
}
