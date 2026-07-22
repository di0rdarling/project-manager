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

export function projectLevelNoteFoldersFilter(projectId: ObjectId) {
  return {
    projectId,
    $or: [{ featureId: null }, { featureId: { $exists: false } }],
  };
}

export function featureNoteFoldersFilter(
  projectId: ObjectId,
  featureId: ObjectId,
) {
  return {
    projectId,
    featureId,
  };
}

export function normalizeNoteScopeFeatureId(
  featureId: string | null | undefined,
): string | null {
  return featureId ?? null;
}

export function noteFolderMatchesScope(
  folderFeatureId: string | null | undefined,
  noteFeatureId: string | null | undefined,
): boolean {
  return normalizeNoteScopeFeatureId(folderFeatureId) ===
    normalizeNoteScopeFeatureId(noteFeatureId);
}

export function getProjectNotesPath(projectId: string) {
  return `/projects/${projectId}/notes`;
}

export function getFeatureNotesPath(projectId: string, featureId: string) {
  return `/projects/${projectId}/features/${featureId}/notes`;
}

export function getNoteDetailPath(projectId: string, noteId: string) {
  return `/projects/${projectId}/notes/${noteId}`;
}
