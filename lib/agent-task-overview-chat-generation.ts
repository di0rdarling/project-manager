import type { Content, Part } from "@google/generative-ai";
import type OpenAI from "openai";
import type { Db, ObjectId } from "mongodb";
import {
  executeUpdateAgentTaskTool,
  parseUpdateAgentTaskToolArgs,
  UPDATE_AGENT_TASK_OPENAI_TOOL,
  UPDATE_AGENT_TASK_TOOL,
  UPDATE_AGENT_TASK_TOOL_CONFIG,
  UPDATE_AGENT_TASK_TOOL_NAME,
  type UpdateAgentTaskToolResult,
} from "@/lib/agents/agent-task-edit-tool";
import {
  getChatModelApiName,
  getChatModelProvider,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import type { KimiReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  getGeminiClient,
  type GeminiChatMessage,
  type GenerateChatReplyResult,
} from "@/lib/gemini";
import { getKimiClient, KimiApiError } from "@/lib/kimi";
import { buildChatSystemPrompt } from "@/lib/prompts/chat-prompt";
import type { AgentTask } from "@/lib/types";

const MAX_TOOL_ROUNDS = 5;

export type AgentTaskOverviewToolContext = {
  db: Db;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  projectId: ObjectId;
  taskTitle: string;
};

export type GenerateAgentTaskOverviewChatReplyInput = {
  history: GeminiChatMessage[];
  message: string;
  teammateId: ChatTeammateId;
  projectContext?: string;
  otherConversationsContext?: string;
  otherTeammatesContext?: string;
  agentNotesContext?: string;
  userName?: string | null;
  modelId: ChatModelId;
  reasoningEffort?: KimiReasoningEffort;
  generatedAt?: Date;
  taskOverviewContext?: string;
  agentTasksDocumentsContext?: string;
};

export type GenerateAgentTaskOverviewChatReplyResult = GenerateChatReplyResult & {
  updatedTask: AgentTask | null;
};

type SharedGenerationInput = GenerateAgentTaskOverviewChatReplyInput & {
  systemPrompt: string;
  toolContext: AgentTaskOverviewToolContext;
};

function buildSystemPrompt(
  input: GenerateAgentTaskOverviewChatReplyInput,
): string {
  return buildChatSystemPrompt(
    input.teammateId,
    input.projectContext,
    input.otherConversationsContext,
    input.otherTeammatesContext,
    input.agentNotesContext,
    input.userName,
    input.generatedAt,
    input.taskOverviewContext,
    input.agentTasksDocumentsContext,
  );
}

function formatToolResult(result: UpdateAgentTaskToolResult): Record<string, unknown> {
  return {
    success: result.success,
    message: result.message,
    ...(result.updatedFields ? { updated_fields: result.updatedFields } : {}),
  };
}

async function runUpdateTaskTool(
  rawArgs: unknown,
  toolContext: AgentTaskOverviewToolContext,
  onTaskUpdated: (task: AgentTask) => void,
): Promise<UpdateAgentTaskToolResult> {
  try {
    const args = parseUpdateAgentTaskToolArgs(rawArgs);
    const result = await executeUpdateAgentTaskTool({
      ...toolContext,
      args,
    });

    if (result.success && result.task) {
      onTaskUpdated(result.task);

      if (
        result.previousTaskTitle &&
        result.task.title !== result.previousTaskTitle
      ) {
        toolContext.taskTitle = result.task.title;
      }
    }

    return result;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Invalid update_task arguments.",
    };
  }
}

