import { useRef, useState, type FormEvent } from "react";
import type { Bootstrap, OrderWrite } from "../../../shared/api/contracts";
import { money } from "../../../shared/lib/format";
import { Notice } from "../../../shared/ui/PageHeader";
import { createOrder } from "../../pagos/api/pagos.api";

type Line = { key: string; name: string; size: string; quantity: string; price: string };
const newLine = (): Line => ({
  key: crypto.randomUUID(),
  name: "",
  size: "",
  quantity: "1",
  price: "",
});

/** Registro rápido: alumno, artículos y, por defecto, el pedido ya pagado. */
export function OrderForm({
  data,
  onSaved,
  onCancel,
}: {
  data: Bootstrap;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [paidNow, setPaidNow] = useState(true);
  const [delivered, setDelivered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(crypto.randomUUID());
  const total = lines.reduce(
    (sum, line) => sum + Number(line.quantity || 0) * Number(line.price || 0),
    0,
  );

  const update = (key: string, patch: Partial<Line>) =>
    setLines((previous) =>
      previous.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const items: OrderWrite["items"] = lines
      .filter((line) => line.name.trim() && Number(line.quantity) > 0)
      .map((line) => ({
        name: line.name.trim(),
        size: line.size.trim(),
        quantity: Number(line.quantity),
        price: line.price || "0",
      }));
    const body: OrderWrite = {
      studentId: String(values.studentId),
      dueDate: String(paidNow ? values.paidOn : values.dueDate),
      items,
      delivered,
      ...(paidNow
        ? {
            payment: {
              date: String(values.paidOn),
              method: String(values.method) as NonNullable<OrderWrite["payment"]>["method"],
            },
          }
        : {}),
    };
    setBusy(true);
    setError("");
    try {
      await createOrder(body, idempotencyKey.current);
      idempotencyKey.current = crypto.randomUUID();
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar el pedido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      {error && (
        <div className="full-span">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <div className="field full-span">
        <label htmlFor="order-student">Alumno</label>
        <select id="order-student" name="studentId" required defaultValue="">
          <option value="" disabled>
            Selecciona un alumno
          </option>
          {data.students
            .filter((student) => student.status === "Activo")
            .sort((a, b) => a.name.localeCompare(b.name, "es"))
            .map((student) => (
              <option value={student.id} key={student.id}>
                {student.name}
              </option>
            ))}
        </select>
      </div>
      <fieldset className="full-span order-lines">
        <legend>Artículos</legend>
        {lines.map((line, index) => (
          <div className="order-line" key={line.key}>
            <div className="field order-line-name">
              <label htmlFor={`item-${line.key}`}>
                {index === 0 ? "Artículo" : `Artículo ${index + 1}`}
              </label>
              <input
                id={`item-${line.key}`}
                value={line.name}
                onChange={(event) => update(line.key, { name: event.target.value })}
                required={index === 0}
              />
            </div>
            <div className="field">
              <label htmlFor={`size-${line.key}`}>Talla</label>
              <input
                id={`size-${line.key}`}
                value={line.size}
                onChange={(event) => update(line.key, { size: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor={`qty-${line.key}`}>Cant.</label>
              <input
                id={`qty-${line.key}`}
                type="number"
                min="1"
                value={line.quantity}
                onChange={(event) => update(line.key, { quantity: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor={`price-${line.key}`}>Precio</label>
              <input
                id={`price-${line.key}`}
                type="number"
                min="0"
                step="0.01"
                value={line.price}
                onChange={(event) => update(line.key, { price: event.target.value })}
                required={index === 0}
              />
            </div>
            {lines.length > 1 && (
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setLines((previous) => previous.filter((item) => item.key !== line.key))
                }
              >
                Quitar
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-button align-start"
          onClick={() => setLines([...lines, newLine()])}
        >
          + Agregar artículo
        </button>
        <p className="order-total">
          Total: <strong>{money(total)}</strong>
        </p>
      </fieldset>
      <label className="check full-span">
        <input
          type="checkbox"
          checked={paidNow}
          onChange={(event) => setPaidNow(event.target.checked)}
        />
        Pagado completo al registrar
      </label>
      {paidNow ? (
        <>
          <div className="field">
            <label htmlFor="paid-on">Fecha del pago</label>
            <input id="paid-on" name="paidOn" type="date" defaultValue={data.demoDate} required />
          </div>
          <div className="field">
            <label htmlFor="pay-method">
              Forma <span>(opcional)</span>
            </label>
            <select id="pay-method" name="method">
              <option value="">Sin especificar</option>
              <option>Efectivo</option>
              <option>Transferencia</option>
              <option>Tarjeta</option>
              <option>Otro</option>
            </select>
          </div>
        </>
      ) : (
        <div className="field full-span">
          <label htmlFor="due">Fecha límite de pago</label>
          <input id="due" name="dueDate" type="date" defaultValue={data.demoDate} required />
          <span className="field-hint">El saldo quedará pendiente en Cobros.</span>
        </div>
      )}
      <label className="check full-span">
        <input
          type="checkbox"
          checked={delivered}
          onChange={(event) => setDelivered(event.target.checked)}
        />
        Ya se entregó al alumno
      </label>
      <div className="form-actions full-span">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button" disabled={busy}>
          {busy ? "Registrando…" : "Registrar pedido"}
        </button>
      </div>
    </form>
  );
}
