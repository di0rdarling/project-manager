import type { ObjectId } from "mongodb";

export function projectLevelNotesFilter(projectId: ObjectId) {
  return {
    projectId,
    $or: [{ featureId: null }, { featureId: { $exists: false } }],
  };
}

export function featureNotesFilter(projectId: ObjectId, featureId: ObjectId) {
  return {
    projectId,
    featureId,
  };
}
