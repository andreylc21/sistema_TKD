import { useState, type FormEvent } from "react";
import type { Bootstrap, CatalogCategory, CatalogItem } from "../../../shared/api/contracts";
import { ConfirmAction } from "../../../shared/ui/ConfirmAction";
import { DataTable } from "../../../shared/ui/DataTable";
import { Dialog } from "../../../shared/ui/Dialog";
import { DialogButton } from "../../../shared/ui/DialogButton";
import { editButtonClass, EditLabel } from "../../../shared/ui/EditButton";
import { Money } from "../../../shared/ui/Money";
import { Notice } from "../../../shared/ui/PageHeader";
import { createCatalogItem, deleteCatalogItem, updateCatalogItem } from "../api/configuracion.api";

const categories: CatalogCategory[] = ["Uniformes", "Equipo de protección"];

/** Artículos que se venden: al registrar un pedido se eligen de aquí y el precio se llena solo. */
export function CatalogTable({
  data,
  reload,
  adding,
  onCloseAdd,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  adding: boolean;
  onCloseAdd: () => void;
}) {
  return (
    <>
      {categories.map((category) => (
        <section key={category} className="section-gap">
          <h2>{category}</h2>
          <DataTable
            rows={data.catalog.filter((item) => item.category === category)}
            rowKey={(item) => item.id}
            empty={{
              title: "Aún no hay artículos",
              text: 'Se agregan aquí, o al registrar un pedido con "Guardar en el catálogo".',
            }}
            columns={[
              { header: "Artículo", primary: true, cell: (item) => <strong>{item.name}</strong> },
              {
                header: "Tallas",
                cell: (item) => (item.sizes.length ? item.sizes.join(", ") : "—"),
              },
              { header: "Precio", cell: (item) => <Money value={item.price} /> },
              {
                header: "Acciones",
                actions: true,
                cell: (item) => (
                  <>
                    <ConfirmAction
                      label="Borrar"
                      title="Borrar artículo"
                      onConfirm={async () => {
                        await deleteCatalogItem(item.id);
                        await reload();
                      }}
                    >
                      {item.name} ya no saldrá en la lista al registrar pedidos. Los pedidos que ya
                      hiciste no cambian.
                    </ConfirmAction>
                    <DialogButton
                      label={<EditLabel />}
                      className={editButtonClass}
                      title="Editar artículo"
                    >
                      {(close) => (
                        <CatalogForm
                          item={item}
                          onCancel={close}
                          onDone={async () => {
                            close();
                            await reload();
                          }}
                        />
                      )}
                    </DialogButton>
                  </>
                ),
              },
            ]}
          />
        </section>
      ))}
      {adding && (
        <Dialog title="Agregar artículo" onClose={onCloseAdd}>
          <CatalogForm
            onCancel={onCloseAdd}
            onDone={async () => {
              onCloseAdd();
              await reload();
            }}
          />
        </Dialog>
      )}
    </>
  );
}

function CatalogForm({
  item,
  onDone,
  onCancel,
}: {
  item?: CatalogItem;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      name: String(values.name),
      category: String(values.category) as CatalogCategory,
      sizes: String(values.sizes)
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean),
      price: String(values.price),
    };
    setBusy(true);
    setError("");
    try {
      if (item) await updateCatalogItem(item.id, body);
      else await createCatalogItem(body);
      await onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el artículo.");
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
        <label htmlFor="catalog-name">Artículo</label>
        <input
          id="catalog-name"
          name="name"
          defaultValue={item?.name}
          maxLength={60}
          required
          placeholder="Ej. Dobok"
        />
      </div>
      <div className="field full-span">
        <label htmlFor="catalog-category">Categoría</label>
        <select
          id="catalog-category"
          name="category"
          defaultValue={item?.category ?? "Equipo de protección"}
        >
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="catalog-sizes">
          Tallas <span>(opcional)</span>
        </label>
        <input
          id="catalog-sizes"
          name="sizes"
          defaultValue={item?.sizes.join(", ")}
          placeholder="130, 140, 150"
        />
        <span className="field-hint">Sepáralas con comas.</span>
      </div>
      <div className="field">
        <label htmlFor="catalog-price">Precio</label>
        <input
          id="catalog-price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          defaultValue={item ? item.price.toFixed(2) : ""}
          required
          placeholder="Ej. 450.00"
        />
        <span className="field-hint">Se puede cambiar en cada pedido.</span>
      </div>
      <div className="form-actions full-span">
        <button type="button" className="button danger" data-dialog-close onClick={onCancel}>
          Cancelar
        </button>
        <button className="button confirm" disabled={busy}>
          {busy ? "Guardando…" : "Aceptar"}
        </button>
      </div>
    </form>
  );
}
