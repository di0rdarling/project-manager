import { ObjectId, type Db } from "mongodb";
import { isAgentDocumentAccepted } from "@/lib/agents/agent-documents";
import {
  getAgentDocumentById,
  updateAgentDocumentSavedProjectNoteId,
} from "@/lib/agents/agent-documents-store";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { AgentDocumentResponse, Note, NoteResponse } from "@/lib/types";

type StoredNote = Omit<Note, "_id" | "projectId" | "createdAt" | "updatedAt"> & {
  _id: Note["_id"];
  projectId: Note["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializeNote(note: StoredNote): NoteResponse {
  return {
    _id: note._id.toString(),
    userId: note.userId.toString(),
    projectId: note.projectId.toString(),
    featureId: note.featureId ? note.featureId.toString() : null,
    folderId: note.folderId ? note.folderId.toString() : null,
    title: typeof note.title === "string" ? note.title : "",
    content: note.content,
    createdAt: toIsoString(note.createdAt),
    updatedAt: note.updatedAt
      ? toIsoString(note.updatedAt)
      : toIsoString(note.createdAt),
  };
}

async function getExistingSavedNote(
  db: Db,
  userId: ObjectId,
  projectId: ObjectId,
  savedProjectNoteId: string,
): Promise<NoteResponse | null> {
  if (!ObjectId.isValid(savedProjectNoteId)) {
    return null;
  }

  const note = await db.collection<StoredNote>("notes").findOne({
    _id: new ObjectId(savedProjectNoteId),
    userId,
    projectId,
  });

  return note ? serializeNote(note) : null;
}

export async function saveAgentDocumentAsProjectNote(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: ObjectId,
): Promise<{
  note: NoteResponse;
  document: AgentDocumentResponse;
  alreadySaved: boolean;
}> {
  const document = await getAgentDocumentById(
    db,
    userId,
    teammateId,
    documentId,
  );

  if (!document) {
    throw new Error("Document not found");
  }

  if (!isAgentDocumentAccepted(document.status)) {
    throw new Error("Only accepted documents can be saved as project notes");
  }

  const projectId = new ObjectId(document.projectId);

  if (document.savedProjectNoteId) {
    const existingNote = await getExistingSavedNote(
      db,
      userId,
      projectId,
      document.savedProjectNoteId,
    );

    if (existingNote) {
      return {
        note: existingNote,
        document,
        alreadySaved: true,
      };
    }
  }

  const noteTitle = document.title.trim() || "Untitled document";
  const noteContent = document.content.trim();

  if (isRichTextEmpty(noteContent)) {
    throw new Error("Note content is required");
  }

  const now = new Date().toISOString();
  const note: Omit<Note, "_id"> = {
    userId,
    projectId,
    featureId: null,
    folderId: null,
    title: noteTitle,
    content: noteContent,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await db
    .collection<Omit<Note, "_id">>("notes")
    .insertOne(note);
  const savedNote = serializeNote({ ...note, _id: insertResult.insertedId });
  const updatedDocument = await updateAgentDocumentSavedProjectNoteId(
    db,
    userId,
    teammateId,
    documentId,
    savedNote._id,
  );

  if (!updatedDocument) {
    throw new Error("Failed to update document");
  }

  return {
    note: savedNote,
    document: updatedDocument,
    alreadySaved: false,
  };
}
