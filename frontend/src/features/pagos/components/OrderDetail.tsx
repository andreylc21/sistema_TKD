import { useRef, useState } from "react";
import type { Bootstrap, Order, OrderItem } from "../../../shared/api/contracts";
import { money } from "../../../shared/lib/format";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { Dialog } from "../../../shared/ui/Dialog";
import { Notice, PageHeader } from "../../../shared/ui/PageHeader";
import { updateOrderProgress, updateOrderProgressBulk } from "../api/pagos.api";
import { orderItemPending } from "../model/pagos.model";

type ItemMode = "receive" | "deliver";
type BulkMode = "receivePending" | "deliverReceived";

export function OrderDetail({
  data,
  order,
  reload,
  onBack,
}: {
  data: Bootstrap;
  order: Order;
  reload: () => Promise<void>;
  onBack: () => void;
}) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyItem, setBusyItem] = useState<string>();
  const [bulkMode, setBulkMode] = useState<BulkMode>();
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [itemAction, setItemAction] = useState<{
    item: OrderItem;
    mode: ItemMode;
    amount: number;
  }>();
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const bulkKey = useRef(crypto.randomUUID());
  const current = data.orders.find((item) => item.id === order.id) ?? order;
  const student = data.students.find((item) => item.id === current.studentId);
  const activeItems = current.items.filter((item) => !item.cancelled);

  function askProgress(item: OrderItem, mode: ItemMode) {
    const pending = orderItemPending(item);
    const maximum = mode === "receive" ? pending.receive : pending.deliver;
    const amount = Math.min(maximum, Math.max(1, amounts[`${item.id}:${mode}`] ?? 1));
    setError("");
    setMessage("");
    setItemAction({ item, mode, amount });
  }

  async function progress({ item, mode, amount }: NonNullable<typeof itemAction>) {
    setBusyItem(item.id);
    try {
      await updateOrderProgress(item.id, {
        requested: item.requested,
        received: mode === "receive" ? item.received + amount : item.received,
        delivered: mode === "deliver" ? item.delivered + amount : item.delivered,
        version: item.version,
        cancelled: false,
        reason: "",
      });
      setItemAction(undefined);
      await reload();
      setMessage(mode === "receive" ? "Recepción registrada." : "Entrega registrada.");
    } finally {
      setBusyItem(undefined);
    }
  }

  async function runBulk() {
    if (!bulkMode) return;
    setBulkBusy(true);
    setBulkError("");
    setMessage("");
    try {
      await updateOrderProgressBulk(
        current.uuid,
        {
          mode: bulkMode,
          items: activeItems.map((item) => ({ id: item.id, version: item.version })),
        },
        bulkKey.current,
      );
      bulkKey.current = crypto.randomUUID();
      await reload();
      setBulkMode(undefined);
      setMessage(
        bulkMode === "receivePending"
          ? "Pendientes recibidos en una sola operación."
          : "Se entregó todo lo que ya estaba recibido.",
      );
    } catch (caught) {
      setBulkError(
        caught instanceof Error
          ? caught.message
          : "No se actualizó el pedido; recarga y vuelve a intentar.",
      );
    } finally {
      setBulkBusy(false);
    }
  }

  function openBulk(mode: BulkMode) {
    setBulkError("");
    setBulkMode(mode);
  }

  const bulkRows = bulkMode
    ? activeItems
        .map((item) => ({
          item,
          amount:
            bulkMode === "receivePending"
              ? orderItemPending(item).receive
              : orderItemPending(item).deliver,
        }))
        .filter((row) => row.amount > 0)
    : [];
  const remainsPartial =
    bulkMode === "deliverReceived" && activeItems.some((item) => item.received < item.quantity);

  return (
    <>
      <button className="text-button detail-back" onClick={onBack}>
        ← Volver a pedidos
      </button>
      <PageHeader
        title={`Pedido ${current.id}`}
        help="Recepción, entrega y pago avanzan por separado. Sólo se puede entregar mercancía ya recibida."
        context={`${student?.name ?? "Alumno no disponible"} · ${current.status}`}
        actions={
          <div className="inline-actions">
            <button
              className="button secondary"
              disabled={!activeItems.some((item) => orderItemPending(item).receive > 0)}
              onClick={() => openBulk("receivePending")}
            >
              Recibir pendientes del pedido
            </button>
            <button
              className="button"
              disabled={!activeItems.some((item) => orderItemPending(item).deliver > 0)}
              onClick={() => openBulk("deliverReceived")}
            >
              Entregar todo lo recibido
            </button>
          </div>
        }
      />
      {error && <Notice kind="error">{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="summary-strip">
        <Metric label="Total" value={current.total} />
        <Metric label="Dinero recibido" value={current.paid} />
        <Metric label="Saldo" value={current.total - current.paid} />
      </div>
      <section className="table-surface table-wrap spacer-top">
        <table>
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Avance</th>
              <th>Pendientes</th>
              <th>Registrar recepción</th>
              <th>Registrar entrega</th>
            </tr>
          </thead>
          <tbody>
            {current.items.map((item) => {
              const pending = orderItemPending(item);
              return (
                <tr key={item.id} className={item.cancelled ? "row-muted" : undefined}>
                  <td className="primary-cell">
                    <strong>
                      {item.name}
                      {item.size ? ` · ${item.size}` : ""}
                    </strong>
                    <span>{item.cancelled ? "Artículo cancelado" : `Pedido ${item.quantity}`}</span>
                  </td>
                  <td>
                    <div className="progress-lines">
                      <span>Pedido {item.quantity}</span>
                      <span>
                        Recibido {item.received}/{item.quantity}
                      </span>
                      <span>
                        Entregado {item.delivered}/{item.quantity}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span>
                      Pendiente de recibir: <strong>{pending.receive}</strong>
                    </span>
                    <br />
                    <span>
                      Pendiente de entregar: <strong>{pending.deliver}</strong>
                    </span>
                  </td>
                  <td>
                    {!item.cancelled && pending.receive > 0 ? (
                      <QuantityAction
                        id={`${item.id}:receive`}
                        maximum={pending.receive}
                        value={amounts[`${item.id}:receive`] ?? 1}
                        busy={busyItem === item.id}
                        label="Registrar recepción"
                        onChange={(value) =>
                          setAmounts((currentAmounts) => ({
                            ...currentAmounts,
                            [`${item.id}:receive`]: value,
                          }))
                        }
                        onRun={() => askProgress(item, "receive")}
                      />
                    ) : (
                      <span className="muted">Sin recepción pendiente</span>
                    )}
                  </td>
                  <td>
                    {!item.cancelled && pending.deliver > 0 ? (
                      <QuantityAction
                        id={`${item.id}:deliver`}
                        maximum={pending.deliver}
                        value={amounts[`${item.id}:deliver`] ?? 1}
                        busy={busyItem === item.id}
                        label="Registrar entrega"
                        onChange={(value) =>
                          setAmounts((currentAmounts) => ({
                            ...currentAmounts,
                            [`${item.id}:deliver`]: value,
                          }))
                        }
                        onRun={() => askProgress(item, "deliver")}
                      />
                    ) : (
                      <span className="muted">Nada recibido por entregar</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      {itemAction && (
        <ConfirmDialog
          title={itemAction.mode === "receive" ? "Registrar recepción" : "Registrar entrega"}
          confirmLabel={itemAction.mode === "receive" ? "Registrar recepción" : "Registrar entrega"}
          onConfirm={() => progress(itemAction)}
          onCancel={() => setItemAction(undefined)}
        >
          {itemAction.amount} unidad{itemAction.amount === 1 ? "" : "es"} de {itemAction.item.name}
          {itemAction.item.size ? ` · ${itemAction.item.size}` : ""}.
        </ConfirmDialog>
      )}
      {bulkMode && (
        <Dialog
          title={
            bulkMode === "receivePending"
              ? "Recibir pendientes del pedido"
              : "Entregar todo lo recibido"
          }
          onClose={() => !bulkBusy && setBulkMode(undefined)}
        >
          <div className="bulk-summary">
            <p>
              Se aplicará una sola operación a los artículos activos. Si una versión cambió, no se
              actualizará ninguno.
            </p>
            <ul className="list">
              {bulkRows.map(({ item, amount }) => (
                <li className="list-row" key={item.id}>
                  <div className="list-row-main">
                    <strong>{item.name}</strong>
                    <span>{item.size || "Sin talla"}</span>
                  </div>
                  <div className="list-row-value">
                    <strong>
                      {amount} unidad{amount === 1 ? "" : "es"}
                    </strong>
                    <span>
                      {bulkMode === "receivePending" ? "por recibir" : "ya recibidas por entregar"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {bulkError && <Notice kind="error">{bulkError}</Notice>}
            {remainsPartial && (
              <Notice kind="error">
                El pedido seguirá parcialmente entregado porque aún falta recibir mercancía.
              </Notice>
            )}
            <div className="form-actions spacer-top">
              <button
                className="button secondary"
                data-dialog-close
                disabled={bulkBusy}
                onClick={() => setBulkMode(undefined)}
              >
                Cancelar
              </button>
              <button
                className="button"
                disabled={bulkBusy || bulkRows.length === 0}
                onClick={() => void runBulk()}
              >
                {bulkBusy ? "Actualizando…" : "Confirmar operación"}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}

function QuantityAction({
  id,
  maximum,
  value,
  busy,
  label,
  onChange,
  onRun,
}: {
  id: string;
  maximum: number;
  value: number;
  busy: boolean;
  label: string;
  onChange: (value: number) => void;
  onRun: () => void;
}) {
  return (
    <div className="quantity-action">
      <label htmlFor={id}>Cantidad</label>
      <select id={id} value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {Array.from({ length: maximum }, (_, index) => index + 1).map((amount) => (
          <option key={amount}>{amount}</option>
        ))}
      </select>
      <button className="button secondary small" disabled={busy} onClick={onRun}>
        {busy ? "Guardando…" : label}
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{money(value)}</strong>
    </div>
  );
}
