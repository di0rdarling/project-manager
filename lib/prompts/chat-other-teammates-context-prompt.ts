import { getChatTeammate } from "@/lib/chats/chat-teammates";
import type { OtherTeammateMemory } from "@/lib/agents/agent-memory-store";

function formatTeammateMemory(teammateMemory: OtherTeammateMemory): string {
  const teammate = getChatTeammate(teammateMemory.teammateId);

  return [
    `${teammate.name} (${teammate.role}) remembers:`,
    teammateMemory.memory,
  ].join("\n");
}

export function buildOtherTeammatesContext(
  memories: OtherTeammateMemory[],
): string | null {
  if (memories.length === 0) {
    return null;
  }

  return [
    "What your other AI teammates remember from their own conversations with the user (compact durable facts — decisions, preferences, open loops):",
    memories.map(formatTeammateMemory).join("\n\n"),
  ].join("\n");
}
