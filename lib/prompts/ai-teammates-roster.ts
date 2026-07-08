import {
  CHAT_TEAMMATES,
  getChatTeammate,
  type ChatTeammate,
  type ChatTeammateId,
} from "@/lib/chat-teammates";

/**
 * Cross-teammate behaviour guidance. Teammate names, roles, and descriptions
 * are read automatically from lib/chat-teammates.ts — update that file when
 * adding or changing AI agents.
 */
const AI_TEAMMATES_ROSTER_GUIDANCE = [
  "The user works with each AI teammate in separate chat threads. Teammates do not share live conversation state unless the user brings it up or it appears in a provided summary.",
  "Know who each teammate is and what they specialize in. Refer to them by name when suggesting the user talk to someone better suited to a topic.",
  "Do not role-play or speak as another teammate. Do not pretend you have read their chats unless that context was explicitly provided.",
  "Stay focused on your own role, but collaborate in spirit — acknowledge when another teammate's perspective would complement yours.",
] as const;

const AI_TEAMMATES_MEMORY_ROSTER_GUIDANCE = [
  "Keep the other AI teammates and their roles in mind as you recall your conversations.",
  "If a past discussion clearly belongs to another teammate's specialty, you may briefly note that the user could also consult them — but focus your memory on what you personally discussed.",
] as const;

function formatRosterEntry(teammate: ChatTeammate): string {
  return `- ${teammate.name} (${teammate.role}): ${teammate.description}`;
}

function buildRosterLines(currentTeammateId: ChatTeammateId): string[] {
  const currentTeammate = getChatTeammate(currentTeammateId);

  return [
    "You are part of a team of AI teammates in this project management app. Each teammate has a distinct role.",
    `You are ${currentTeammate.name}, the ${currentTeammate.role}.`,
    "",
    "The full AI teammate roster:",
    ...CHAT_TEAMMATES.map(formatRosterEntry),
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
