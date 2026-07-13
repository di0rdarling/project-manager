import type { Db, ObjectId } from "mongodb";
import { normalizeChatModelId } from "@/lib/chats/chat-models";
import { getOtherTeammatesMemories } from "@/lib/agents/agent-memory-store";
import { getAgentNotes } from "@/lib/agents/agent-notes-store";
import { getTeammateChatSummaries } from "@/lib/chats/chat-summaries";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { GeminiChatMessage } from "@/lib/gemini";
import { getTeammateProjectContext } from "@/lib/project-context";
import { buildAgentNotesContext } from "@/lib/prompts/agent-notes-context-prompt";
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

  const otherTeammatesMemories = await getOtherTeammatesMemories(
    db,
    userId,
    chatResponse.teammateId,
  );
  const otherTeammatesContext =
    buildOtherTeammatesContext(otherTeammatesMemories) ?? undefined;

  const agentNotes = await getAgentNotes(db, userId, chatResponse.teammateId);
  const agentNotesContext = buildAgentNotesContext(agentNotes) ?? undefined;

  return {
    history,
    teammateId: chatResponse.teammateId,
    modelId: normalizeChatModelId(chat.modelId),
    projectContext: projectContext ?? undefined,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
  };
}
