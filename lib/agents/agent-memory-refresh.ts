import { ObjectId, type Db } from "mongodb";
import { getChatTeammate, type ChatTeammateId } from "@/lib/chats/chat-teammates";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import { getAgentMemory, upsertAgentMemory } from "@/lib/agents/agent-memory-store";
import { generateAgentMemory } from "@/lib/gemini";
import {
  buildAgentMemoryMergePrompt,
  clampAgentMemory,
} from "@/lib/prompts/agent-memory-prompt";
import type { StoredProject } from "@/lib/serialize/serialize-project";

/**
 * After a chat's conversation summary changes, fold durable facts into this
 * teammate's compact profile Memory. Failures are swallowed so a memory miss
 * never blocks the user-visible action.
 */
export async function refreshAgentMemoryFromChatSummary(input: {
  db: Db;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  chatTitle: string;
  conversationSummary: string;
  projectId: ObjectId | null | undefined;
  userName: string | null;
  updatedAt: string;
}): Promise<void> {
  const teammate = getChatTeammate(input.teammateId);
  const existing = await getAgentMemory(input.db, input.userId, input.teammateId);
  const agentNotesContext = await loadAgentNotesContext(
    input.db,
    input.userId,
    input.teammateId,
  );

  let projectName: string | null = null;
  if (input.projectId) {
    const project = await input.db
      .collection<StoredProject>("projects")
      .findOne(
        { _id: input.projectId, userId: input.userId },
        { projection: { name: 1 } },
      );
    projectName = project?.name ?? null;
  }

  const memory = clampAgentMemory(
    await generateAgentMemory(
      buildAgentMemoryMergePrompt({
        teammateId: input.teammateId,
        agentName: teammate.name,
        agentRole: teammate.role,
        existingMemory: existing?.memory ?? null,
        chatTitle: input.chatTitle,
        conversationSummary: input.conversationSummary,
        projectName,
        agentNotesContext,
        userName: input.userName,
      }),
    ),
  );

  await upsertAgentMemory(
    input.db,
    input.userId,
    input.teammateId,
    memory,
    input.updatedAt,
  );
}
