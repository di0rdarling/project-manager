import { isEmptyPendingAssistantMessage } from "@/lib/chats/streaming-chat-mutation-helpers";

type ChatMessageRole = "user" | "model";

/**
 * Shows the assistant typing indicator while a reply is in flight, including
 * the gap before the first streamed token arrives.
 */
export function shouldShowAssistantTypingIndicator(
  isSendPending: boolean,
  messages: ReadonlyArray<{
    role: ChatMessageRole;
    _id?: string;
    content?: string;
  }>,
): boolean {
  if (!isSendPending) {
    return false;
  }

  const lastMessage = messages.at(-1);

  if (!lastMessage) {
    return false;
  }

  if (lastMessage.role === "user") {
    return true;
  }

  return Boolean(
    lastMessage._id &&
      isEmptyPendingAssistantMessage({
        _id: lastMessage._id,
        role: lastMessage.role,
        content: lastMessage.content ?? "",
      }),
  );
}
