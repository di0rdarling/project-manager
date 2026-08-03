import type { Db, ObjectId } from "mongodb";
import { getAgentMemory } from "@/lib/agents/agent-memory-store";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import { loadTeammateTasksDocumentsContext } from "@/lib/agents/load-teammate-tasks-documents-context";
import { serializeUserMemoryForPrompt } from "@/lib/agents/user-memory-json";
import { getUserMemory } from "@/lib/agents/user-memory-store";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  getOtherTeammatesRecentChatSummaries,
  getTeammateChatSummaries,
  RECENT_CHAT_SUMMARY_LIMIT,
  type TeammateChatSummary,
} from "@/lib/chats/chat-summaries";
import { buildOtherTeammatesContext } from "@/lib/prompts/chat-other-teammates-context-prompt";

export type AgentTaskPromptContext = {
  chatSummaries: TeammateChatSummary[];
  agentNotesContext?: string;
  agentMemoryContext?: string;
  existingOverviewContext?: string;
  agentTasksDocumentsContext?: string;
  otherTeammatesContext?: string;
};

/**
 * Loads the supplemental context shared by task suggestion and task
 * completion prompts — the same sources a live chat reply would have
 * beyond raw project data, plus the agent's profile Memory.
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
    existingAgentMemory,
    existingUserMemory,
    agentTasksDocumentsContext,
    otherTeammatesChatSummaries,
  ] = await Promise.all([
    getTeammateChatSummaries(db, userId, teammateId, {
      projectId,
      limit: RECENT_CHAT_SUMMARY_LIMIT,
    }),
    loadAgentNotesContext(db, userId, teammateId),
    getAgentMemory(db, userId, teammateId),
    getUserMemory(db, userId, teammateId),
    loadTeammateTasksDocumentsContext(db, userId, teammateId),
    getOtherTeammatesRecentChatSummaries(db, userId, teammateId),
  ]);

  const agentMemory = existingAgentMemory?.memory?.trim();

  return {
    chatSummaries,
    agentNotesContext: agentNotesContext ?? undefined,
    agentMemoryContext: agentMemory || undefined,
    existingOverviewContext: existingUserMemory
      ? serializeUserMemoryForPrompt(existingUserMemory)
      : undefined,
    agentTasksDocumentsContext,
    otherTeammatesContext:
      buildOtherTeammatesContext(otherTeammatesChatSummaries) ?? undefined,
  };
}
