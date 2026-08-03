import type { AccountUsageResponse } from "@/lib/account/account-usage";
import { parseResponse } from "@/lib/api/response";

export async function fetchAccountUsage(): Promise<AccountUsageResponse> {
  const response = await fetch("/api/account/usage", { cache: "no-store" });
  return parseResponse<AccountUsageResponse>(response);
}
