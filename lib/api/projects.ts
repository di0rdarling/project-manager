import type { ProjectResponse } from "@/lib/types";

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }

  return data as T;
}

export async function fetchProjects(): Promise<ProjectResponse[]> {
  const response = await fetch("/api/projects");
  return parseResponse<ProjectResponse[]>(response);
}

export async function createProject(input: {
  name: string;
  description: string;
}): Promise<ProjectResponse> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<ProjectResponse>(response);
}
