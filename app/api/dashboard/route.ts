import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { generateDashboardDigest } from "@/lib/gemini";
import { buildDashboardDigestPrompt } from "@/lib/prompts/dashboard-digest-prompt";
import { serializeProject, type StoredProject } from "@/lib/serialize/serialize-project";
import type { StoredChat } from "@/lib/serialize/serialize-chat";
import type { DashboardDigestResponse } from "@/lib/types";

function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function parseDashboardDigestJson(text: string): DashboardDigestResponse {
  const parsed = JSON.parse(text) as Record<string, unknown>;

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

export async function GET() {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const client = await getClientPromise();
    const db = client.db();
    const userId = auth.userId;

    const [totalProjects, openChats, notesThisWeek] = await Promise.all([
      db.collection<StoredProject>("projects").countDocuments({ userId }),
      db
        .collection<StoredChat>("chats")
        .countDocuments({ userId, archivedAt: null }),
      db.collection("notes").countDocuments({
        userId,
        $or: [
          { createdAt: { $gte: getStartOfWeek(new Date()) } },
          { updatedAt: { $gte: getStartOfWeek(new Date()) } },
        ],
      }),
    ]);

    return Response.json({
      totalProjects,
      openChats,
      notesThisWeek,
    });
  } catch {
    return Response.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const client = await getClientPromise();
    const db = client.db();
    const userId = auth.userId;

    const startOfWeek = getStartOfWeek(new Date());
    const generatedAt = new Date();

    const [projects, openChats, recentNotes] = await Promise.all([
      db
        .collection<StoredProject>("projects")
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray(),
      db
        .collection<StoredChat>("chats")
        .find({ userId, archivedAt: null })
        .sort({ updatedAt: -1 })
        .toArray(),
      db
        .collection("notes")
        .find({
          userId,
          $or: [
            { createdAt: { $gte: startOfWeek } },
            { updatedAt: { $gte: startOfWeek } },
          ],
        })
        .sort({ updatedAt: -1 })
        .toArray(),
    ]);

    const projectMap = new Map(
      projects.map((project) => [
        project._id.toString(),
        serializeProject(project),
      ]),
    );

    const prompt = buildDashboardDigestPrompt({
      projects: projects.map((project) => ({
        name: project.name,
        description: project.description,
        aiSummary:
          typeof project.aiSummary === "string" && project.aiSummary.trim()
            ? project.aiSummary
            : null,
      })),
      openChats: openChats.map((chat) => ({
        title: chat.title || "Untitled chat",
        projectName:
          chat.projectId != null
            ? projectMap.get(chat.projectId.toString())?.name ?? null
            : null,
        updatedAt: new Date(chat.updatedAt).toISOString(),
      })),
      recentNotes: recentNotes.map((note) => ({
        title: typeof note.title === "string" ? note.title : "Untitled note",
        projectName:
          note.projectId != null
            ? projectMap.get(note.projectId.toString())?.name ?? null
            : null,
        updatedAt: new Date(
          note.updatedAt ?? note.createdAt,
        ).toISOString(),
      })),
      generatedAt,
    });

    const rawDigest = await generateDashboardDigest(prompt);
    const digest = parseDashboardDigestJson(rawDigest);

    return Response.json(digest);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI digest generation is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to generate dashboard digest" },
      { status: 500 },
    );
  }
}
