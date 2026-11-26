import { useRef, useState } from "react";
import type { GroupWrite } from "../../shared/api/contracts";
import { goBack } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { FormScreen } from "../../shared/ui/FormScreen";
import { Notice } from "../../shared/ui/PageHeader";
import { createGroup } from "./api/clases.api";
import { GroupForm } from "./components/GroupForm";

/** Alta de un grupo. Para modificar uno existente se usa su ficha. */
export function GroupFormPage({ reload }: { reload: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const creationKey = useRef(crypto.randomUUID());
  const parent = paths.grupos;

  async function save(body: GroupWrite) {
    setBusy(true);
    setError("");
    try {
      await createGroup(body, creationKey.current);
      await reload();
      goBack(parent, { notice: "Grupo creado.", force: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el grupo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen title="Datos del grupo">
      {error && <Notice kind="error">{error}</Notice>}
      <GroupForm busy={busy} onSubmit={save} onCancel={() => goBack(parent)} />
    </FormScreen>
  );
}
