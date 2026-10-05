import { useRef, useState, type FormEvent } from "react";
import type { Bootstrap, OrderWrite } from "../../../shared/api/contracts";
import { Notice } from "../../../shared/ui/PageHeader";
import { createOrder } from "../api/pagos.api";

export function OrderForm({
  data,
  onSaved,
  onCancel,
}: {
  data: Bootstrap;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(crypto.randomUUID());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const items: OrderWrite["items"] = [
      {
        name: String(values.itemName),
        size: String(values.size || ""),
        quantity: Number(values.quantity),
        price: String(values.price),
      },
      {
        name: String(values.itemName2 || ""),
        size: String(values.size2 || ""),
        quantity: Number(values.quantity2 || 0),
        price: String(values.price2 || "0"),
      },
    ].filter((item) => item.name && item.quantity > 0);
    const body: OrderWrite = {
      studentId: String(values.studentId),
      dueDate: String(values.dueDate),
      items,
    };
    setBusy(true);
    setError("");
    try {
      await createOrder(body, idempotencyKey.current);
      idempotencyKey.current = crypto.randomUUID();
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el pedido.");
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
        <select id="order-student" name="studentId" required>
          {data.students
            .filter((student) => student.status === "Activo")
            .map((student) => (
              <option value={student.id} key={student.id}>
                {student.name}
              </option>
            ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="due">Fecha límite de pago</label>
        <input id="due" name="dueDate" type="date" defaultValue={data.demoDate} required />
      </div>
      <div />
      <OrderItemFields suffix="" label="Artículo 1" required />
      <OrderItemFields suffix="2" label="Artículo 2" />
      <div className="form-actions full-span">
        <button type="button" className="button secondary" data-dialog-close onClick={onCancel}>
          Cancelar
        </button>
        <button className="button" disabled={busy}>
          {busy ? "Creando…" : "Crear pedido y sus cobros"}
        </button>
      </div>
    </form>
  );
}

function OrderItemFields({
  suffix,
  label,
  required = false,
}: {
  suffix: string;
  label: string;
  required?: boolean;
}) {
  return (
    <>
      <div className="field">
        <label htmlFor={`item${suffix}`}>
          {label}
          {!required && " (opcional)"}
        </label>
        <input id={`item${suffix}`} name={`itemName${suffix}`} required={required} />
      </div>
      <div className="field">
        <label htmlFor={`size${suffix}`}>Talla o medida</label>
        <input id={`size${suffix}`} name={`size${suffix}`} />
      </div>
      <div className="field">
        <label htmlFor={`quantity${suffix}`}>Cantidad</label>
        <input
          id={`quantity${suffix}`}
          name={`quantity${suffix}`}
          type="number"
          min={required ? 1 : 0}
          defaultValue={required ? 1 : 0}
          required={required}
        />
      </div>
      <div className="field">
        <label htmlFor={`price${suffix}`}>Precio unitario</label>
        <input
          id={`price${suffix}`}
          name={`price${suffix}`}
          type="number"
          min="0"
          step="0.01"
          required={required}
        />
      </div>
    </>
  );
}
