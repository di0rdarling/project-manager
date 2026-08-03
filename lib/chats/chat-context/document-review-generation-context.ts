import { ObjectId, type Db } from "mongodb";
import type { AgentDocumentResponse, AgentTask } from "@/lib/types";
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
import { buildDocumentReviewFocusContext } from "@/lib/prompts/document-review-chat-prompt";
import { buildChatOtherConversationsContext } from "@/lib/prompts/chat-other-conversations-prompt";
import { buildOtherTeammatesContext } from "@/lib/prompts/chat-other-teammates-context-prompt";
import type { AgentDocumentReviewMessageResponse } from "@/lib/types";
import type { AgentTaskOverviewMessageResponse } from "@/lib/types";

export type TaskConversationMessage =
  | AgentDocumentReviewMessageResponse
  | AgentTaskOverviewMessageResponse;

export type DocumentReviewGenerationContext = {
  history: GeminiChatMessage[];
  teammateId: ChatTeammateId;
  modelId: ChatModelId;
  reasoningEffort?: KimiReasoningEffort;
  projectContext?: string;
  documentReviewContext?: string;
  agentTasksDocumentsContext?: string;
  otherConversationsContext?: string;
  otherTeammatesContext?: string;
  agentNotesContext?: string;
  userName: string | null;
  documentTitle: string;
  conversationSummary: string | null;
  projectId: string;
};

export async function loadDocumentReviewGenerationContext(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  document: AgentDocumentResponse,
  task: AgentTask | null,
  messages: TaskConversationMessage[],
  userName: string | null,
  modelId: ChatModelId,
  reasoningEffort: KimiReasoningEffort | null,
  conversationSummary: string | null,
  continuesTaskConversation = false,
): Promise<DocumentReviewGenerationContext> {
  const history = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const projectContext = await getTeammateProjectContext(
    db,
    userId,
    teammateId,
    new ObjectId(document.projectId),
  );

  const otherChatSummaries = await getTeammateChatSummaries(
    db,
    userId,
    teammateId,
    {
      excludeArchived: true,
      excludeDocumentReviewId: new ObjectId(document._id),
      ...(task
        ? {
            excludeTaskOverview: {
              projectId: new ObjectId(document.projectId),
              taskTitle: task.title,
            },
          }
        : {}),
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

  const documentReviewContext = buildDocumentReviewFocusContext({
    document,
    task,
    continuesTaskConversation,
  });

  return {
    history,
    teammateId,
    modelId,
    reasoningEffort: resolveChatReasoningEffort(modelId, reasoningEffort),
    projectContext: projectContext ?? undefined,
    documentReviewContext,
    agentTasksDocumentsContext,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
    documentTitle: document.title || "Untitled document",
    conversationSummary,
    projectId: document.projectId,
  };
}