async function generateGeminiOverviewChatReply(
  input: SharedGenerationInput,
  onTaskUpdated: (task: AgentTask) => void,
): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({
    model: getChatModelApiName(input.modelId),
    systemInstruction: input.systemPrompt,
    tools: [{ functionDeclarations: [UPDATE_AGENT_TASK_TOOL] }],
    toolConfig: UPDATE_AGENT_TASK_TOOL_CONFIG,
  });

  const history: Content[] = input.history.map((entry) => ({
    role: entry.role,
    parts: [{ text: entry.content }],
  }));

  const chat = model.startChat({ history });
  let result = await chat.sendMessage(input.message);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const functionCalls = result.response.functionCalls() ?? [];

    if (functionCalls.length === 0) {
      break;
    }

    const functionResponses: Part[] = [];

    for (const call of functionCalls) {
      if (call.name !== UPDATE_AGENT_TASK_TOOL_NAME) {
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: {
              success: false,
              message: `Unknown tool: ${call.name}`,
            },
          },
        });
        continue;
      }

      const toolResult = await runUpdateTaskTool(
        call.args,
        input.toolContext,
        onTaskUpdated,
      );

      functionResponses.push({
        functionResponse: {
          name: call.name,
          response: formatToolResult(toolResult),
        },
      });
    }

    result = await chat.sendMessage(functionResponses);
  }

  const text = result.response.text().trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

function toKimiRole(role: GeminiChatMessage["role"]): "user" | "assistant" {
  return role === "model" ? "assistant" : "user";
}

async function generateKimiOverviewChatReply(
  input: SharedGenerationInput,
  onTaskUpdated: (task: AgentTask) => void,
): Promise<string> {
  const client = getKimiClient();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: input.systemPrompt },
    ...input.history.map((entry) => ({
      role: toKimiRole(entry.role),
      content: entry.content,
    })),
    { role: "user", content: input.message },
  ];

  let completion = await client.chat.completions.create({
    model: getChatModelApiName(input.modelId),
    ...(input.reasoningEffort ? { reasoning_effort: input.reasoningEffort } : {}),
    messages,
    tools: [UPDATE_AGENT_TASK_OPENAI_TOOL],
  } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const assistantMessage = completion.choices[0]?.message;

    if (!assistantMessage?.tool_calls?.length) {
      break;
    }

    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.type !== "function") {
        continue;
      }

      let toolResult: UpdateAgentTaskToolResult;

      if (toolCall.function.name !== UPDATE_AGENT_TASK_TOOL_NAME) {
        toolResult = {
          success: false,
          message: `Unknown tool: ${toolCall.function.name}`,
        };
      } else {
        try {
          const parsedArgs = JSON.parse(toolCall.function.arguments);
          toolResult = await runUpdateTaskTool(
            parsedArgs,
            input.toolContext,
            onTaskUpdated,
          );
        } catch (error) {
          toolResult = {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Tool arguments were not valid JSON.",
          };
        }
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(formatToolResult(toolResult)),
      });
    }

    completion = await client.chat.completions.create({
      model: getChatModelApiName(input.modelId),
      ...(input.reasoningEffort ? { reasoning_effort: input.reasoningEffort } : {}),
      messages,
      tools: [UPDATE_AGENT_TASK_OPENAI_TOOL],
    } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);
  }

  const assistantMessage = completion.choices[0]?.message;
  const content = assistantMessage?.content?.trim();
  const reasoningContent = (
    assistantMessage as OpenAI.Chat.Completions.ChatCompletionMessage & {
      reasoning_content?: string | null;
    }
  )?.reasoning_content?.trim();

  const text = content || reasoningContent;

  if (!text) {
    throw new KimiApiError("Kimi returned an empty response.", 502);
  }

  return text;
}

export async function generateAgentTaskOverviewChatReply(
  input: GenerateAgentTaskOverviewChatReplyInput,
  toolContext: AgentTaskOverviewToolContext,
): Promise<GenerateAgentTaskOverviewChatReplyResult> {
  let updatedTask: AgentTask | null = null;

  const onTaskUpdated = (task: AgentTask) => {
    updatedTask = task;
  };

  const sharedInput: SharedGenerationInput = {
    ...input,
    systemPrompt: buildSystemPrompt(input),
    toolContext,
  };

  const content =
    getChatModelProvider(input.modelId) === "kimi"
      ? await generateKimiOverviewChatReply(sharedInput, onTaskUpdated)
      : await generateGeminiOverviewChatReply(sharedInput, onTaskUpdated);

  return { content, updatedTask };
}
