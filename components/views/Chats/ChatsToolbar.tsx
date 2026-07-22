"use client";

import { Button } from "@/components/ui/Button";
import { FilterPill } from "@/components/ui/FilterPill";
import {
  CHAT_TEAMMATES_FOR_DISPLAY,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";

type ChatsToolbarProps = {
  selectedTeammateId: ChatTeammateId | "";
  onTeammateChange: (teammateId: ChatTeammateId | "") => void;
  onNewChat: () => void;
  showNewChatButton?: boolean;
};

export default function ChatsToolbar({
  selectedTeammateId,
  onTeammateChange,
  onNewChat,
  showNewChatButton = true,
}: Readonly<ChatsToolbarProps>) {
  return (
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
  );
}
