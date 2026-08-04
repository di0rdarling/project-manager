import type { Db, ObjectId } from "mongodb";
import { toIsoString } from "@/lib/dates";
import {
  serializeProject,
  type StoredProject,
} from "@/lib/serialize/serialize-project";
import type { ProjectResponse } from "@/lib/types";
import type { StoredChat } from "@/lib/serialize/serialize-chat";

type ChatActivityAggregateRow = {
  _id: ObjectId;
  lastActivityAt: string | Date;
};

export async function getLatestChatActivityByProjectId(
  db: Db,
  userId: ObjectId,
  projectIds?: ObjectId[],
): Promise<Map<string, string>> {
  const match: Record<string, unknown> = {
    userId,
    projectId: { $ne: null },
  };

  if (projectIds?.length) {
    match.projectId = { $in: projectIds };
  }

  const results = await db
    .collection<StoredChat>("chats")
    .aggregate<ChatActivityAggregateRow>([
      { $match: match },
      {
        $project: {
          projectId: 1,
          lastActivityAt: {
            $cond: {
              if: { $gt: ["$updatedAt", "$createdAt"] },
              then: "$updatedAt",
              else: "$createdAt",
            },
          },
        },
      },
      {
        $group: {
          _id: "$projectId",
          lastActivityAt: { $max: "$lastActivityAt" },
        },
      },
    ])
    .toArray();

  const activityByProjectId = new Map<string, string>();

  for (const row of results) {
    if (!row._id) {
      continue;
    }

    activityByProjectId.set(row._id.toString(), toIsoString(row.lastActivityAt));
  }

  return activityByProjectId;
}

export async function serializeProjectWithActivity(
  db: Db,
  userId: ObjectId,
  project: StoredProject,
): Promise<ProjectResponse> {
  const chatActivityByProjectId = await getLatestChatActivityByProjectId(
    db,
    userId,
    [project._id],
  );

  return serializeProject(project, {
    lastChatActivityAt: chatActivityByProjectId.get(project._id.toString()),
  });
}
