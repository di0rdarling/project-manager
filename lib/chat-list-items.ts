import { ObjectId, type Db } from "mongodb";
import { serializeChat, type StoredChat } from "@/lib/serialize-chat";
import type { ChatListItemResponse } from "@/lib/types";

type ContextEntity = {
  _id: ObjectId;
  title?: string;
  name?: string;
};

function getRequirementTitle(requirement: ContextEntity): string {
  return requirement.title?.trim() || "Untitled requirement";
}

function getFeatureTitle(feature: ContextEntity): string {
  return feature.title?.trim() || "Untitled feature";
}

export async function serializeChatsWithContext(
  db: Db,
  chats: StoredChat[],
): Promise<ChatListItemResponse[]> {
  const serializedChats = chats.map(serializeChat);

  const projectIds = [
    ...new Set(
      serializedChats
        .map((chat) => chat.projectId)
        .filter((projectId): projectId is string => Boolean(projectId)),
    ),
  ].map((projectId) => new ObjectId(projectId));

  const requirementIds = [
    ...new Set(
      serializedChats
        .map((chat) => chat.requirementId)
        .filter((requirementId): requirementId is string =>
          Boolean(requirementId),
        ),
    ),
  ].map((requirementId) => new ObjectId(requirementId));

  const featureIds = [
    ...new Set(
      serializedChats
        .map((chat) => chat.featureId)
        .filter((featureId): featureId is string => Boolean(featureId)),
    ),
  ].map((featureId) => new ObjectId(featureId));

  const [projects, requirements, features] = await Promise.all([
    projectIds.length > 0
      ? db
          .collection<ContextEntity>("projects")
          .find({ _id: { $in: projectIds } })
          .toArray()
      : Promise.resolve([]),
    requirementIds.length > 0
      ? db
          .collection<ContextEntity>("requirements")
          .find({ _id: { $in: requirementIds } })
          .toArray()
      : Promise.resolve([]),
    featureIds.length > 0
      ? db
          .collection<ContextEntity>("features")
          .find({ _id: { $in: featureIds } })
          .toArray()
      : Promise.resolve([]),
  ]);

  const projectById = new Map(
    projects.map((project) => [project._id.toString(), project]),
  );
  const requirementById = new Map(
    requirements.map((requirement) => [
      requirement._id.toString(),
      requirement,
    ]),
  );
  const featureById = new Map(
    features.map((feature) => [feature._id.toString(), feature]),
  );

  return serializedChats.map((chat) => {
    const project = chat.projectId
      ? projectById.get(chat.projectId)
      : undefined;
    const requirement = chat.requirementId
      ? requirementById.get(chat.requirementId)
      : undefined;
    const feature = chat.featureId
      ? featureById.get(chat.featureId)
      : undefined;

    return {
      ...chat,
      project: project
        ? { _id: project._id.toString(), name: project.name ?? "Untitled project" }
        : null,
      requirement: requirement
        ? {
            _id: requirement._id.toString(),
            title: getRequirementTitle(requirement),
          }
        : null,
      feature: feature
        ? { _id: feature._id.toString(), title: getFeatureTitle(feature) }
        : null,
    };
  });
}
