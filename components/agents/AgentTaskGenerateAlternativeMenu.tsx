"use client";

import {
  ItemActionsMenu,
  regenerateItemAction,
} from "@/components/ui/ItemActionsMenu";

type AgentTaskGenerateAlternativeMenuProps = {
  taskTitle: string;
  onGenerateAlternative: (taskTitle: string) => void;
  disabled?: boolean;
  visible?: boolean;
};

export function AgentTaskGenerateAlternativeMenu({
  taskTitle,
  onGenerateAlternative,
  disabled = false,
  visible = true,
}: Readonly<AgentTaskGenerateAlternativeMenuProps>) {
  if (!visible) {
    return null;
  }

  return (
    <ItemActionsMenu
      menuLabel={`Actions for ${taskTitle}`}
      actions={[
        regenerateItemAction(
          "Generate alternative",
          () => onGenerateAlternative(taskTitle),
          disabled,
        ),
      ]}
    />
  );
}
