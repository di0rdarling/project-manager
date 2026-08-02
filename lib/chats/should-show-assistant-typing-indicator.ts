type ChatMessageRole = "user" | "model";

/**
 * Shows the assistant typing indicator while a reply is in flight, but hides
 * it once the assistant message has landed in the list — avoiding a one-frame
 * flash where `isPending` is still true after onSuccess updates the cache.
 */
export function shouldShowAssistantTypingIndicator(
  isSendPending: boolean,
  messages: ReadonlyArray<{ role: ChatMessageRole }>,
): boolean {
  return isSendPending && messages.at(-1)?.role === "user";
}
