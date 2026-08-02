import { buildAiDateTimeContext } from "@/lib/prompts/ai-datetime-context";
import { PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";

type DashboardDigestProject = {
  name: string;
  description: string;
  aiSummary: string | null;
};

type DashboardDigestChat = {
  title: string;
  projectName: string | null;
  updatedAt: string;
};

type DashboardDigestNote = {
  title: string;
  projectName: string | null;
  updatedAt: string;
};

export type BuildDashboardDigestPromptInput = {
  projects: DashboardDigestProject[];
  openChats: DashboardDigestChat[];
  recentNotes: DashboardDigestNote[];
  generatedAt?: Date;
};

function formatProjects(projects: DashboardDigestProject[]): string {
  if (projects.length === 0) {
    return "Projects: None";
  }

  return `Projects:\n${projects
    .map((project, index) => {
      const summary = project.aiSummary?.trim();
      return `${index + 1}. ${project.name}\n   Description: ${project.description.trim() || "No description provided."}${summary ? `\n   AI summary: ${summary}` : ""}`;
    })
    .join("\n")}`;
}

function formatChats(chats: DashboardDigestChat[]): string {
  if (chats.length === 0) {
    return "Open chats: None";
  }

  return `Open chats:\n${chats
    .map(
      (chat, index) =>
        `${index + 1}. ${chat.title}${chat.projectName ? ` (${chat.projectName})` : ""} — last updated ${chat.updatedAt}`,
    )
    .join("\n")}`;
}

function formatNotes(notes: DashboardDigestNote[]): string {
  if (notes.length === 0) {
    return "Notes added or updated this week: None";
  }

  return `Notes added or updated this week:\n${notes
    .map(
      (note, index) =>
        `${index + 1}. ${note.title}${note.projectName ? ` (${note.projectName})` : ""} — ${note.updatedAt}`,
    )
    .join("\n")}`;
}

export function buildDashboardDigestPrompt({
  projects,
  openChats,
  recentNotes,
  generatedAt,
}: BuildDashboardDigestPromptInput): string {
  const sections = [
    "You are a project management assistant reviewing a user's workspace.",
    buildAiDateTimeContext(generatedAt),
    "Write a concise cross-project digest and one concrete suggested next action based only on the provided context.",
    "The digest should be 2-3 sentences that highlight what is most active or needs attention across the user's projects.",
    "The suggested action should be a single, specific, actionable next step the user could take in the app.",
    "If there is nothing that genuinely needs attention, say so plainly rather than inventing urgency.",
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    "Return only a JSON object with no markdown, code fences, or extra commentary.",
    'The JSON object must have exactly two fields: "digest" (string) and "suggestedAction" (string).',
    "",
    formatProjects(projects),
    "",
    formatChats(openChats),
    "",
    formatNotes(recentNotes),
  ];

  return sections.join("\n");
}
