import {
  FunctionCallingMode,
  SchemaType,
  type FunctionDeclaration,
  type ToolConfig,
} from "@google/generative-ai";
import type { Db, ObjectId } from "mongodb";
import { createAgentDocument } from "@/lib/agents/agent-documents-store";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentDocumentResponse } from "@/lib/types";

const MIN_CONTENT_LENGTH = 40;
const MIN_APPROACH_LENGTH = 20;
const MIN_COMPLETION_SUMMARY_LENGTH = 20;

/**
 * The tool this agent calls to actually create the deliverable behind a
 * completed task. Rather than describing what it would produce, the model
 * calls this function with the finished note/document — we execute the
 * call server-side by persisting a real AgentDocument, so it shows up in
 * this teammate's Documents section for the user to review.
 */
export const CREATE_AGENT_DOCUMENT_TOOL: FunctionDeclaration = {
  name: "create_document",
  description:
    "Create and save the note or document deliverable for this completed task. Call this exactly once, with the finished content, so it is persisted to the user's Documents for review.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description:
          "A short, specific title for the document (roughly 5-10 words).",
      },
      content: {
        type: SchemaType.STRING,
        description:
          "The full body of the note or document — the actual deliverable, ready for the user to read and act on.",
      },
      approach: {
        type: SchemaType.STRING,
        description:
          "2-4 sentences, first person: how you tackled this and the choices you made while producing it.",
      },
      completion_summary: {
        type: SchemaType.STRING,
        description:
          "2-3 sentences, first person: what is now true or unblocked for the project because this is done.",
      },
    },
    required: ["title", "content", "approach", "completion_summary"],
  },
};

export const CREATE_AGENT_DOCUMENT_TOOL_CONFIG: ToolConfig = {
  functionCallingConfig: {
    mode: FunctionCallingMode.ANY,
    allowedFunctionNames: [CREATE_AGENT_DOCUMENT_TOOL.name],
  },
};

export type CreateAgentDocumentToolArgs = {
  title: string;
  content: string;
  approach: string;
  completionSummary: string;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Validates and normalizes the raw args Gemini passed to the tool call. */
export function parseCreateAgentDocumentToolArgs(
  args: unknown,
): CreateAgentDocumentToolArgs {
  const record =
    args && typeof args === "object" ? (args as Record<string, unknown>) : {};
  const title = asTrimmedString(record.title);
  const content = asTrimmedString(record.content);
  const approach = asTrimmedString(record.approach);
  const completionSummary = asTrimmedString(record.completion_summary);

  if (
    !title ||
    content.length < MIN_CONTENT_LENGTH ||
    approach.length < MIN_APPROACH_LENGTH ||
    completionSummary.length < MIN_COMPLETION_SUMMARY_LENGTH
  ) {
    throw new Error("create_document tool call was missing required fields");
  }

  return { title, content, approach, completionSummary };
}

type ExecuteCreateAgentDocumentToolInput = {
  db: Db;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  projectId: ObjectId;
  projectName?: string | null;
  taskTitle: string;
  args: CreateAgentDocumentToolArgs;
};

/**
 * Executes the create_document tool call: persists the deliverable as a
 * real AgentDocument so it shows up in the agent's Documents section,
 * ready for review.
 */
export async function executeCreateAgentDocumentTool({
  db,
  userId,
  teammateId,
  projectId,
  projectName,
  taskTitle,
  args,
}: ExecuteCreateAgentDocumentToolInput): Promise<AgentDocumentResponse> {
  return createAgentDocument(db, {
    userId,
    teammateId,
    projectId,
    projectName,
    taskTitle,
    title: args.title,
    content: args.content,
    status: "ready_for_review",
  });
}
