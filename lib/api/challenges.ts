import type { ChallengeResponse, ChallengeStatus } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchChallenges(
  projectId: string,
): Promise<ChallengeResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/challenges`);
  return parseResponse<ChallengeResponse[]>(response);
}

export async function createChallenge(input: {
  projectId: string;
  title: string;
  overview: string;
  status: ChallengeStatus;
}): Promise<ChallengeResponse> {
  const { projectId, title, overview, status } = input;
  const response = await fetch(`/api/projects/${projectId}/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, overview, status }),
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
