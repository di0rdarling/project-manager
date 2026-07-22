import { formatDisplayDateTime } from "@/lib/dates";
import { formatChatSummaries } from "@/lib/prompts/agent-memory-prompt";
import { buildAiTeammatesMemoryRosterPrompt } from "@/lib/prompts/ai-teammates-roster";
import { buildChatUserContextPrompt } from "@/lib/prompts/chat-user-context-prompt";
import {
  CONCISE_RESPONSE_STYLE_GUIDE,
  CONTEXT_GROUNDING_STYLE_GUIDE,
  INTERNAL_ARTIFACT_STYLE_GUIDE,
  PLAIN_ENGLISH_STYLE_GUIDE,
} from "@/lib/prompts/style-guide";
import {
  getChatTeammatePersonalityTraits,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import type { TeammateChatSummary } from "@/lib/chats/chat-summaries";
import { AGENT_TASK_COUNT } from "@/lib/agents/agent-tasks-json";

const JSON_SCHEMA_BLOCK = `{
  "tasks": Task[]
}`;

const TASK_SCHEMA_BLOCK = `{
  "title": string,             // 5–8 words, verb-led where possible
  "detail": string,            // 1–2 sentences: what you would do autonomously and why it helps the project
  "rationale": string,         // 3–5 sentences, a real case: cite the specific evidence for this task (a gap, an open thread, a stated goal, a past decision), connect it explicitly to the project's overarching goal, and preempt the most obvious objection the user might raise (e.g. "this can wait", "this doesn't matter yet")
  "impact": string,            // 2–4 sentences: what concretely becomes true or improves for the project if this gets done, and how that moves the project closer to its stated goal
  "risk_if_skipped": string,   // 2–4 sentences: what specifically stays broken, risky, or blocked if this is skipped, and how that puts the project's overarching goal — and your ability to help the user reach it — at risk
  "output_format": "note" | "document",  // default "note"; use "document" only for a longer structured deliverable (e.g. a full requirements draft, architecture write-up)
  "output_description": string // 2–3 sentences: what you will put in this note or document and what purpose it will serve for the project — this is what makes each task's deliverable distinct
}`;

type BuildAgentTasksPromptInput = {
  teammateId: ChatTeammateId;
  agentName: string;
  agentRole: string;
  projectName: string;
  projectContext: string;
  chatSummaries: TeammateChatSummary[];
  /**
   * The same standing notes/instructions the user has left on this
   * teammate's profile that are injected into live chat replies — kept
   * identical here so task suggestions never contradict or ignore them.
   */
  agentNotesContext?: string | null;
  /**
   * This teammate's existing structured Overview (most recently / decisions
   * / stable context), if any, so tasks stay consistent with what has
   * already been decided or is already known about the user's setup.
   */
  existingOverviewContext?: string | null;
  userName?: string | null;
  generatedAt?: Date;
};

/**
 * Builds the prompt for manually-triggered autonomous task suggestions on
 * an agent's profile page. This intentionally mirrors every context source
 * fed into a live chat reply (see buildChatSystemPrompt in chat-prompt.ts) —
 * identity/roster guardrails, personality traits, user notes, project
 * context, and prior conversation history — so the agent reasons about
 * what it could do next as itself, with nothing missing that it would
 * otherwise have available mid-conversation.
 */
export function buildAgentTasksPrompt({
  teammateId,
  agentName,
  agentRole,
  projectName,
  projectContext,
  chatSummaries,
  agentNotesContext,
  existingOverviewContext,
  userName,
  generatedAt = new Date(),
}: BuildAgentTasksPromptInput): string {
  const currentDateTime = formatDisplayDateTime(generatedAt.toISOString());
  const resolvedUserName = userName?.trim() || "the user";

  const conversationSection =
    chatSummaries.length > 0
      ? [
          "Recent conversations with this teammate about this project:",
          formatChatSummaries(chatSummaries, generatedAt),
        ].join("\n")
      : "No prior conversations with this teammate about this project yet.";

  const sections = [
    buildAiTeammatesMemoryRosterPrompt(teammateId),
    "",
    buildChatUserContextPrompt(userName),
    ...getChatTeammatePersonalityTraits(teammateId),
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    ...CONCISE_RESPONSE_STYLE_GUIDE,
    ...CONTEXT_GROUNDING_STYLE_GUIDE,
    ...INTERNAL_ARTIFACT_STYLE_GUIDE,
    "",
    `${resolvedUserName} is viewing your profile for the project "${projectName}". They want to see concrete work you could take on autonomously — tasks you can do yourself, within your role and personality above, that move the project toward its goal without needing them in the loop for every step.`,
    "",
    `Treat each task as something you need to actively convince ${resolvedUserName} is worth doing, not a suggestion you can leave unexplained. Assume they are busy and may push back with "is this really worth it right now?" — your rationale is where you make the case, specifically enough that a reasonable person reading it would agree this isn't optional busywork. If you cannot build that case for a task, don't suggest it.`,
  ];

  if (agentNotesContext?.trim()) {
    sections.push("", agentNotesContext.trim());
  }

  if (existingOverviewContext?.trim()) {
    sections.push(
      "",
      "What you already know about your shared work with this user, from your profile Overview (most recently, decisions made, and stable context) — stay consistent with this, do not suggest tasks that contradict or repeat it:",
      existingOverviewContext.trim(),
    );
  }

  sections.push(
    "",
    "---",
    "",
    "### Project context",
    "",
    "The user started this conversation to discuss the following project. Use this context to inform every task you suggest:",
    projectContext.trim(),
    "",
    "---",
    "",
    "### Conversation history",
    "",
    conversationSection,
    "",
    `Generated at: ${currentDateTime}.`,
    "",
    "---",
    "",
    "### Output instructions",
    "",
    "Return a JSON object with exactly these fields. No preamble, no markdown fencing, no explanation — just the JSON object.",
    "",
    "```",
    JSON_SCHEMA_BLOCK,
    "```",
    "",
    "Each Task:",
    "```",
    TASK_SCHEMA_BLOCK,
    "```",
    "",
    `- Return exactly ${AGENT_TASK_COUNT} tasks in the \`tasks\` array — no more, no fewer.`,
    "- Each task must be something you (this AI teammate) could realistically execute autonomously: research, drafting, analysis, structured updates to project thinking, etc.",
    "- Ground every task in the project context above. Prioritise work that advances the project's stated goal and fills obvious gaps.",
    "- Do not suggest tasks that require the user to do the work, generic advice with no deliverable, or tasks outside your role and personality.",
    "- Vary the tasks: different angles, different areas of the project, different types of autonomous output.",
    "- `rationale` must point to something specific — a gap, an open thread, a stated goal, a past decision — not a generic 'this is good practice' justification. If you can't point to a specific reason grounded in the context above, pick a different task.",
    "- `rationale` is the longest field and does real persuasive work: lay out the evidence, tie it to the project's overarching goal, and explicitly name and defuse the most likely reason the user would deprioritize this (e.g. why it can't just wait, why it's not premature, why it's not something they can just wing without this deliverable). Do not pad with restatement — every sentence should add a new piece of the case.",
    "- `impact` and `risk_if_skipped` must be concrete and specific to this project, not generic upsides/downsides that could apply to any task. `risk_if_skipped` should be honest about the real cost of skipping this — including that you, as the teammate responsible for this area, will be less able to help the user reach the project's goal if this gap is never closed.",
    "- Every task produces a tangible deliverable. Default `output_format` to `\"note\"` — a focused note the user can read and act on. Use `\"document\"` only when the deliverable is clearly longer-form and structured (e.g. a full requirements draft, an architecture overview).",
    "- `output_description` is what differentiates each task: spell out exactly what sections or content you would write, and what purpose that deliverable serves for the project (e.g. \"A note listing the three highest-risk assumptions in the current requirements, so the user can validate them before building\"). Do not repeat the task title — describe the artifact itself.",
    "- Write \"detail\", \"rationale\", \"impact\", \"risk_if_skipped\", and \"output_description\" in your own voice, first person, exactly as you would describe them in a live conversation — never in the third person and never introducing yourself.",
    "",
    "Return only the JSON object.",
  );

  return sections.join("\n");
}
