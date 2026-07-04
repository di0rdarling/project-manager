import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { parseConfidenceLevel } from "@/lib/domain-knowledge";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { DomainKnowledge, DomainKnowledgeResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; domainKnowledgeId: string }>;
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, domainKnowledgeId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(domainKnowledgeId)) {
      return Response.json(
        { error: "Invalid domain knowledge id" },
        { status: 400 },
      );
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

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection<StoredDomainKnowledge>("domainKnowledge")
      .findOneAndUpdate(
        {
          _id: new ObjectId(domainKnowledgeId),
          projectId: new ObjectId(id),
        },
        {
          $set: {
            name,
            currentUnderstanding,
            openQuestions,
            confidenceLevel,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

    if (!result) {
      return Response.json(
        { error: "Domain knowledge item not found" },
        { status: 404 },
      );
    }

    return Response.json(serializeDomainKnowledge(result));
  } catch {
    return Response.json(
      { error: "Failed to update domain knowledge item" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, domainKnowledgeId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(domainKnowledgeId)) {
      return Response.json(
        { error: "Invalid domain knowledge id" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("domainKnowledge")
      .deleteOne({
        _id: new ObjectId(domainKnowledgeId),
        projectId: new ObjectId(id),
      });

    if (result.deletedCount === 0) {
      return Response.json(
        { error: "Domain knowledge item not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Failed to delete domain knowledge item" },
      { status: 500 },
    );
  }
}
