import { useRef, useState } from "react";
import type { Group, GroupWrite } from "../../shared/api/contracts";
import { goBack } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { FormScreen } from "../../shared/ui/FormScreen";
import { Notice } from "../../shared/ui/PageHeader";
import { createGroup, updateGroup } from "./api/clases.api";
import { GroupForm } from "./components/GroupForm";

export function GroupFormPage({ group, reload }: { group?: Group; reload: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const creationKey = useRef(crypto.randomUUID());
  const parent = paths.clases("groups");

  async function save(body: GroupWrite) {
    setBusy(true);
    setError("");
    try {
      if (group) await updateGroup(group.id, body);
      else await createGroup(body, creationKey.current);
      await reload();
      goBack(parent, { notice: group ? "Grupo actualizado." : "Grupo creado.", force: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el grupo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      {error && <Notice kind="error">{error}</Notice>}
      <GroupForm initial={group} busy={busy} onSubmit={save} onCancel={() => goBack(parent)} />
    </FormScreen>
  );
}
