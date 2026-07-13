"use client";

import { Button } from "@/components/ui/Button";
import { FilterPill } from "@/components/ui/FilterPill";
import {
  CHAT_TEAMMATES_FOR_DISPLAY,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import type { ProjectResponse } from "@/lib/types";

const projectSelectClassName =
  "w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600";

type ChatsToolbarProps = {
  selectedTeammateId: ChatTeammateId | "";
  selectedProjectId: string;
  projects: ProjectResponse[];
  onTeammateChange: (teammateId: ChatTeammateId | "") => void;
  onProjectChange: (projectId: string) => void;
  onNewChat: () => void;
  showNewChatButton?: boolean;
};

export default function ChatsToolbar({
  selectedTeammateId,
  selectedProjectId,
  projects,
  onTeammateChange,
  onProjectChange,
  onNewChat,
  showNewChatButton = true,
}: Readonly<ChatsToolbarProps>) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterPill
            isActive={selectedTeammateId === ""}
            onClick={() => onTeammateChange("")}
          >
            All
          </FilterPill>
          {CHAT_TEAMMATES_FOR_DISPLAY.map((teammate) => (
            <FilterPill
              key={teammate.id}
              isActive={selectedTeammateId === teammate.id}
              onClick={() => onTeammateChange(teammate.id)}
            >
              {teammate.name}
            </FilterPill>
          ))}
        </div>

        {showNewChatButton ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onNewChat}
            className="shrink-0 self-start sm:self-auto"
          >
            New chat
          </Button>
        ) : null}
      </div>

      <select
        id="chat-filter-project"
        aria-label="Filter by project"
        value={selectedProjectId}
        onChange={(event) => onProjectChange(event.target.value)}
        className={projectSelectClassName}
      >
        <option value="">All projects</option>
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}
