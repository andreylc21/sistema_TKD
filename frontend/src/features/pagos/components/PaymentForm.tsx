import { useMemo, useRef, useState, type FormEvent } from "react";
import type { Bootstrap, Charge, PaymentWrite } from "../../../shared/api/contracts";
import { date, money } from "../../../shared/lib/format";
import { Empty, Notice } from "../../../shared/ui/PageHeader";
import { createPayment } from "../api/pagos.api";
import { chargePresentation } from "../model/pagos.model";
import { PaymentSummary } from "./PaymentSummary";

export function PaymentForm({
  data,
  charges,
  initialChargeId,
  initialStudentId,
  onSaved,
  onCancel,
}: {
  data: Bootstrap;
  charges: Charge[];
  initialChargeId?: string;
  initialStudentId?: string;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const initialCharge = charges.find((charge) => charge.id === initialChargeId);
  const startStudent = initialCharge?.studentId ?? initialStudentId ?? "";
  const startCharges = charges.filter((charge) => charge.studentId === startStudent);
  const [studentId, setStudentId] = useState(startStudent);
  // Con un solo cargo pendiente no hay nada que elegir: queda seleccionado.
  const [chargeId, setChargeId] = useState(
    initialCharge?.id ?? (startCharges.length === 1 ? startCharges[0].id : ""),
  );
  const [amount, setAmount] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(crypto.randomUUID());
  // Sólo alumnos con saldo pendiente, en orden alfabético y con su saldo para confirmar la elección.
  const students = useMemo(
    () =>
      data.students
        .map((student) => ({
          student,
          balance: charges
            .filter((charge) => charge.studentId === student.id)
            .reduce((sum, charge) => sum + chargePresentation(charge, data).balance, 0),
        }))
        .filter(({ balance }) => balance > 0)
        .sort((left, right) => left.student.name.localeCompare(right.student.name, "es")),
    [charges, data],
  );
  const studentCharges = charges
    .filter((charge) => charge.studentId === studentId)
    .sort((left, right) => left.due.localeCompare(right.due));
  const categories = [...new Set(studentCharges.map((charge) => charge.category))];
  const visibleCharges = studentCharges.filter(
    (charge) => !typeFilter || charge.category === typeFilter,
  );
  const owedTotal = studentCharges.reduce(
    (sum, charge) => sum + chargePresentation(charge, data).balance,
    0,
  );
  const selected = studentCharges.find((charge) => charge.id === chargeId);
  const state = selected ? chargePresentation(selected, data) : null;
  const numericAmount = Number(amount || 0);
  const overpayment = Boolean(state && numericAmount > state.balance);
  const blockReason = !studentId
    ? "Selecciona un alumno."
    : !selected
      ? "Selecciona el cargo que se está pagando."
      : numericAmount <= 0
        ? "Escribe un importe mayor a $0."
        : overpayment
          ? "Reduce el importe: supera el saldo."
          : "";

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
        <label htmlFor="payment-student">Alumno</label>
        <select
          id="payment-student"
          value={studentId}
          onChange={(event) => {
            const next = charges.filter((charge) => charge.studentId === event.target.value);
            setStudentId(event.target.value);
            setTypeFilter("");
            // Con un solo cargo pendiente no hay nada que elegir: queda seleccionado.
            setChargeId(next.length === 1 ? next[0].id : "");
            setAmount(
              next.length === 1 ? chargePresentation(next[0], data).balance.toFixed(2) : "",
            );
          }}
          required
        >
          <option value="">Selecciona un alumno</option>
          {students.map(({ student, balance }) => (
            <option key={student.id} value={student.id}>
              {student.name} · saldo {money(balance)}
            </option>
          ))}
        </select>
      </div>
      {studentId && (
        <fieldset className="full-span account">
          <legend>
            Lo que debe · <strong>{money(owedTotal)}</strong>
          </legend>
          {categories.length > 1 && (
            <div className="chip-row" role="group" aria-label="Filtrar por tipo de cargo">
              {["", ...categories].map((category) => (
                <button
                  key={category || "all"}
                  type="button"
                  className={`chip ${typeFilter === category ? "active" : ""}`}
                  aria-pressed={typeFilter === category}
                  onClick={() => setTypeFilter(category)}
                >
                  {category || "Todos"}
                </button>
              ))}
            </div>
          )}
          <ul className="account-list">
            {visibleCharges.map((charge) => {
              const balance = chargePresentation(charge, data).balance;
              return (
                <li key={charge.id}>
                  <label className={`account-row ${charge.id === chargeId ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="charge"
                      checked={charge.id === chargeId}
                      onChange={() => {
                        setChargeId(charge.id);
                        setAmount(balance.toFixed(2));
                      }}
                    />
                    <span className="account-concept">
                      <strong>{charge.concept}</strong>
                      <span className="muted">
                        {charge.category} · vence {date(charge.due)}
                      </span>
                    </span>
                    <strong>{money(balance)}</strong>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
      {selected && state && (
        <PaymentSummary
          charge={selected}
          received={state.received}
          balance={state.balance}
          amount={numericAmount}
        />
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
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancelar
        </button>
        {blockReason && !busy && (
          <span id="payment-block-reason" className="field-hint" role="status">
            {blockReason}
          </span>
        )}
        <button
          className="button"
          aria-describedby={blockReason ? "payment-block-reason" : undefined}
          disabled={busy || Boolean(blockReason)}
        >
          {busy ? "Registrando…" : "Registrar pago"}
        </button>
      </div>
    </form>
  );
}
