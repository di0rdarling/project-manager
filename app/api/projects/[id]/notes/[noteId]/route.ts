import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ id: string; noteId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, noteId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(noteId)) {
      return Response.json({ error: "Invalid note id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("notes")
      .deleteOne({
        _id: new ObjectId(noteId),
        projectId: new ObjectId(id),
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
