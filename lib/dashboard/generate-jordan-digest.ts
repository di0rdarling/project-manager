import type { Db, ObjectId } from "mongodb";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import {
  getOtherTeammatesRecentChatSummaries,
  getTeammateChatSummaries,
} from "@/lib/chats/chat-summaries";
import { generateChatReply, getDashboardModelName } from "@/lib/gemini";
import { getAllProjectsContext } from "@/lib/project-context";
import { buildChatOtherConversationsContext } from "@/lib/prompts/chat-other-conversations-prompt";
import { buildOtherTeammatesContext } from "@/lib/prompts/chat-other-teammates-context-prompt";
import type { DashboardDigestResponse } from "@/lib/types";

function parseDashboardDigestJson(text: string): DashboardDigestResponse {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  const digest =
    typeof parsed.digest === "string" ? parsed.digest.trim() : "";
  const suggestedAction =
    typeof parsed.suggestedAction === "string"
      ? parsed.suggestedAction.trim()
      : "";

  if (!digest || !suggestedAction) {
    throw new Error("Dashboard digest response is missing required fields");
  }

  return { digest, suggestedAction };
}

const DASHBOARD_DIGEST_USER_MESSAGE = `Give me a concise cross-project status update and one concrete next action I should take. Use the project context, my recent conversations, and anything my other AI teammates have been working on with me.

Return your response as a single JSON object with no markdown, code fences, or extra commentary. Use this exact shape:

{"digest": "2-3 sentences summarizing what's most important across my projects", "suggestedAction": "one specific next step I should take"}`;

export async function generateJordanDashboardDigest(
  db: Db,
  userId: ObjectId,
  userName: string | null,
): Promise<DashboardDigestResponse> {
  const teammateId = "jordan";

  const [projectContext, otherChatSummaries, otherTeammatesChatSummaries, agentNotesContext] =
    await Promise.all([
      getAllProjectsContext(db, userId),
      getTeammateChatSummaries(db, userId, teammateId, {
        excludeArchived: true,
        limit: 5,
      }),
      getOtherTeammatesRecentChatSummaries(db, userId, teammateId, 5),
      loadAgentNotesContext(db, userId, teammateId),
    ]);

  const otherConversationsContext =
    buildChatOtherConversationsContext(otherChatSummaries) ?? undefined;
  const otherTeammatesContext =
    buildOtherTeammatesContext(otherTeammatesChatSummaries) ?? undefined;

  const result = await generateChatReply(
    [],
    DASHBOARD_DIGEST_USER_MESSAGE,
    teammateId,
    projectContext ?? undefined,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
    getDashboardModelName(),
    new Date(),
  );

  return parseDashboardDigestJson(result.content);
}
