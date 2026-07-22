import { ObjectId, type Db } from "mongodb";
import { getChatTeammate, type ChatTeammateId } from "@/lib/chats/chat-teammates";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import { parseUserMemoryJson } from "@/lib/agents/user-memory-json";
import { getUserMemory, upsertUserMemory } from "@/lib/agents/user-memory-store";
import { generateUserMemory } from "@/lib/gemini";
import { buildUserMemoryMergePrompt } from "@/lib/prompts/user-memory-prompt";
import type { StoredProject } from "@/lib/serialize/serialize-project";

/**
 * After a chat's conversation summary changes, fold durable facts into this
 * teammate's structured, user-facing memory (most recently / stable context).
 * Failures are swallowed so a memory miss never blocks the user-visible action.
 */
export async function refreshUserMemoryFromChatSummary(input: {
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
  const existing = await getUserMemory(input.db, input.userId, input.teammateId);
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

  const draft = parseUserMemoryJson(
    await generateUserMemory(
      buildUserMemoryMergePrompt({
        agentName: teammate.name,
        agentRole: teammate.role,
        existingMemory: existing,
        chatTitle: input.chatTitle,
        conversationSummary: input.conversationSummary,
        projectName,
        agentNotesContext,
        userName: input.userName,
      }),
    ),
  );

  await upsertUserMemory(
    input.db,
    input.userId,
    input.teammateId,
    draft,
    input.updatedAt,
  );
}
