import { toIsoString } from "@/lib/dates";
import type { Project, ProjectResponse } from "@/lib/types";

export type StoredProject = Omit<Project, "_id" | "createdAt" | "updatedAt"> & {
  _id: Project["_id"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function serializeProject(project: StoredProject): ProjectResponse {
  return {
    _id: project._id.toString(),
    name: project.name,
    description: project.description,
    aiSummary:
      typeof project.aiSummary === "string" && project.aiSummary.trim()
        ? project.aiSummary
        : null,
    createdAt: toIsoString(project.createdAt),
    updatedAt: project.updatedAt
      ? toIsoString(project.updatedAt)
      : toIsoString(project.createdAt),
  };
}
