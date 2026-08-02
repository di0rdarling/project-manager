import { getAgentDocumentStatusLabel } from "@/lib/agents/agent-documents";
import {
  getAgentTaskOutputStatus,
  getAgentTaskStatus,
  getAgentTaskStatusLabel,
} from "@/lib/agents/agent-tasks";
import type { TeammateTaskDocumentEntry } from "@/lib/agents/load-teammate-tasks-documents-context";

function getOutputStatusLabel(task: TeammateTaskDocumentEntry["task"]): string {
  return getAgentTaskOutputStatus(task) === "completed"
    ? "Completed"
    : "Not started";
}

export function buildAgentTasksDocumentsContext(
  entries: TeammateTaskDocumentEntry[],
): string | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  const sections = [
    "These are the autonomous tasks you have suggested to the user, your current progress on each, and any deliverables you have produced. Only your tasks and documents are listed here — not those belonging to other AI teammates. Speak in first person about work you have done.",
    "",
  ];

  const entriesByProject = new Map<string, TeammateTaskDocumentEntry[]>();

  for (const entry of entries) {
    const projectEntries = entriesByProject.get(entry.projectId) ?? [];
    projectEntries.push(entry);
    entriesByProject.set(entry.projectId, projectEntries);
  }

  for (const projectEntries of entriesByProject.values()) {
    const projectName =
      projectEntries[0]?.projectName?.trim() || "Unknown project";

    sections.push(`#### Project: ${projectName}`, "");

    for (const { task, document } of projectEntries) {
      const taskStatus = getAgentTaskStatusLabel(getAgentTaskStatus(task));
      const deliverableTitle =
        document?.title || task.outputDocumentTitle || null;
      const deliverableStatus = document
        ? getAgentDocumentStatusLabel(document.status)
        : task.outputDocumentStatus
          ? getAgentDocumentStatusLabel(task.outputDocumentStatus)
          : null;

      sections.push(`**Task: ${task.title}**`);
      sections.push(`- Task status: ${taskStatus}`);
      sections.push(`- Output status: ${getOutputStatusLabel(task)}`);

      if (deliverableTitle) {
        sections.push(
          `- Deliverable: "${deliverableTitle}"${deliverableStatus ? ` (${deliverableStatus})` : ""}`,
        );
      }

      sections.push(`- What you set out to do: ${task.detail}`);

      if (task.rationale) {
        sections.push(`- Why you suggested it: ${task.rationale}`);
      }

      if (task.outputDescription) {
        sections.push(`- What you said you'd produce: ${task.outputDescription}`);
      }

      if (task.outputApproach) {
        sections.push(`- Your approach: ${task.outputApproach}`);
      }

      if (task.outputCompletionSummary) {
        sections.push(
          `- How this completes the task: ${task.outputCompletionSummary}`,
        );
      }

      if (document?.content.trim()) {
        sections.push(
          "",
          `**Deliverable content — "${document.title}":**`,
          "",
          document.content.trim(),
        );
      }

      sections.push("");
    }
  }

  return sections.join("\n").trim();
}
