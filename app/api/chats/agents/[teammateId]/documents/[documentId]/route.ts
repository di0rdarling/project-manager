import { ObjectId } from "mongodb";
import { isChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  canAcceptAgentDocument,
  canEditAgentDocument,
  canRejectAgentDocument,
  parseAgentDocumentStatus,
} from "@/lib/agents/agent-documents";
import {
  getAgentDocumentById,
  updateAgentDocumentContent,
  updateAgentDocumentStatus,
} from "@/lib/agents/agent-documents-store";
import {
  findAgentTaskByDocumentId,
  updateAgentTaskOutputDocumentTitle,
} from "@/lib/agents/agent-tasks-store";
import { rejectAndDeleteAgentTaskByDocumentId } from "@/lib/agents/reject-agent-task";
import {
  getProjectNameForUser,
  serializeAgentTasksResponse,
} from "@/lib/agents/agent-tasks-route-helpers";
import { isRichTextEmpty } from "@/lib/rich-text";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ teammateId: string; documentId: string }>;
};

function parseRouteParams(teammateId: string, documentId: string) {
  if (!isChatTeammateId(teammateId)) {
    return {
      error: Response.json({ error: "Invalid teammate id" }, { status: 400 }),
    };
  }

  if (!ObjectId.isValid(documentId)) {
    return {
      error: Response.json({ error: "Invalid document id" }, { status: 400 }),
    };
  }

  return { teammateId, documentId };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId, documentId: rawDocumentId } =
      await context.params;
    const parsed = parseRouteParams(rawTeammateId, rawDocumentId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const client = await getClientPromise();
    const document = await getAgentDocumentById(
      client.db(),
      auth.userId,
      parsed.teammateId,
      new ObjectId(parsed.documentId),
    );

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    return Response.json(document);
  } catch {
    return Response.json(
      { error: "Failed to fetch agent document" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId, documentId: rawDocumentId } =
      await context.params;
    const parsed = parseRouteParams(rawTeammateId, rawDocumentId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const body = (await request.json()) as {
      status?: unknown;
      title?: unknown;
      content?: unknown;
    };

    const client = await getClientPromise();
    const db = client.db();
    const documentObjectId = new ObjectId(parsed.documentId);

    const existing = await getAgentDocumentById(
      db,
      auth.userId,
      parsed.teammateId,
      documentObjectId,
    );

    if (!existing) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    if (body.title !== undefined || body.content !== undefined) {
      if (!canEditAgentDocument(existing.status)) {
        return Response.json(
          {
            error:
              "This deliverable can only be edited while it's awaiting review.",
          },
          { status: 400 },
        );
      }

      const title = typeof body.title === "string" ? body.title.trim() : "";
      const content = typeof body.content === "string" ? body.content : "";

      if (!title) {
        return Response.json({ error: "Title is required" }, { status: 400 });
      }

      if (isRichTextEmpty(content)) {
        return Response.json({ error: "Content is required" }, { status: 400 });
      }

      const document = await updateAgentDocumentContent(
        db,
        auth.userId,
        parsed.teammateId,
        documentObjectId,
        { title, content },
      );

      if (!document) {
        return Response.json({ error: "Document not found" }, { status: 404 });
      }

      const taskMatch = await findAgentTaskByDocumentId(
        db,
        auth.userId,
        parsed.teammateId,
        parsed.documentId,
      );

      if (taskMatch && taskMatch.task.outputDocumentTitle !== title) {
        await updateAgentTaskOutputDocumentTitle(
          db,
          auth.userId,
          parsed.teammateId,
          taskMatch.projectId,
          parsed.documentId,
          title,
        );
      }

      return Response.json(document);
    }

    const status = parseAgentDocumentStatus(body.status);

    if (status !== "accepted" && status !== "rejected") {
      return Response.json(
        { error: "status must be accepted or rejected" },
        { status: 400 },
      );
    }

    if (
      status === "accepted"
        ? !canAcceptAgentDocument(existing.status)
        : !canRejectAgentDocument(existing.status)
    ) {
      return Response.json(
        {
          error:
            status === "accepted"
              ? "Document is not ready to be marked complete"
              : "Document is not ready to be rejected",
        },
        { status: 400 },
      );
    }

    if (status === "accepted") {
      const document = await updateAgentDocumentStatus(
        db,
        auth.userId,
        parsed.teammateId,
        documentObjectId,
        status,
      );

      if (!document) {
        return Response.json({ error: "Document not found" }, { status: 404 });
      }

      return Response.json(document);
    }

    const { removedTask, record, projectId } =
      await rejectAndDeleteAgentTaskByDocumentId(
        db,
        auth.userId,
        parsed.teammateId,
        parsed.documentId,
      );

    const resolvedProjectId =
      projectId ?? new ObjectId(existing.projectId);
    const projectName = await getProjectNameForUser(
      db,
      auth.userId,
      resolvedProjectId,
    );
    const tasks = await serializeAgentTasksResponse(
      db,
      auth.userId,
      parsed.teammateId,
      resolvedProjectId.toString(),
      record,
      projectName,
    );

    return Response.json({
      documentId: parsed.documentId,
      taskTitle: removedTask?.title ?? null,
      tasks,
    });
  } catch {
    return Response.json(
      { error: "Failed to update agent document" },
      { status: 500 },
    );
  }
}
