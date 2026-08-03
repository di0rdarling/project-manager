import { ObjectId, type Db } from "mongodb";
import type { AgentTask } from "@/lib/types";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { KimiReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import { resolveChatReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import { loadTeammateTasksDocumentsContext } from "@/lib/agents/load-teammate-tasks-documents-context";
import {
  getOtherTeammatesRecentChatSummaries,
  getTeammateChatSummaries,
} from "@/lib/chats/chat-summaries";
import type { GeminiChatMessage } from "@/lib/gemini";
import { getTeammateProjectContext } from "@/lib/project-context";
import { buildAgentTaskOverviewFocusContext } from "@/lib/prompts/agent-task-overview-chat-prompt";
import { buildChatOtherConversationsContext } from "@/lib/prompts/chat-other-conversations-prompt";
import { buildOtherTeammatesContext } from "@/lib/prompts/chat-other-teammates-context-prompt";
import type { AgentTaskOverviewMessageResponse } from "@/lib/types";

export type AgentTaskOverviewGenerationContext = {
  history: GeminiChatMessage[];
  teammateId: ChatTeammateId;
  modelId: ChatModelId;
  reasoningEffort?: KimiReasoningEffort;
  projectContext?: string;
  taskOverviewContext?: string;
  agentTasksDocumentsContext?: string;
  otherConversationsContext?: string;
  otherTeammatesContext?: string;
  agentNotesContext?: string;
  userName: string | null;
  taskTitle: string;
  conversationSummary: string | null;
  projectId: string;
};

export async function loadAgentTaskOverviewGenerationContext(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  task: AgentTask,
  messages: AgentTaskOverviewMessageResponse[],
  userName: string | null,
  modelId: ChatModelId,
  reasoningEffort: KimiReasoningEffort | null,
  conversationSummary: string | null,
): Promise<AgentTaskOverviewGenerationContext> {
  const history = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const projectContext = await getTeammateProjectContext(
    db,
    userId,
    teammateId,
    projectId,
  );

  const otherChatSummaries = await getTeammateChatSummaries(
    db,
    userId,
    teammateId,
    {
      excludeArchived: true,
      excludeTaskOverview: {
        projectId,
        taskTitle: task.title,
      },
    },
  );
  const otherConversationsContext =
    buildChatOtherConversationsContext(otherChatSummaries) ?? undefined;

  const otherTeammatesChatSummaries =
    await getOtherTeammatesRecentChatSummaries(db, userId, teammateId);
  const otherTeammatesContext =
    buildOtherTeammatesContext(otherTeammatesChatSummaries) ?? undefined;

  const agentNotesContext = await loadAgentNotesContext(
    db,
    userId,
    teammateId,
  );

  const agentTasksDocumentsContext = await loadTeammateTasksDocumentsContext(
    db,
    userId,
    teammateId,
  );

  const taskOverviewContext = buildAgentTaskOverviewFocusContext({ task });

  return {
    history,
    teammateId,
    modelId,
    reasoningEffort: resolveChatReasoningEffort(modelId, reasoningEffort),
    projectContext: projectContext ?? undefined,
    taskOverviewContext,
    agentTasksDocumentsContext,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
    taskTitle: task.title,
    conversationSummary,
    projectId: projectId.toString(),
  };
}
