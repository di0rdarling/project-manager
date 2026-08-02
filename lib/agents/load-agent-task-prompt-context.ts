import type { Db, ObjectId } from "mongodb";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import { loadTeammateTasksDocumentsContext } from "@/lib/agents/load-teammate-tasks-documents-context";
import { serializeUserMemoryForPrompt } from "@/lib/agents/user-memory-json";
import { getUserMemory } from "@/lib/agents/user-memory-store";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  getTeammateChatSummaries,
  RECENT_CHAT_SUMMARY_LIMIT,
  type TeammateChatSummary,
} from "@/lib/chats/chat-summaries";

export type AgentTaskPromptContext = {
  chatSummaries: TeammateChatSummary[];
  agentNotesContext?: string;
  existingOverviewContext?: string;
  agentTasksDocumentsContext?: string;
};

/**
 * Loads the supplemental context shared by task suggestion and task
 * completion prompts — the same sources a live chat reply would have
 * beyond raw project data.
 */
export async function loadAgentTaskPromptContext(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
): Promise<AgentTaskPromptContext> {
  const [
    chatSummaries,
    agentNotesContext,
    existingUserMemory,
    agentTasksDocumentsContext,
  ] = await Promise.all([
    getTeammateChatSummaries(db, userId, teammateId, {
      projectId,
      limit: RECENT_CHAT_SUMMARY_LIMIT,
    }),
    loadAgentNotesContext(db, userId, teammateId),
    getUserMemory(db, userId, teammateId),
    loadTeammateTasksDocumentsContext(db, userId, teammateId),
  ]);

  return {
    chatSummaries,
    agentNotesContext: agentNotesContext ?? undefined,
    existingOverviewContext: existingUserMemory
      ? serializeUserMemoryForPrompt(existingUserMemory)
      : undefined,
    agentTasksDocumentsContext,
  };
}
