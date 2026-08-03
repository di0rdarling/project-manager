export const PENDING_USER_MESSAGE_PREFIX = "pending-user-";
export const PENDING_ASSISTANT_MESSAGE_PREFIX = "pending-assistant-";

export function createPendingUserMessageId(): string {
  return `${PENDING_USER_MESSAGE_PREFIX}${Date.now()}`;
}

export function createPendingAssistantMessageId(): string {
  return `${PENDING_ASSISTANT_MESSAGE_PREFIX}${Date.now()}`;
}

export function isPendingUserMessageId(messageId: string): boolean {
  return messageId.startsWith(PENDING_USER_MESSAGE_PREFIX);
}

export function isPendingAssistantMessageId(messageId: string): boolean {
  return messageId.startsWith(PENDING_ASSISTANT_MESSAGE_PREFIX);
}

export function isPendingChatMessageId(messageId: string): boolean {
  return (
    isPendingUserMessageId(messageId) ||
    isPendingAssistantMessageId(messageId)
  );
}

export type StreamingChatMessage = {
  _id: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
};

export function createOptimisticUserMessage(
  content: string,
  createdAt = new Date().toISOString(),
): StreamingChatMessage {
  return {
    _id: createPendingUserMessageId(),
    role: "user",
    content,
    createdAt,
  };
}

export function createOptimisticAssistantMessage(
  createdAt = new Date().toISOString(),
): StreamingChatMessage {
  return {
    _id: createPendingAssistantMessageId(),
    role: "model",
    content: "",
    createdAt,
  };
}

export function isEmptyPendingAssistantMessage(message: {
  _id: string;
  role: string;
  content: string;
}): boolean {
  return (
    message.role === "model" &&
    isPendingAssistantMessageId(message._id) &&
    !message.content.trim()
  );
}

export function getVisibleChatMessages<
  T extends { _id: string; role: string; content: string },
>(messages: ReadonlyArray<T>): T[] {
  return messages.filter((message) => !isEmptyPendingAssistantMessage(message));
}

export function appendAssistantStreamDelta<T extends StreamingChatMessage>(
  messages: ReadonlyArray<T>,
  assistantMessageId: string,
  delta: string,
): T[] {
  return messages.map((message) =>
    message._id === assistantMessageId
      ? { ...message, content: message.content + delta }
      : message,
  );
}

export function finalizePendingChatMessages<T extends StreamingChatMessage>(
  messages: ReadonlyArray<T>,
  userMessage: T,
  assistantMessage: T,
): T[] {
  const withoutPending = messages.filter(
    (message) => !isPendingChatMessageId(message._id),
  );

  const nextMessages = [...withoutPending];

  if (!nextMessages.some((message) => message._id === userMessage._id)) {
    nextMessages.push(userMessage);
  }

  if (!nextMessages.some((message) => message._id === assistantMessage._id)) {
    nextMessages.push(assistantMessage);
  }

  return nextMessages;
}
