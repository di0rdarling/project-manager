import type { UserResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchCurrentUser(): Promise<UserResponse> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  return parseResponse<UserResponse>(response);
}
