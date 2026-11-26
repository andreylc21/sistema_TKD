import { useRef, useState, type FormEvent } from "react";
import type { Bootstrap, OrderWrite } from "../../../shared/api/contracts";
import { money } from "../../../shared/lib/format";
import { Notice } from "../../../shared/ui/PageHeader";
import { createCatalogItem } from "../../configuracion/api/configuracion.api";
import { createOrder } from "../../pagos/api/pagos.api";

/** catalogId vacío = artículo escrito a mano ("Otro artículo"). */
type Line = {
  key: string;
  catalogId: string;
  name: string;
  size: string;
  quantity: string;
  price: string;
  save: boolean;
};
const OTHER = "other";
const newLine = (): Line => ({
  key: crypto.randomUUID(),
  catalogId: "",
  name: "",
  save: false,
  size: "",
  quantity: "1",
  price: "",
});

/** Registro rápido: alumno, artículos y forma de pago. Registrar un pedido es pagarlo completo. */
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
      dueDate: data.demoDate,
      items,
      delivered,
      payment: {
        date: data.demoDate,
        method: String(values.method) as NonNullable<OrderWrite["payment"]>["method"],
      },
    };
    setBusy(true);
    setError("");
    try {
      await createOrder(body, idempotencyKey.current);
      idempotencyKey.current = crypto.randomUUID();
      // Los artículos nuevos que se marcaron se guardan en el catálogo; si ya existían, no pasa nada.
      for (const line of lines.filter((item) => item.catalogId === OTHER && item.save)) {
        if (!line.name.trim() || !line.price) continue;
        try {
          await createCatalogItem({
            name: line.name.trim(),
            sizes: line.size.trim() ? [line.size.trim()] : [],
            price: line.price,
          });
        } catch {
          /* ya estaba en el catálogo */
        }
      }
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar el pedido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-grid enroll-form" onSubmit={submit}>
      {error && (
        <div className="full-span">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <div className="field">
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
      <div className="field">
        <label htmlFor="pay-method">Forma de pago</label>
        <select id="pay-method" name="method" defaultValue="Efectivo">
          <option>Efectivo</option>
          <option>Transferencia</option>
          <option>Tarjeta</option>
          <option>Otro</option>
        </select>
      </div>
      <fieldset className="full-span order-lines">
        <legend>Artículos</legend>
        {lines.map((line, index) => {
          const item = data.catalog.find((entry) => entry.id === line.catalogId);
          const custom = line.catalogId === OTHER;
          return (
            <div className="order-line" key={line.key}>
              <div className="field order-line-name">
                <label htmlFor={`item-${line.key}`}>
                  {index === 0 ? "Artículo" : `Artículo ${index + 1}`}
                </label>
                <select
                  id={`item-${line.key}`}
                  value={line.catalogId}
                  required={index === 0}
                  onChange={(event) => {
                    const value = event.target.value;
                    const picked = data.catalog.find((entry) => entry.id === value);
                    update(line.key, {
                      catalogId: value,
                      name: picked?.name ?? "",
                      size: "",
                      price: picked ? picked.price.toFixed(2) : "",
                      save: false,
                    });
                  }}
                >
                  <option value="" disabled>
                    Elige un artículo
                  </option>
                  {data.catalog.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                  <option value={OTHER}>Otro artículo…</option>
                </select>
                {custom && (
                  <input
                    aria-label="Nombre del artículo"
                    placeholder="Nombre del artículo"
                    value={line.name}
                    onChange={(event) => update(line.key, { name: event.target.value })}
                    required
                  />
                )}
              </div>
              <div className="field">
                <label htmlFor={`size-${line.key}`}>Talla</label>
                {item && item.sizes.length ? (
                  <select
                    id={`size-${line.key}`}
                    value={line.size}
                    onChange={(event) => update(line.key, { size: event.target.value })}
                    required
                  >
                    <option value="" disabled>
                      Elige
                    </option>
                    {item.sizes.map((size) => (
                      <option key={size}>{size}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`size-${line.key}`}
                    value={line.size}
                    disabled={Boolean(item)}
                    onChange={(event) => update(line.key, { size: event.target.value })}
                    placeholder="Ej. 140"
                  />
                )}
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
                  placeholder="Ej. 450.00"
                />
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setLines((previous) => previous.filter((entry) => entry.key !== line.key))
                  }
                >
                  Quitar
                </button>
              )}
              {custom && (
                <label className="check order-line-save">
                  <input
                    type="checkbox"
                    checked={line.save}
                    onChange={(event) => update(line.key, { save: event.target.checked })}
                  />
                  Guardar en el catálogo
                </label>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className="text-button align-start"
          onClick={() => setLines([...lines, newLine()])}
        >
          + Agregar artículo
        </button>
      </fieldset>
      <label className="check full-span">
        <input
          type="checkbox"
          checked={delivered}
          onChange={(event) => setDelivered(event.target.checked)}
        />
        Ya se entregó al alumno
      </label>
      <div className="enroll-total">
        <span>Total a cobrar</span>
        <strong>{money(total)}</strong>
      </div>
      <div className="form-actions">
        <button type="button" className="button danger" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button confirm" disabled={busy}>
          {busy ? "Guardando…" : "Aceptar"}
        </button>
      </div>
    </form>
  );
}
