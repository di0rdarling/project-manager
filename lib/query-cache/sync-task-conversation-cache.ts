import type { QueryClient } from "@tanstack/react-query";
import { agentDocumentKeys, agentTasksKeys } from "@/lib/query-keys";
import type {
  AgentDocumentReviewChatResponse,
  AgentTask,
  AgentTaskOverviewChatResponse,
} from "@/lib/types";

type TaskConversationRef = {
  projectId: string;
  taskTitle: string;
};

type SharedConversationState = {
  messages: AgentTaskOverviewChatResponse["messages"];
  modelId: AgentTaskOverviewChatResponse["modelId"];
  reasoningEffort: AgentTaskOverviewChatResponse["reasoningEffort"];
  conversationSummary: AgentTaskOverviewChatResponse["conversationSummary"];
  contextUsage: AgentTaskOverviewChatResponse["contextUsage"];
};

export function syncOverviewChatFromReviewChat(
  queryClient: QueryClient,
  teammateId: string,
  taskConversation: TaskConversationRef | null | undefined,
  reviewChat: SharedConversationState & { task?: AgentTask | null },
) {
  if (!taskConversation) {
    return;
  }

  queryClient.setQueryData<AgentTaskOverviewChatResponse>(
    agentTasksKeys.overviewChat(
      teammateId,
      taskConversation.projectId,
      taskConversation.taskTitle,
    ),
    (current) => {
      const task = reviewChat.task ?? current?.task;
      if (!task) {
        return current;
      }

      return {
        messages: reviewChat.messages,
        task,
        modelId: reviewChat.modelId,
        reasoningEffort: reviewChat.reasoningEffort,
        conversationSummary: reviewChat.conversationSummary,
        contextUsage: reviewChat.contextUsage,
      };
    },
  );
}

export function syncReviewChatFromOverviewChat(
  queryClient: QueryClient,
  teammateId: string,
  documentId: string,
  taskConversation: TaskConversationRef,
  overviewChat: AgentTaskOverviewChatResponse,
) {
  queryClient.setQueryData<AgentDocumentReviewChatResponse>(
    agentDocumentKeys.reviewChat(teammateId, documentId),
    (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        messages: overviewChat.messages,
        task: overviewChat.task,
        taskConversation,
        modelId: overviewChat.modelId,
        reasoningEffort: overviewChat.reasoningEffort,
        conversationSummary: overviewChat.conversationSummary,
        contextUsage: overviewChat.contextUsage,
      };
    },
  );
}
