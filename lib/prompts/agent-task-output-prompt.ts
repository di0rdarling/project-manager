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
import type { AgentTask, AgentTaskOutputFormat } from "@/lib/types";

const JSON_SCHEMA_BLOCK = `{
  "content": string,           // the actual deliverable — the full note/document body, ready for the user to read and act on
  "approach": string,          // 2–4 sentences, first person: how you tackled this, what you looked at, and the choices you made while producing the deliverable
  "completion_summary": string // 2–3 sentences, first person: what is now true or unblocked for the project because this is done, tied back to the task's stated impact
}`;

const OUTPUT_FORMAT_GUIDANCE: Record<AgentTaskOutputFormat, string> = {
  note: "a focused note: a few clearly organized paragraphs or a short list, not a sprawling document",
  document: "a longer structured document: use headings/sections appropriate to the deliverable described",
};

type BuildAgentTaskOutputPromptInput = {
  teammateId: ChatTeammateId;
  agentName: string;
  agentRole: string;
  projectName: string;
  projectContext: string;
  task: AgentTask;
  userName?: string | null;
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
}: BuildAgentTaskOutputPromptInput): string {
  const resolvedUserName = userName?.trim() || "the user";
  const formatGuidance =
    OUTPUT_FORMAT_GUIDANCE[task.outputFormat] ?? OUTPUT_FORMAT_GUIDANCE.note;

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
    "Return a JSON object with exactly these fields. No preamble, no markdown fencing outside the JSON, no explanation — just the JSON object.",
    "",
    "```",
    JSON_SCHEMA_BLOCK,
    "```",
    "",
    `- \`content\` is the actual deliverable itself: write ${formatGuidance}. This is what ${resolvedUserName} will read as the finished output — do not describe it, write it.`,
    "- `content` must fulfil exactly what `output_description` above promised, grounded in the specific project context, not generic filler that could apply to any project.",
    "- `approach` explains, in your own voice, how you went about producing this — what you drew on, what you prioritized, and any notable choices — so the user understands your reasoning, not just the result.",
    "- `completion_summary` states plainly what is now true, unblocked, or de-risked for the project because this work is done, connecting back to the impact you originally described.",
    "- Write all three fields in first person, exactly as you would describe your own completed work — never in the third person and never introducing yourself.",
    "",
    "Return only the JSON object.",
  ];

  return sections.join("\n");
}
