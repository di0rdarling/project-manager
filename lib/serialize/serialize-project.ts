import { toIsoString } from "@/lib/dates";
import { getLatestActivityAt } from "@/lib/projects/project-activity";
import type { Project, ProjectResponse } from "@/lib/types";

export type StoredProject = Omit<Project, "_id" | "createdAt" | "updatedAt"> & {
  _id: Project["_id"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type SerializeProjectOptions = {
  lastChatActivityAt?: string | null;
};

export function serializeProject(
  project: StoredProject,
  options?: SerializeProjectOptions,
): ProjectResponse {
  const updatedAt = project.updatedAt
    ? toIsoString(project.updatedAt)
    : toIsoString(project.createdAt);

  return {
    _id: project._id.toString(),
    userId: project.userId.toString(),
    name: project.name,
    description: project.description,
    aiSummary:
      typeof project.aiSummary === "string" && project.aiSummary.trim()
        ? project.aiSummary
        : null,
    createdAt: toIsoString(project.createdAt),
    updatedAt,
    lastActivityAt: getLatestActivityAt(updatedAt, options?.lastChatActivityAt),
  };
}
