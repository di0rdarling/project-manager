import { ObjectId } from "mongodb";
import { saveAgentDocumentAsProjectNote } from "@/lib/agents/save-agent-document-as-project-note";
import { parseTeammateId } from "@/lib/agents/agent-tasks-route-helpers";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ teammateId: string; documentId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId, documentId: rawDocumentId } =
      await context.params;
    const parsedTeammate = parseTeammateId(rawTeammateId);

    if ("error" in parsedTeammate) {
      return parsedTeammate.error;
    }

    if (!ObjectId.isValid(rawDocumentId)) {
      return Response.json({ error: "Invalid document id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db();
    const result = await saveAgentDocumentAsProjectNote(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      new ObjectId(rawDocumentId),
    );

    return Response.json(result, {
      status: result.alreadySaved ? 200 : 201,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Document not found") {
        return Response.json({ error: error.message }, { status: 404 });
      }

      if (error.message === "Only accepted documents can be saved as project notes") {
        return Response.json({ error: error.message }, { status: 409 });
      }
    }

    return Response.json(
      { error: "Failed to save document as project note" },
      { status: 500 },
    );
  }
}
