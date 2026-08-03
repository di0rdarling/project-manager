import {
  FunctionCallingMode,
  SchemaType,
  type FunctionDeclaration,
  type ToolConfig,
} from "@google/generative-ai";
import type OpenAI from "openai";
import type { Db, ObjectId } from "mongodb";
import { getAgentTaskDecisionStatus } from "@/lib/agents/agent-tasks";
import { renameTaskOverviewMessagesTaskTitle } from "@/lib/agents/agent-task-overview-store";
import { renameTaskOverviewSessionTaskTitle } from "@/lib/agents/agent-task-overview-session-store";
import {
  findAgentTaskByTitle,
  updateAgentTaskFields,
} from "@/lib/agents/agent-tasks-store";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentTask } from "@/lib/types";

const MIN_TITLE_LENGTH = 1;
const MIN_DETAIL_LENGTH = 20;
const MIN_RATIONALE_LENGTH = 50;
const MIN_IMPACT_LENGTH = 30;
const MIN_RISK_IF_SKIPPED_LENGTH = 30;
const MIN_OUTPUT_DESCRIPTION_LENGTH = 20;
const MIN_PROJECT_NAME_LENGTH = 1;

export const UPDATE_AGENT_TASK_TOOL_NAME = "update_task";

const UPDATE_AGENT_TASK_TOOL_DESCRIPTION =
  "Update one or more fields on the task the user is currently discussing. Call this when the user asks you to change the title, scope, rationale, impact, risk, planned deliverable, or project — or when you agree on refinements together. Only include fields you are changing. Do not call this to accept, reject, or start working on the task.";

const UPDATE_AGENT_TASK_TOOL_PROPERTIES = {
  title: {
    type: SchemaType.STRING,
    description:
      "Revised short task title (roughly 5-10 words) summarizing what the work is.",
  },
  detail: {
    type: SchemaType.STRING,
    description:
      "Revised task description: what the work involves and what done looks like.",
  },
  rationale: {
    type: SchemaType.STRING,
    description:
      "Revised explanation of why this task is worth doing now, grounded in project context.",
  },
  impact: {
    type: SchemaType.STRING,
    description:
      "Revised description of what improves or becomes true if this task is done.",
  },
  risk_if_skipped: {
    type: SchemaType.STRING,
    description:
      "Revised description of what stays blocked or at risk if this task is skipped.",
  },
  output_description: {
    type: SchemaType.STRING,
    description:
      "Revised description of the deliverable you would produce if the user accepts this task.",
  },
  project_name: {
    type: SchemaType.STRING,
    description:
      "Revised project name this task belongs to, when the user wants it associated with a different project label.",
  },
} as const;

/**
 * Tool the overview-chat agent calls to revise the suggested task the user
 * is discussing. Covers the same generated fields as initial task generation.
 */
export const UPDATE_AGENT_TASK_TOOL: FunctionDeclaration = {
  name: UPDATE_AGENT_TASK_TOOL_NAME,
  description: UPDATE_AGENT_TASK_TOOL_DESCRIPTION,
  parameters: {
    type: SchemaType.OBJECT,
    properties: UPDATE_AGENT_TASK_TOOL_PROPERTIES,
  },
};

export const UPDATE_AGENT_TASK_TOOL_CONFIG: ToolConfig = {
  functionCallingConfig: {
    mode: FunctionCallingMode.AUTO,
  },
};

export const UPDATE_AGENT_TASK_OPENAI_TOOL: OpenAI.Chat.Completions.ChatCompletionTool =
  {
    type: "function",
    function: {
      name: UPDATE_AGENT_TASK_TOOL_NAME,
      description: UPDATE_AGENT_TASK_TOOL_DESCRIPTION,
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: UPDATE_AGENT_TASK_TOOL_PROPERTIES.title.description,
          },
          detail: {
            type: "string",
            description: UPDATE_AGENT_TASK_TOOL_PROPERTIES.detail.description,
          },
          rationale: {
            type: "string",
            description:
              UPDATE_AGENT_TASK_TOOL_PROPERTIES.rationale.description,
          },
          impact: {
            type: "string",
            description: UPDATE_AGENT_TASK_TOOL_PROPERTIES.impact.description,
          },
          risk_if_skipped: {
            type: "string",
            description:
              UPDATE_AGENT_TASK_TOOL_PROPERTIES.risk_if_skipped.description,
          },
          output_description: {
            type: "string",
            description:
              UPDATE_AGENT_TASK_TOOL_PROPERTIES.output_description.description,
          },
          project_name: {
            type: "string",
            description:
              UPDATE_AGENT_TASK_TOOL_PROPERTIES.project_name.description,
          },
        },
      },
    },
  };

export type UpdateAgentTaskToolArgs = {
  title?: string;
  detail?: string;
  rationale?: string;
  impact?: string;
  riskIfSkipped?: string;
  outputDescription?: string;
  projectName?: string;
};

function asOptionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function parseUpdateAgentTaskToolArgs(
  args: unknown,
): UpdateAgentTaskToolArgs {
  const record =
    args && typeof args === "object" ? (args as Record<string, unknown>) : {};

  const parsed: UpdateAgentTaskToolArgs = {
    title: asOptionalTrimmedString(record.title),
    detail: asOptionalTrimmedString(record.detail),
    rationale: asOptionalTrimmedString(record.rationale),
    impact: asOptionalTrimmedString(record.impact),
    riskIfSkipped: asOptionalTrimmedString(record.risk_if_skipped),
    outputDescription: asOptionalTrimmedString(record.output_description),
    projectName: asOptionalTrimmedString(record.project_name),
  };

  const hasAnyField = Object.values(parsed).some(Boolean);

  if (!hasAnyField) {
    throw new Error("update_task requires at least one field to update");
  }

  if (parsed.title && parsed.title.length < MIN_TITLE_LENGTH) {
    throw new Error("update_task title cannot be empty");
  }

  if (parsed.detail && parsed.detail.length < MIN_DETAIL_LENGTH) {
    throw new Error(
      `update_task detail must be at least ${MIN_DETAIL_LENGTH} characters`,
    );
  }

  if (parsed.rationale && parsed.rationale.length < MIN_RATIONALE_LENGTH) {
    throw new Error(
      `update_task rationale must be at least ${MIN_RATIONALE_LENGTH} characters`,
    );
  }

  if (parsed.impact && parsed.impact.length < MIN_IMPACT_LENGTH) {
    throw new Error(
      `update_task impact must be at least ${MIN_IMPACT_LENGTH} characters`,
    );
  }

  if (
    parsed.riskIfSkipped &&
    parsed.riskIfSkipped.length < MIN_RISK_IF_SKIPPED_LENGTH
  ) {
    throw new Error(
      `update_task risk_if_skipped must be at least ${MIN_RISK_IF_SKIPPED_LENGTH} characters`,
    );
  }

  if (
    parsed.outputDescription &&
    parsed.outputDescription.length < MIN_OUTPUT_DESCRIPTION_LENGTH
  ) {
    throw new Error(
      `update_task output_description must be at least ${MIN_OUTPUT_DESCRIPTION_LENGTH} characters`,
    );
  }

  if (
    parsed.projectName &&
    parsed.projectName.length < MIN_PROJECT_NAME_LENGTH
  ) {
    throw new Error("update_task project_name cannot be empty");
  }

  return parsed;
}

export type ExecuteUpdateAgentTaskToolInput = {
  db: Db;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  projectId: ObjectId;
  taskTitle: string;
  args: UpdateAgentTaskToolArgs;
};

export type UpdateAgentTaskToolResult = {
  success: boolean;
  message: string;
  task?: AgentTask;
  updatedFields?: string[];
  previousTaskTitle?: string;
};

export async function executeUpdateAgentTaskTool({
  db,
  userId,
  teammateId,
  projectId,
  taskTitle,
  args,
}: ExecuteUpdateAgentTaskToolInput): Promise<UpdateAgentTaskToolResult> {
  const task = await findAgentTaskByTitle(
    db,
    userId,
    teammateId,
    projectId,
    taskTitle,
  );

  if (!task) {
    return {
      success: false,
      message: "Task not found.",
    };
  }

  if (getAgentTaskDecisionStatus(task) !== "pending") {
    return {
      success: false,
      message:
        "This task has already been accepted or rejected and can no longer be edited.",
    };
  }

  try {
    const result = await updateAgentTaskFields(
      db,
      userId,
      teammateId,
      projectId,
      taskTitle,
      args,
    );

    if (!result) {
      return {
        success: false,
        message: "Failed to save task updates.",
      };
    }

    const titleChanged = result.task.title !== result.previousTitle;

    if (titleChanged) {
      await renameTaskOverviewMessagesTaskTitle(
        db,
        userId,
        teammateId,
        projectId,
        result.previousTitle,
        result.task.title,
      );

      await renameTaskOverviewSessionTaskTitle(
        db,
        {
          userId,
          teammateId,
          projectId,
          taskTitle: result.previousTitle,
        },
        result.task.title,
      );
    }

    const updatedFields = Object.entries({
      title: args.title,
      detail: args.detail,
      rationale: args.rationale,
      impact: args.impact,
      riskIfSkipped: args.riskIfSkipped,
      outputDescription: args.outputDescription,
      projectName: args.projectName,
    })
      .filter(([, value]) => Boolean(value))
      .map(([field]) => field);

    return {
      success: true,
      message: `Updated ${updatedFields.join(", ")}.`,
      task: result.task,
      updatedFields,
      ...(titleChanged ? { previousTaskTitle: result.previousTitle } : {}),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to save task updates.",
    };
  }
}
