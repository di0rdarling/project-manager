import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { parseConfidenceLevel } from "@/lib/domain-knowledge";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { DomainKnowledge, DomainKnowledgeResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type StoredDomainKnowledge = Omit<
  DomainKnowledge,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: DomainKnowledge["_id"];
  projectId: DomainKnowledge["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializeDomainKnowledge(
  item: StoredDomainKnowledge,
): DomainKnowledgeResponse {
  return {
    _id: item._id.toString(),
    projectId: item.projectId.toString(),
    name: typeof item.name === "string" ? item.name : "",
    currentUnderstanding: item.currentUnderstanding,
    openQuestions: item.openQuestions,
    confidenceLevel: parseConfidenceLevel(item.confidenceLevel),
    createdAt: toIsoString(item.createdAt),
    updatedAt: item.updatedAt
      ? toIsoString(item.updatedAt)
      : toIsoString(item.createdAt),
  };
}

async function getProjectOr404(projectId: string) {
  if (!ObjectId.isValid(projectId)) {
    return {
      error: Response.json({ error: "Invalid project id" }, { status: 400 }),
    };
  }

  const client = await getClientPromise();
  const project = await client
    .db()
    .collection("projects")
    .findOne({ _id: new ObjectId(projectId) });

  if (!project) {
    return {
      error: Response.json({ error: "Project not found" }, { status: 404 }),
    };
  }

  return { client };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await getProjectOr404(id);

    if ("error" in result) {
      return result.error;
    }

    const domainKnowledge = await result.client
      .db()
      .collection<StoredDomainKnowledge>("domainKnowledge")
      .find({ projectId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(domainKnowledge.map(serializeDomainKnowledge));
  } catch {
    return Response.json(
      { error: "Failed to fetch domain knowledge" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await getProjectOr404(id);

    if ("error" in result) {
      return result.error;
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const currentUnderstanding =
      typeof body.currentUnderstanding === "string"
        ? body.currentUnderstanding.trim()
        : "";
    const openQuestions =
      typeof body.openQuestions === "string" ? body.openQuestions.trim() : "";
    const confidenceLevel = parseConfidenceLevel(body.confidenceLevel);

    if (!name) {
      return Response.json(
        { error: "Term or concept name is required" },
        { status: 400 },
      );
    }

    if (isRichTextEmpty(currentUnderstanding)) {
      return Response.json(
        { error: "Current understanding is required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const domainKnowledge: Omit<DomainKnowledge, "_id"> = {
      projectId: new ObjectId(id),
      name,
      currentUnderstanding,
      openQuestions,
      confidenceLevel,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await result.client
      .db()
      .collection<Omit<DomainKnowledge, "_id">>("domainKnowledge")
      .insertOne(domainKnowledge);

    return Response.json(
      serializeDomainKnowledge({
        ...domainKnowledge,
        _id: insertResult.insertedId,
      }),
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Failed to create domain knowledge item" },
      { status: 500 },
    );
  }
}
