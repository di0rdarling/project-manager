import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";
import { generateProjectSummary } from "@/lib/gemini";
import {
  serializeProject,
  type StoredProject,
} from "@/lib/serialize-project";
import type { CoreUser, Note, PainPoint, Requirement, Tool } from "@/lib/types";
import { buildProjectSummaryPrompt } from "@/lib/prompts/project-summary-prompt";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

function hasSavedSummary(project: StoredProject): boolean {
  return (
    typeof project.aiSummary === "string" && project.aiSummary.trim().length > 0
  );
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectObjectId = new ObjectId(id);

    const project = await db
      .collection<StoredProject>("projects")
      .findOne({ _id: projectObjectId });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const [coreUsers, painPoints, requirements, tools, notes] =
      await Promise.all([
      db
        .collection<StoredCoreUser>("coreUsers")
        .find({ projectId: projectObjectId })
        .sort({ createdAt: -1 })
        .toArray(),
      db
        .collection<StoredPainPoint>("painPoints")
        .find({ projectId: projectObjectId })
        .sort({ createdAt: -1 })
        .toArray(),
      db
        .collection<StoredRequirement>("requirements")
        .find({ projectId: projectObjectId })
        .sort({ createdAt: -1 })
        .toArray(),
      db
        .collection<StoredTool>("tools")
        .find({ projectId: projectObjectId })
        .sort({ createdAt: -1 })
        .toArray(),
      db
        .collection<StoredNote>("notes")
        .find({ projectId: projectObjectId })
        .sort({ createdAt: -1 })
        .toArray(),
    ]);

    const prompt = buildProjectSummaryPrompt({
      name: project.name,
      description: project.description,
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

    const aiSummary = await generateProjectSummary(prompt);
    const updatedAt = new Date().toISOString();

    const updateResult = await db.collection<StoredProject>("projects").updateOne(
      { _id: projectObjectId },
      {
        $set: {
          aiSummary,
          updatedAt,
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const savedProject = await db
      .collection<StoredProject>("projects")
      .findOne({ _id: projectObjectId });

    if (!savedProject || !hasSavedSummary(savedProject)) {
      return Response.json(
        { error: "Failed to save project summary" },
        { status: 500 },
      );
    }

    return Response.json(serializeProject(savedProject));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI summary generation is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to generate project summary" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectObjectId = new ObjectId(id);

    const updateResult = await db.collection<StoredProject>("projects").updateOne(
      { _id: projectObjectId },
      {
        $set: {
          aiSummary: null,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const savedProject = await db
      .collection<StoredProject>("projects")
      .findOne({ _id: projectObjectId });

    if (!savedProject) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json(serializeProject(savedProject));
  } catch {
    return Response.json(
      { error: "Failed to delete project summary" },
      { status: 500 },
    );
  }
}
