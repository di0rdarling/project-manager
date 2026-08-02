import type { ChatModelId } from "@/lib/chats/chat-models";
import type { UserResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchCurrentUser(): Promise<UserResponse> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  return parseResponse<UserResponse>(response);
}

export type UpdateCurrentUserInput = {
  name?: string;
  agentTaskGenerationModelId?: ChatModelId | null;
};

export async function updateCurrentUser(
  input: UpdateCurrentUserInput,
): Promise<UserResponse> {
  const response = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<UserResponse>(response);
}
