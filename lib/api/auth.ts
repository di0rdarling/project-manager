import type { UserResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchCurrentUser(): Promise<UserResponse> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  return parseResponse<UserResponse>(response);
}

export async function updateCurrentUser(input: {
  name: string;
}): Promise<UserResponse> {
  const response = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<UserResponse>(response);
}
