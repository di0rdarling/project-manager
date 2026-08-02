import { ObjectId, type Db } from "mongodb";
import type { AgentDocumentResponse, AgentTask } from "@/lib/types";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { KimiReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import { resolveChatReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import {
  getOtherTeammatesRecentChatSummaries,
  getTeammateChatSummaries,
} from "@/lib/chats/chat-summaries";
import type { GeminiChatMessage } from "@/lib/gemini";
import { getTeammateProjectContext } from "@/lib/project-context";
import { buildDocumentReviewContext } from "@/lib/prompts/document-review-chat-prompt";
import { buildChatOtherConversationsContext } from "@/lib/prompts/chat-other-conversations-prompt";
import { buildOtherTeammatesContext } from "@/lib/prompts/chat-other-teammates-context-prompt";
import type { AgentDocumentReviewMessageResponse } from "@/lib/types";

export type DocumentReviewGenerationContext = {
  history: GeminiChatMessage[];
  teammateId: ChatTeammateId;
  modelId: ChatModelId;
  reasoningEffort?: KimiReasoningEffort;
  projectContext?: string;
  documentReviewContext?: string;
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
  messages: AgentDocumentReviewMessageResponse[],
  userName: string | null,
  modelId: ChatModelId,
  reasoningEffort: KimiReasoningEffort | null,
  conversationSummary: string | null,
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
    { excludeArchived: true },
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

  const documentReviewContext = buildDocumentReviewContext({
    document,
    task,
  });

  return {
    history,
    teammateId,
    modelId,
    reasoningEffort: resolveChatReasoningEffort(modelId, reasoningEffort),
    projectContext: projectContext ?? undefined,
    documentReviewContext,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
    documentTitle: document.title || "Untitled document",
    conversationSummary,
    projectId: document.projectId,
  };
}
