import { useMemo, useState, type FormEvent } from "react";
import type { Bootstrap, Payment, PaymentWrite } from "../../shared/api/contracts";
import { date, money } from "../../shared/lib/format";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Dialog } from "../../shared/ui/Dialog";
import { Money } from "../../shared/ui/Money";
import { Notice } from "../../shared/ui/PageHeader";
import { DataTable } from "../../shared/ui/DataTable";
import { EditButton } from "../../shared/ui/EditButton";
import { FilterSelect } from "../../shared/ui/FilterSelect";
import { ListTools } from "../../shared/ui/ListTools";
import { Status } from "../../shared/ui/Status";
import { monthLabel } from "../reportes/model/reportes.model";
import {
  chargePresentation,
  filterPaymentLines,
  paymentLines,
  paymentsCsv,
} from "./model/pagos.model";
import { correctPayment, voidPayment as voidPaymentRequest } from "./api/pagos.api";

export function PaymentHistory({ data, reload }: { data: Bootstrap; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [voiding, setVoiding] = useState<Payment | null>(null);
  const [filters, setFilters] = useState({ query: "", month: "", category: "" });
  const lines = useMemo(() => paymentLines(data), [data]);
  const months = useMemo(
    () => [...new Set(lines.map((line) => line.payment.date.slice(0, 7)))],
    [lines],
  );
  const shown = useMemo(() => filterPaymentLines(lines, filters), [lines, filters]);
  function download() {
    const url = URL.createObjectURL(
      new Blob([paymentsCsv(shown)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `pagos${filters.month ? `-${filters.month}` : ""}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
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
    <>
      {error && !editing && <Notice kind="error">{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <ListTools
        searchId="payment-search"
        searchLabel="Buscar alumno o concepto"
        query={filters.query}
        onQuery={(event) => setFilters({ ...filters, query: event.target.value })}
        action={
          <button className="button export" disabled={!shown.length} onClick={download}>
            Descargar lista (CSV)
          </button>
        }
        filters={
          <>
            <FilterSelect
              id="payment-month"
              label="Periodo"
              value={filters.month}
              onChange={(event) => setFilters({ ...filters, month: event.target.value })}
            >
              <option value="">Todos</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {monthLabel(month)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              id="payment-category"
              label="Tipo de cobro"
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            >
              <option value="">Todos</option>
              <option>Mensualidades</option>
              <option>Exámenes</option>
              <option>Pedidos</option>
            </FilterSelect>
          </>
        }
      />
      <DataTable
        rows={shown}
        rowKey={({ payment }) => payment.id}
        empty={{ title: "Sin pagos", text: "Cambia la búsqueda o los filtros." }}
        columns={[
          { header: "Fecha", cell: ({ payment }) => date(payment.date) },
          { header: "Alumno", primary: true, cell: ({ student }) => <strong>{student}</strong> },
          { header: "Concepto", cell: ({ concept }) => concept },
          { header: "Forma", cell: ({ payment }) => payment.method || "Sin especificar" },
          {
            header: "Estado",
            cell: ({ payment }) => (
              <Status tone={payment.valid ? "success" : "danger"}>
                {payment.valid ? "Saldado" : "Anulado"}
              </Status>
            ),
          },
          { header: "Importe", cell: ({ payment }) => <Money value={payment.amount} /> },
          {
            header: "Acciones",
            actions: true,
            cell: ({ payment }) =>
              payment.valid && (
                <>
                  <button
                    className="button secondary small danger"
                    onClick={() => {
                      setMessage("");
                      setVoiding(payment);
                    }}
                  >
                    Anular
                  </button>
                  <EditButton
                    onClick={() => {
                      setError("");
                      setEditing(payment);
                    }}
                  />
                </>
              ),
          },
        ]}
      />
      {voiding && (
        <ConfirmDialog
          title="Anular pago"
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
    </>
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
            El importe supera el máximo de {money(available)}.
          </span>
        )}
        {state && !overpayment && <span className="field-hint">Máximo {money(available)}</span>}
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
        <input
          id="edit-observation"
          name="observation"
          defaultValue={payment.reason}
          placeholder="Ej. Pagó en efectivo"
        />
      </div>
      <div className="field full-span">
        <label htmlFor="edit-reason">
          Motivo de la corrección <b>*</b>
        </label>
        <input
          id="edit-reason"
          name="reason"
          required
          placeholder="Ej. Se capturó mal el importe"
        />
      </div>
      <div className="form-actions full-span">
        {blockReason && (
          <span id="edit-block-reason" className="field-hint" role="status">
            {blockReason}
          </span>
        )}
        <button type="button" className="button danger" data-dialog-close onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="button confirm"
          aria-describedby={blockReason ? "edit-block-reason" : undefined}
          disabled={Boolean(blockReason)}
        >
          Aceptar
        </button>
      </div>
    </form>
  );
}
