import type { Db, ObjectId } from "mongodb";
import { resolveChatReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import type { KimiReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import {
  getOtherTeammatesRecentChatSummaries,
  getTeammateChatSummaries,
} from "@/lib/chats/chat-summaries";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { GeminiChatMessage } from "@/lib/gemini";
import { getTeammateProjectContext } from "@/lib/project-context";
import { buildChatOtherConversationsContext } from "@/lib/prompts/chat-other-conversations-prompt";
import { buildOtherTeammatesContext } from "@/lib/prompts/chat-other-teammates-context-prompt";
import {
  serializeChat,
  type StoredChat,
  type StoredChatMessage,
} from "@/lib/serialize/serialize-chat";

export type ChatGenerationContext = {
  history: GeminiChatMessage[];
  teammateId: ChatTeammateId;
  modelId: string;
  reasoningEffort?: KimiReasoningEffort;
  projectContext?: string;
  otherConversationsContext?: string;
  otherTeammatesContext?: string;
  agentNotesContext?: string;
  userName: string | null;
};

export async function loadChatGenerationContext(
  db: Db,
  userId: ObjectId,
  chat: StoredChat,
  messages: StoredChatMessage[],
  userName: string | null,
): Promise<ChatGenerationContext> {
  const chatResponse = serializeChat(chat);
  const history = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const projectContext = await getTeammateProjectContext(
    db,
    userId,
    chatResponse.teammateId,
    chat.projectId ?? null,
    {
      requirementId: chat.requirementId ?? null,
      featureId: chat.featureId ?? null,
    },
  );

  const otherChatSummaries = await getTeammateChatSummaries(
    db,
    userId,
    chatResponse.teammateId,
    { excludeChatId: chat._id, excludeArchived: true },
  );
  const otherConversationsContext =
    buildChatOtherConversationsContext(otherChatSummaries) ?? undefined;

  const otherTeammatesChatSummaries = await getOtherTeammatesRecentChatSummaries(
    db,
    userId,
    chatResponse.teammateId,
  );
  const otherTeammatesContext =
    buildOtherTeammatesContext(otherTeammatesChatSummaries) ?? undefined;

  const agentNotesContext = await loadAgentNotesContext(
    db,
    userId,
    chatResponse.teammateId,
  );

  return {
    history,
    teammateId: chatResponse.teammateId,
    modelId: chatResponse.modelId,
    reasoningEffort: resolveChatReasoningEffort(
      chatResponse.modelId,
      chatResponse.reasoningEffort,
    ),
    projectContext: projectContext ?? undefined,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
  };
}
