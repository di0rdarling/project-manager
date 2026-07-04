import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { PainPoint, PainPointResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
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

function serializePainPoint(painPoint: StoredPainPoint): PainPointResponse {
  return {
    _id: painPoint._id.toString(),
    projectId: painPoint.projectId.toString(),
    title: typeof painPoint.title === "string" ? painPoint.title : "",
    content: painPoint.content,
    createdAt: toIsoString(painPoint.createdAt),
    updatedAt: painPoint.updatedAt
      ? toIsoString(painPoint.updatedAt)
      : toIsoString(painPoint.createdAt),
  };
}

async function getProjectOr404(projectId: string) {
  if (!ObjectId.isValid(projectId)) {
    return { error: Response.json({ error: "Invalid project id" }, { status: 400 }) };
  }

  const client = await getClientPromise();
  const project = await client
    .db()
    .collection("projects")
    .findOne({ _id: new ObjectId(projectId) });

  if (!project) {
    return { error: Response.json({ error: "Project not found" }, { status: 404 }) };
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

    const painPoints = await result.client
      .db()
      .collection<StoredPainPoint>("painPoints")
      .find({ projectId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(painPoints.map(serializePainPoint));
  } catch {
    return Response.json({ error: "Failed to fetch pain points" }, { status: 500 });
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
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!title) {
      return Response.json(
        { error: "Pain point title is required" },
        { status: 400 },
      );
    }

    if (isRichTextEmpty(content)) {
      return Response.json(
        { error: "Pain point content is required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const painPoint: Omit<PainPoint, "_id"> = {
      projectId: new ObjectId(id),
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await result.client
      .db()
      .collection<Omit<PainPoint, "_id">>("painPoints")
      .insertOne(painPoint);

    return Response.json(
      serializePainPoint({ ...painPoint, _id: insertResult.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Failed to create pain point" },
      { status: 500 },
    );
  }
}
