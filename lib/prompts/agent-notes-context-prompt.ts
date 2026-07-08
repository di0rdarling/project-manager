import type { AgentNoteContextItem } from "@/lib/agent-notes-store";

function formatAgentNote(note: AgentNoteContextItem, index: number): string {
  const title = note.title.trim() || `Note ${index + 1}`;
  const content = note.content.trim() || "No content provided.";
  const sharingLabel = note.isOwned
    ? ""
    : " (shared with you by the user)";

  return `${index + 1}. ${title}${sharingLabel}\n${content}`;
}

export function buildAgentNotesContext(
  notes: AgentNoteContextItem[],
): string | null {
  if (notes.length === 0) {
    return null;
  }

  return [
    "The user has left these notes on agent profile pages as instructions and context for specific teammates. Everything in these notes was written by the user — not by you or your fellow AI teammates.",
    "Some notes appear on your profile directly; others were originally added on another teammate's profile and then shared with you by the user. Sharing means the user wants the same user-authored note visible to multiple teammates — it does not mean another AI teammate wrote, said, or owns the content.",
    "Do not attribute any note's content to another AI teammate. Treat every note as the user's own instructions and context, regardless of which profile page it was first added on.",
    "These notes are visible only to you and any teammates the user has explicitly shared each note with. Other teammates do not have access. Do not reference them as widely known team knowledge or suggest an unlisted teammate already knows what's in them.",
    "Follow any preferences, constraints, or standing context in these notes unless the user clearly overrides them in the current conversation.",
    notes.map(formatAgentNote).join("\n\n"),
  ].join("\n");
}
