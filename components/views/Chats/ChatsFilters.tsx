"use client";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/inputs/Select";
import { CHAT_TEAMMATE_FILTER_SELECT_OPTIONS } from "@/lib/chat-teammate-options";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import type { ProjectResponse } from "@/lib/types";

type ChatsFiltersProps = {
  selectedTeammateId: ChatTeammateId | "";
  selectedProjectId: string;
  projects: ProjectResponse[];
  onTeammateChange: (teammateId: ChatTeammateId | "") => void;
  onProjectChange: (projectId: string) => void;
  onClear: () => void;
};

export default function ChatsFilters({
  selectedTeammateId,
  selectedProjectId,
  projects,
  onTeammateChange,
  onProjectChange,
  onClear,
}: Readonly<ChatsFiltersProps>) {
  const hasActiveFilters =
    selectedTeammateId !== "" || selectedProjectId !== "";

  return (
    <div className="space-y-3">
      <div className="flex max-w-md flex-col gap-4">
        <Select
          id="chat-filter-teammate"
          label="AI Teammate"
          value={selectedTeammateId}
          onChange={(event) =>
            onTeammateChange(event.target.value as ChatTeammateId | "")
          }
          options={CHAT_TEAMMATE_FILTER_SELECT_OPTIONS}
        />
        <Select
          id="chat-filter-project"
          label="Project"
          value={selectedProjectId}
          onChange={(event) => onProjectChange(event.target.value)}
          options={[
            { value: "", label: "All projects" },
            ...projects.map((project) => ({
              value: project._id,
              label: project.name,
            })),
          ]}
        />
      </div>
      {hasActiveFilters ? (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClear}>
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
