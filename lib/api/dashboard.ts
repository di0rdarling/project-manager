import { parseResponse } from "@/lib/api/response";
import type {
  DashboardDigestResponse,
  DashboardStatsResponse,
} from "@/lib/types";

export async function fetchDashboardStats(): Promise<DashboardStatsResponse> {
  const response = await fetch("/api/dashboard");
  return parseResponse<DashboardStatsResponse>(response);
}

export async function fetchDashboardDigest(): Promise<DashboardDigestResponse | null> {
  const response = await fetch("/api/dashboard/digest", { cache: "no-store" });

  if (response.status === 404) {
    return null;
  }

  return parseResponse<DashboardDigestResponse>(response);
}

export async function generateDashboardDigest(): Promise<DashboardDigestResponse> {
  const response = await fetch("/api/dashboard/digest", { method: "POST" });
  return parseResponse<DashboardDigestResponse>(response);
}
