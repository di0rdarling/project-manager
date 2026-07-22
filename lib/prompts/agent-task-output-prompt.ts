import { buildAiTeammatesMemoryRosterPrompt } from "@/lib/prompts/ai-teammates-roster";
import { buildChatUserContextPrompt } from "@/lib/prompts/chat-user-context-prompt";
import {
  CONCISE_RESPONSE_STYLE_GUIDE,
  CONTEXT_GROUNDING_STYLE_GUIDE,
  PLAIN_ENGLISH_STYLE_GUIDE,
} from "@/lib/prompts/style-guide";
import {
  getChatTeammatePersonalityTraits,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import type { AgentTask } from "@/lib/types";

type BuildAgentTaskOutputPromptInput = {
  teammateId: ChatTeammateId;
  agentName: string;
  agentRole: string;
  projectName: string;
  projectContext: string;
  task: AgentTask;
  userName?: string | null;
  /** When true, the user asked for a fresh attempt — produce a new document. */
  isRegenerate?: boolean;
};

/**
 * Builds the prompt for actually producing the deliverable behind an
 * accepted agent task (the "Output" tab on the task detail modal). Reuses
 * the same identity/roster guardrails and personality traits as live chat
 * and task-suggestion prompts, so the produced content reads consistently
 * as this teammate's voice and work.
 */
export function buildAgentTaskOutputPrompt({
  teammateId,
  agentName,
  agentRole,
  projectName,
  projectContext,
  task,
  userName,
  isRegenerate = false,
}: BuildAgentTaskOutputPromptInput): string {
  const resolvedUserName = userName?.trim() || "the user";

  const sections = [
    buildAiTeammatesMemoryRosterPrompt(teammateId),
    "",
    buildChatUserContextPrompt(userName),
    ...getChatTeammatePersonalityTraits(teammateId),
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    ...CONCISE_RESPONSE_STYLE_GUIDE,
    ...CONTEXT_GROUNDING_STYLE_GUIDE,
    "",
    `${resolvedUserName} has accepted a task you suggested for yourself, on the project "${projectName}". You are ${agentName}, the ${agentRole}. It's time to actually do the work and produce the deliverable — not suggest it again, not describe what you would do, but write the real thing.`,
    "",
  ];

  if (isRegenerate) {
    sections.push(
      `${resolvedUserName} wasn't satisfied with your previous attempt and wants you to redo this task from scratch. Produce a fresh document — don't repeat the previous version verbatim; reconsider the approach and improve the deliverable.`,
      "",
    );
  }

  sections.push(
    "### The task you're completing",
    "",
    `Title: ${task.title}`,
    `What you said you'd do: ${task.detail}`,
    `Why you suggested it: ${task.rationale}`,
    `What you said you'd produce: ${task.outputDescription}`,
    "",
    "---",
    "",
    "### Project context",
    "",
    "Use this context to ground the deliverable in real specifics from the project — names, decisions, gaps — rather than generic content:",
    projectContext.trim(),
    "",
    "---",
    "",
    "### Output instructions",
    "",
    "You have a `create_document` tool. Calling it is how you actually deliver this work — it saves what you produce to the user's Documents for review. Do not respond with plain text describing what you would do; call `create_document` exactly once, with the finished deliverable as its arguments.",
    "",
    `- \`content\` is the actual deliverable itself: write a focused document with clearly organized sections or paragraphs. This is what ${resolvedUserName} will read as the finished output — do not describe it, write it.`,
    "- `content` must fulfil exactly what `output_description` above promised, grounded in the specific project context, not generic filler that could apply to any project.",
    "- `title` is a short, specific name for this document — this is how the user will find it in their Documents list, so make it identifiable at a glance.",
    "- `approach` explains, in your own voice, how you went about producing this — what you drew on, what you prioritized, and any notable choices — so the user understands your reasoning, not just the result.",
    "- `completion_summary` states plainly what is now true, unblocked, or de-risked for the project because this work is done, connecting back to the impact you originally described.",
    "- Write all fields in first person, exactly as you would describe your own completed work — never in the third person and never introducing yourself.",
  );

  return sections.join("\n");
}
