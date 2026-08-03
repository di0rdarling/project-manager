"use client";

import { useEffect, type RefObject } from "react";

export function useAgentChatAutoScroll(
  messages: ReadonlyArray<{ content: string }>,
  isSendPending: boolean,
  messagesEndRef: RefObject<HTMLDivElement | null>,
) {
  const lastMessageContent = messages.at(-1)?.content ?? "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, lastMessageContent, isSendPending, messagesEndRef]);
}
