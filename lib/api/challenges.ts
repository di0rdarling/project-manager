import type { ChallengeResponse, ChallengeStatus } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchChallenges(
  projectId: string,
  featureId?: string | null,
): Promise<ChallengeResponse[]> {
  const params =
    featureId !== undefined && featureId !== null
      ? `?featureId=${encodeURIComponent(featureId)}`
      : "";
  const response = await fetch(`/api/projects/${projectId}/challenges${params}`);
  return parseResponse<ChallengeResponse[]>(response);
}

export async function createChallenge(input: {
  projectId: string;
  title: string;
  overview: string;
  status: ChallengeStatus;
  featureId?: string | null;
}): Promise<ChallengeResponse> {
  const { projectId, title, overview, status, featureId } = input;
  const response = await fetch(`/api/projects/${projectId}/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, overview, status, featureId }),
  });

  return parseResponse<ChallengeResponse>(response);
}

export async function updateChallenge(input: {
  projectId: string;
  challengeId: string;
  title: string;
  overview: string;
  status: ChallengeStatus;
}): Promise<ChallengeResponse> {
  const { projectId, challengeId, title, overview, status } = input;
  const response = await fetch(
    `/api/projects/${projectId}/challenges/${challengeId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, overview, status }),
    },
  );

  return parseResponse<ChallengeResponse>(response);
}

export async function deleteChallenge(input: {
  projectId: string;
  challengeId: string;
  featureId?: string | null;
}): Promise<void> {
  const { projectId, challengeId } = input;
  const response = await fetch(
    `/api/projects/${projectId}/challenges/${challengeId}`,
    {
      method: "DELETE",
    },
  );

  await parseResponse<{ success: true }>(response);
}
