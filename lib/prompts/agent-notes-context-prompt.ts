import type { AgentNoteContextItem } from "@/lib/agent-notes-store";

function formatAgentNote(note: AgentNoteContextItem, index: number): string {
  const title = note.title.trim() || `Note ${index + 1}`;
  const content = note.content.trim() || "No content provided.";

  return `${index + 1}. ${title}\n${content}`;
}

export function buildAgentNotesContext(
  notes: AgentNoteContextItem[],
): string | null {
  if (notes.length === 0) {
    return null;
  }

  return [
    "The user has left these notes specifically for you on your profile page. Treat them as persistent instructions and context they want you to remember and apply across all of your conversations with them.",
    "These notes are private to you — your fellow teammates do not have access to them. Do not reference them as shared team knowledge or suggest another teammate already knows what's in them.",
    "Follow any preferences, constraints, or standing context in these notes unless the user clearly overrides them in the current conversation.",
    notes.map(formatAgentNote).join("\n\n"),
  ].join("\n");
}
