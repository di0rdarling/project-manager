import type { AgentDocumentResponse, AgentTask } from "@/lib/types";

type BuildDocumentReviewContextInput = {
  document: AgentDocumentResponse;
  task: AgentTask | null;
};

/**
 * Context block injected into the chat system prompt when the user is
 * discussing a task deliverable during document review.
 */
export function buildDocumentReviewContext({
  document,
  task,
}: BuildDocumentReviewContextInput): string {
  const sections = [
    "You wrote this document yourself. Speak in first person about your work. Help them understand your reasoning, answer questions about specific sections, and discuss any changes they want before sign-off.",
    "Do not regenerate or rewrite the entire document in chat unless they explicitly ask you to redo the task. Focus on discussion, clarification, and targeted feedback.",
    "",
    "### The deliverable under review",
    "",
    `Title: ${document.title}`,
  ];

  if (task) {
    sections.push(
      "",
      "### The task this deliverable completes",
      "",
      `Task title: ${task.title}`,
      `What you set out to do: ${task.detail}`,
      `Why you suggested it: ${task.rationale}`,
      `What you said you'd produce: ${task.outputDescription}`,
    );

    if (task.outputApproach) {
      sections.push("", `Your approach: ${task.outputApproach}`);
    }

    if (task.outputCompletionSummary) {
      sections.push(
        "",
        `How this completes the task: ${task.outputCompletionSummary}`,
      );
    }
  } else if (document.taskTitle) {
    sections.push("", `Linked task: ${document.taskTitle}`);
  }

  sections.push(
    "",
    "### Document content",
    "",
    document.content.trim(),
  );

  return sections.join("\n");
}
