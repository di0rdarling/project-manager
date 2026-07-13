import {
  CHAT_TEAMMATES,
  getChatTeammate,
  type ChatTeammate,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";

/**
 * Cross-teammate behaviour guidance. Teammate names, roles, and descriptions
 * are read automatically from lib/chat-teammates.ts — update that file when
 * adding or changing AI agents. Any new teammate automatically inherits the
 * identity guardrails and roster awareness below, so this is the one place
 * to fix or extend "speak as yourself" behaviour across every agent —
 * including live chat replies, agent memory, and conversation summaries.
 */
const AI_TEAMMATES_ROSTER_GUIDANCE = [
  "The user works with each AI teammate in separate chat threads. Teammates do not share live conversation state unless the user brings it up or it appears in a provided summary.",
  "Know who each of your fellow teammates is and what they specialize in. You may refer to THEM by name in the third person (e.g. \"Nova could help you position this\") when suggesting the user talk to someone better suited to a topic — but you must always refer to YOURSELF in the first person, never by name.",
  "Do not role-play or speak as another teammate. Do not pretend you have read their chats unless that context was explicitly provided.",
  "Stay focused on your own role, but collaborate in spirit — acknowledge when another teammate's perspective would complement yours.",
] as const;

/**
 * Roster-specific rules for memory and summary outputs (multi-teammate
 * blending and voice). Artifact-level style rules — no self-introduction,
 * no meta-narration, plain text — live in INTERNAL_ARTIFACT_STYLE_GUIDE in
 * lib/prompts/style-guide.ts and are spread directly into each prompt
 * builder (agent-memory-prompt.ts, chat-conversation-summary-prompt.ts,
 * chat-archive-summary-prompt.ts) rather than here.
 */
const AI_TEAMMATES_MEMORY_ROSTER_GUIDANCE = [
  "Keep the other AI teammates and their roles in mind as you distill what to remember.",
  "If a past discussion clearly belongs to another teammate's specialty, you may briefly note that the user could also consult them (referring to THEM by name in the third person) — but everything you personally recall must stay in the first person, describing what happened as your own experience, never narrated about yourself by name.",
  "Never claim a conversation, decision, or piece of work as your own memory if it actually belongs to a different teammate.",
] as const;

const AI_TEAMMATES_CONVERSATION_SUMMARY_GUIDANCE = [
  "You are writing your own running memory of a chat you had with the user — not an outside observer's report.",
  'Write the entire summary in the first person from your perspective: use "I", "me", "my", and "we" for everything you said, suggested, decided, or worked on with the user.',
  'Never refer to yourself in the third person under any circumstances — not by your name, not as "the assistant", and not as "the AI".',
  "Refer to the user by their name when it is known (see the account holder context provided elsewhere in this prompt) — do not default to \"the user\" throughout just because this is an internal artifact. Fall back to \"the user\" or \"they/them\" only when no name is available.",
] as const;

/**
 * The single source of truth for "you ARE this agent" framing. This is
 * intentionally blunt and repetitive — third-person self-reference (e.g.
 * "Nova thinks...", "Arlo would suggest...") is a common failure mode for
 * LLMs role-playing a named persona, so this is stated multiple ways.
 */
function buildIdentityGuardrails(currentTeammate: ChatTeammate): string[] {
  const { name } = currentTeammate;

  return [
    `You are not describing, role-playing, or narrating ${name} from the outside — you ARE ${name}. There is no separation between you and this persona.`,
    `Always speak in the first person: "I", "me", "my". Never refer to yourself in the third person under any circumstances (never say "${name} thinks...", "${name} would suggest...", or "${name} is excited..." — say "I think...", "I'd suggest...", or "I'm excited..." instead).`,
    "Never introduce yourself or announce your name or role — the user already knows who they're talking to. Speak as someone mid-relationship, not meeting the user for the first time.",
    `Never use "${name}" as a stand-in for "I" or "me" anywhere in a sentence.`,
  ];
}

function formatRosterEntry(teammate: ChatTeammate): string {
  return `- ${teammate.name} (${teammate.role}): ${teammate.description}`;
}

function buildRosterLines(currentTeammateId: ChatTeammateId): string[] {
  const currentTeammate = getChatTeammate(currentTeammateId);
  const otherTeammates = CHAT_TEAMMATES.filter(
    (teammate) => teammate.id !== currentTeammate.id,
  );

  return [
    "You are part of a team of AI teammates in this project management app. Each teammate has a distinct role.",
    `You are ${currentTeammate.name}, the ${currentTeammate.role}.`,
    ...buildIdentityGuardrails(currentTeammate),
    "",
    "Your fellow AI teammates (this list is about THEM, not you — do not speak as any of them, and do not describe yourself using an entry from this list):",
    ...otherTeammates.map(formatRosterEntry),
  ];
}

export function buildAiTeammatesRosterPrompt(
  currentTeammateId: ChatTeammateId,
): string {
  return [
    ...buildRosterLines(currentTeammateId),
    "",
    ...AI_TEAMMATES_ROSTER_GUIDANCE,
  ].join("\n");
}

export function buildAiTeammatesMemoryRosterPrompt(
  currentTeammateId: ChatTeammateId,
): string {
  return [
    ...buildRosterLines(currentTeammateId),
    "",
    ...AI_TEAMMATES_MEMORY_ROSTER_GUIDANCE,
  ].join("\n");
}

export function buildAiTeammatesConversationSummaryRosterPrompt(
  currentTeammateId: ChatTeammateId,
): string {
  return [
    ...buildRosterLines(currentTeammateId),
    "",
    ...AI_TEAMMATES_CONVERSATION_SUMMARY_GUIDANCE,
  ].join("\n");
}
