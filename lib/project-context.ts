import type { Db, ObjectId } from "mongodb";
import { buildChatProjectContext } from "@/lib/prompts/chat-project-context-prompt";
import type { StoredProject } from "@/lib/serialize-project";
import type { CoreUser, Note, PainPoint, Requirement, Tool } from "@/lib/types";

type StoredRequirement = Omit<
  Requirement,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: Requirement["_id"];
  projectId: Requirement["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredNote = Omit<Note, "_id" | "projectId" | "createdAt" | "updatedAt"> & {
  _id: Note["_id"];
  projectId: Note["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredTool = Omit<Tool, "_id" | "projectId" | "createdAt" | "updatedAt"> & {
  _id: Tool["_id"];
  projectId: Tool["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredCoreUser = Omit<
  CoreUser,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: CoreUser["_id"];
  projectId: CoreUser["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredPainPoint = Omit<
  PainPoint,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: PainPoint["_id"];
  projectId: PainPoint["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

export async function getProjectContext(
  db: Db,
  projectId: ObjectId,
): Promise<string | null> {
  const project = await db
    .collection<StoredProject>("projects")
    .findOne({ _id: projectId });

  if (!project) {
    return null;
  }

  const [coreUsers, painPoints, requirements, tools, notes] = await Promise.all([
    db
      .collection<StoredCoreUser>("coreUsers")
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredPainPoint>("painPoints")
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredRequirement>("requirements")
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredTool>("tools")
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredNote>("notes")
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray(),
  ]);

  return buildChatProjectContext({
    name: project.name,
    description: project.description,
    aiSummary: project.aiSummary,
    coreUsers: coreUsers.map((coreUser) => ({
      name: coreUser.name,
      role: coreUser.role,
      content: coreUser.content,
    })),
    painPoints: painPoints.map((painPoint) => ({
      title: painPoint.title,
      content: painPoint.content,
    })),
    requirements: requirements.map((requirement) => ({
      title: requirement.title,
      content: requirement.content,
    })),
    tools: tools.map((tool) => ({
      name: tool.name,
      content: tool.content,
    })),
    notes: notes.map((note) => ({
      title: note.title,
      content: note.content,
    })),
  });
}
