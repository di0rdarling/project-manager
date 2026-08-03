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

function toKimiRole(role: GeminiChatMessage["role"]): "user" | "assistant" {
  return role === "model" ? "assistant" : "user";
}

export type AgentTaskOverviewChatReplyStreamYield =
  | { type: "token"; delta: string }
  | {
      type: "complete";
      result: GenerateAgentTaskOverviewChatReplyResult;
    };

async function* streamGeminiOverviewChatReply(
  input: SharedGenerationInput,
  onTaskUpdated: (task: AgentTask) => void,
): AsyncGenerator<AgentTaskOverviewChatReplyStreamYield> {
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
  let messageToSend: string | Part[] = input.message;
  let finalText = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const streamResult = await chat.sendMessageStream(messageToSend);
    let roundText = "";

    for await (const chunk of streamResult.stream) {
      const chunkText = chunk.text();

      if (!chunkText) {
        continue;
      }

      roundText += chunkText;
      yield { type: "token", delta: chunkText };
    }

    const response = await streamResult.response;
    const functionCalls = response.functionCalls() ?? [];

    if (functionCalls.length === 0) {
      finalText = roundText.trim() || response.text().trim();
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

    messageToSend = functionResponses;
  }

  if (!finalText) {
    throw new Error("Gemini returned an empty response");
  }

  yield {
    type: "complete",
    result: {
      content: finalText,
      updatedTask: null,
    },
  };
}

async function* streamKimiOverviewChatReply(
  input: SharedGenerationInput,
  onTaskUpdated: (task: AgentTask) => void,
): AsyncGenerator<AgentTaskOverviewChatReplyStreamYield> {
  const client = getKimiClient();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: input.systemPrompt },
    ...input.history.map((entry) => ({
      role: toKimiRole(entry.role),
      content: entry.content,
    })),
    { role: "user", content: input.message },
  ];

  let finalText = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const stream = await client.chat.completions.create({
      model: getChatModelApiName(input.modelId),
      ...(input.reasoningEffort ? { reasoning_effort: input.reasoningEffort } : {}),
      messages,
      tools: [UPDATE_AGENT_TASK_OPENAI_TOOL],
      stream: true,
    });

    let roundText = "";
    let assistantMessage:
      | OpenAI.Chat.Completions.ChatCompletionMessage
      | undefined;
    const toolCallsByIndex = new Map<
      number,
      { id: string; name: string; arguments: string }
    >();

    for await (const chunk of stream) {
      const choice = chunk.choices[0];

      if (!choice) {
        continue;
      }

      if (choice.delta.content) {
        roundText += choice.delta.content;
        yield { type: "token", delta: choice.delta.content };
      }

      if (choice.delta.tool_calls) {
        for (const toolCall of choice.delta.tool_calls) {
          const existing = toolCallsByIndex.get(toolCall.index);

          if (!existing) {
            toolCallsByIndex.set(toolCall.index, {
              id: toolCall.id ?? "",
              name: toolCall.function?.name ?? "",
              arguments: toolCall.function?.arguments ?? "",
            });
            continue;
          }

          if (toolCall.function?.name) {
            existing.name += toolCall.function.name;
          }

          if (toolCall.function?.arguments) {
            existing.arguments += toolCall.function.arguments;
          }
        }
      }

      if (choice.finish_reason) {
        assistantMessage = {
          role: "assistant",
          content: roundText || null,
          refusal: null,
          tool_calls:
            toolCallsByIndex.size > 0
              ? Array.from(toolCallsByIndex.values()).map((toolCall) => ({
                  id: toolCall.id,
                  type: "function" as const,
                  function: {
                    name: toolCall.name,
                    arguments: toolCall.arguments,
                  },
                }))
              : undefined,
        };
      }
    }

    const toolCalls = assistantMessage?.tool_calls ?? [];

    if (!toolCalls.length) {
      const reasoningContent = (
        assistantMessage as OpenAI.Chat.Completions.ChatCompletionMessage & {
          reasoning_content?: string | null;
        }
      )?.reasoning_content?.trim();
      finalText = roundText.trim() || reasoningContent || "";

      if (!finalText) {
        throw new KimiApiError("Kimi returned an empty response.", 502);
      }

      break;
    }

    messages.push(assistantMessage!);

    for (const toolCall of toolCalls) {
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
  }

  if (!finalText) {
    throw new KimiApiError("Kimi returned an empty response.", 502);
  }

  yield {
    type: "complete",
    result: {
      content: finalText,
      updatedTask: null,
    },
  };
}

export async function* streamAgentTaskOverviewChatReply(
  input: GenerateAgentTaskOverviewChatReplyInput,
  toolContext: AgentTaskOverviewToolContext,
): AsyncGenerator<AgentTaskOverviewChatReplyStreamYield> {
  let updatedTask: AgentTask | null = null;

  const onTaskUpdated = (task: AgentTask) => {
    updatedTask = task;
  };

  const sharedInput: SharedGenerationInput = {
    ...input,
    systemPrompt: buildSystemPrompt(input),
    toolContext,
  };

  const providerStream =
    getChatModelProvider(input.modelId) === "kimi"
      ? streamKimiOverviewChatReply(sharedInput, onTaskUpdated)
      : streamGeminiOverviewChatReply(sharedInput, onTaskUpdated);

  for await (const event of providerStream) {
    if (event.type === "complete") {
      yield {
        type: "complete",
        result: {
          ...event.result,
          updatedTask,
        },
      };
      continue;
    }

    yield event;
  }
}

export async function generateAgentTaskOverviewChatReply(
  input: GenerateAgentTaskOverviewChatReplyInput,
  toolContext: AgentTaskOverviewToolContext,
): Promise<GenerateAgentTaskOverviewChatReplyResult> {
  let result: GenerateAgentTaskOverviewChatReplyResult | undefined;

  for await (const event of streamAgentTaskOverviewChatReply(input, toolContext)) {
    if (event.type === "complete") {
      result = event.result;
    }
  }

  if (!result) {
    throw new Error("Agent task overview chat returned an empty response");
  }

  return result;
}
