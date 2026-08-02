"use client";

import { useMemo } from "react";
import { useFetchChats } from "@/hooks/queries/useFetchChats";
import { filterAgentChats } from "@/lib/chats/agent-chats";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

export function useAgentChats(
  teammateId: ChatTeammateId,
  projectId?: string | null,
) {
  const query = useFetchChats({ status: "active" });

  const agentChats = useMemo(
    () => filterAgentChats(query.data ?? [], teammateId, projectId),
    [query.data, teammateId, projectId],
  );

  return {
    ...query,
    agentChats,
    chatsCount: agentChats.length,
  };
}
