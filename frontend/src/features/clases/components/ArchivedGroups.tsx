import type { Bootstrap, Group } from "../../../shared/api/contracts";
import { ConfirmAction } from "../../../shared/ui/ConfirmAction";
import { RowList } from "../../../shared/ui/RowList";
import { deleteGroup, restoreGroup } from "../api/clases.api";

/** Grupos archivados: se pueden restaurar, o borrar del todo si nunca tuvieron clases. */
export function ArchivedGroups({ data, reload }: { data: Bootstrap; reload: () => Promise<void> }) {
  const archived = data.groups.filter((group) => group.archived);
  if (!archived.length) return null;
  const hasSessions = (group: Group) =>
    data.sessions.some((session) => session.groupId === group.id);

  return (
    <details className="archived-groups">
      <summary>Grupos archivados ({archived.length})</summary>
      <RowList
        empty={{ title: "", text: "" }}
        items={archived.map((group) => ({
          id: group.id,
          title: group.name,
          subtitle: `${group.days.join(", ")} · ${group.time}`,
          actions: (
            <>
              <button
                className="button secondary small"
                onClick={async () => {
                  await restoreGroup(group.id, { version: group.version });
                  await reload();
                }}
              >
                Restaurar
              </button>
              {!hasSessions(group) && (
                <ConfirmAction
                  label="Borrar"
                  title="Borrar grupo"
                  onConfirm={async () => {
                    await deleteGroup(group.id);
                    await reload();
                  }}
                >
                  {group.name} nunca tuvo clases. Se borrará para siempre.
                </ConfirmAction>
              )}
            </>
          ),
        }))}
      />
    </details>
  );
}
