import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { KimiReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import { consumeChatStream } from "@/lib/chats/chat-stream-protocol";
import { parseResponse } from "@/lib/api/response";
import type {
  AgentTaskOverviewChatResponse,
  SendAgentTaskOverviewMessageResponse,
  UpdateAgentTaskOverviewChatResponse,
} from "@/lib/types";

export type AgentTaskOverviewChatRequest = {
  teammateId: ChatTeammateId;
  projectId: string;
  taskTitle: string;
};

function getAgentTaskOverviewChatUrl({
  teammateId,
  projectId,
  taskTitle,
}: AgentTaskOverviewChatRequest): string {
  const params = new URLSearchParams({ projectId, taskTitle });
  return `/api/chats/agents/${teammateId}/tasks/overview-chat?${params.toString()}`;
}

export async function fetchAgentTaskOverviewChat(
  input: AgentTaskOverviewChatRequest,
): Promise<AgentTaskOverviewChatResponse> {
  const response = await fetch(getAgentTaskOverviewChatUrl(input));
  return parseResponse<AgentTaskOverviewChatResponse>(response);
}

export async function sendAgentTaskOverviewMessage(input: {
  teammateId: ChatTeammateId;
  projectId: string;
  taskTitle: string;
  content: string;
  onToken?: (delta: string) => void;
}): Promise<SendAgentTaskOverviewMessageResponse> {
  const { teammateId, projectId, taskTitle, content, onToken } = input;
  const response = await fetch(
    getAgentTaskOverviewChatUrl({ teammateId, projectId, taskTitle }),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );

  return consumeChatStream<SendAgentTaskOverviewMessageResponse>(
    response,
    onToken ?? (() => {}),
  );
}

export async function updateAgentTaskOverviewChat(input: {
  teammateId: ChatTeammateId;
  projectId: string;
  taskTitle: string;
  modelId?: ChatModelId;
  reasoningEffort?: KimiReasoningEffort | null;
}): Promise<UpdateAgentTaskOverviewChatResponse> {
  const { teammateId, projectId, taskTitle, modelId, reasoningEffort } = input;
  const response = await fetch(
    getAgentTaskOverviewChatUrl({ teammateId, projectId, taskTitle }),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, reasoningEffort }),
    },
  );

  return parseResponse<UpdateAgentTaskOverviewChatResponse>(response);
}
