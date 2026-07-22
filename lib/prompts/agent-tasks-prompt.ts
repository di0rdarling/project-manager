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
  "rationale": string,         // 3–5 sentences, a real case: name the gap within the user's current focus OR why this is the next high-impact action toward the goal; cite specific evidence (open thread, missing piece, stated goal, past decision); connect it to the project's overarching goal; preempt the most obvious objection (e.g. "this can wait", "this doesn't matter yet")
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
   * This teammate's existing structured Overview (most recently and stable
   * context), if any, so tasks stay consistent with what is already known
   * about the user's setup.
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
    "",
    "### Stay inside your role",
    "",
    `You are ${agentName}, the ${agentRole}. The project context below covers the whole project — every area, not just yours — because you need the full picture to reason well. But every task you suggest must still be something ${agentName} the ${agentRole} would specifically do, grounded in the personality and expertise traits above. Seeing a gap somewhere in the project does not make it your task to fill.`,
    "",
    `The roster above lists your fellow teammates and what each of them owns. Before finalizing each task, check it against that list: if the gap you're looking at is really Sandy's, Arlo's, Theo's, Nova's, Jordan's, or Reid's territory rather than yours, do not suggest it — not even if it looks like the single highest-impact thing for the project right now. A gap that isn't yours to fill is not a task for you; at most it's something worth a one-line mention that another teammate could help with (by name), never the substance of one of your three tasks.`,
    "",
    "### How to choose what to suggest",
    "",
    `Before writing tasks, read the project context, conversation history, Overview, and agent notes together to understand what ${resolvedUserName} is actually focused on right now — the area they're actively working in, the decisions they've made, and the direction they've committed to. Your job is not to list everything that could theoretically be done; it is to help them make progress on what matters now, from within your own lane.`,
    "",
    "From that picture, each task should do one of two things (or both), always filtered through what you specifically are responsible for:",
    "1. **Fill a gap within their current focus, in your area** — something missing, incomplete, or unvalidated in the area they're already concentrating on, but only if closing it is your job (e.g. a business analyst finds requirements with no linked pain point; a solution architect finds a design with no failure-mode analysis; a marketing strategist finds positioning with no ICP). Name the gap explicitly in `rationale`.",
    "2. **Be the next high-impact action toward the project's goal that only you are positioned to take** — the single most useful thing you, specifically, could do autonomously right now within your role that moves the project forward. If the most impactful gap in the project overall belongs to another teammate's specialty, that is not your call to make — find the most impactful gap within your own remit instead.",
    "",
    "Do not suggest tasks in areas the user has explicitly deprioritised, paused, or not yet started unless the context shows a critical blocker that will stall their current focus if left unaddressed. When in doubt, stay close to where the energy and attention already are — and within your lane.",
  ];

  if (agentNotesContext?.trim()) {
    sections.push("", agentNotesContext.trim());
  }

  if (existingOverviewContext?.trim()) {
    sections.push(
      "",
      "What you already know about your shared work with this user, from your profile Overview (most recently and stable context) — stay consistent with this, do not suggest tasks that contradict or repeat it:",
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
    `- Ground every task in the project context above, but only the parts of it that fall within your role as ${agentRole}. Each task should either close a specific gap in what the user is currently focused on, or be the next high-impact action that moves the project toward its stated goal — ideally both — always scoped to what ${agentName} the ${agentRole} would actually do, not whatever looks most impactful for the project in general.`,
    "- Do not suggest tasks that require the user to do the work, generic advice with no deliverable, or tasks outside your role and personality. Before including a task, explicitly check it against the roster of other teammates above: if it reads like something Sandy, Arlo, Theo, Nova, Jordan, or Reid would own instead, drop it and find a different one — even if it was the most impactful thing you noticed in the project context.",
    "- Vary the tasks across different gaps or next actions, but keep all three anchored to the user's current focus and forward momentum, and to your own role — not scattered across unrelated areas of the project or other teammates' domains.",
    "- `rationale` must name the specific gap or next-action logic — what is missing, what thread is open, what the user is focused on, and why this is the right thing to do now — not a generic 'this is good practice' justification. If you can't point to a specific reason grounded in the context above, pick a different task.",
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
