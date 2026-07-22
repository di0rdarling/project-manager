export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export const noteKeys = {
  list: (projectId: string, featureId?: string | null) =>
    featureId
      ? (["projects", projectId, "features", featureId, "notes"] as const)
      : (["projects", projectId, "notes"] as const),
  detail: (projectId: string, noteId: string) =>
    ["projects", projectId, "notes", noteId] as const,
};

export const noteFolderKeys = {
  list: (projectId: string, featureId?: string | null) =>
    featureId
      ? (["projects", projectId, "features", featureId, "note-folders"] as const)
      : (["projects", projectId, "note-folders"] as const),
};

export const requirementKeys = {
  all: (projectId: string) =>
    ["projects", projectId, "requirements"] as const,
};

export const featureKeys = {
  all: (projectId: string) => ["projects", projectId, "features"] as const,
  detail: (projectId: string, featureId: string) =>
    ["projects", projectId, "features", featureId] as const,
};

export const toolKeys = {
  all: (projectId: string) => ["projects", projectId, "tools"] as const,
};

export const coreUserKeys = {
  all: (projectId: string) => ["projects", projectId, "core-users"] as const,
};

export const painPointKeys = {
  all: (projectId: string) =>
    ["projects", projectId, "pain-points"] as const,
};

export const challengeKeys = {
  list: (projectId: string, featureId?: string | null) =>
    featureId
      ? (["projects", projectId, "features", featureId, "challenges"] as const)
      : (["projects", projectId, "challenges"] as const),
};

export const domainKnowledgeKeys = {
  list: (projectId: string, featureId?: string | null) =>
    featureId
      ? (["projects", projectId, "features", featureId, "domain-knowledge"] as const)
      : (["projects", projectId, "domain-knowledge"] as const),
};

export const chatKeys = {
  all: ["chats"] as const,
  list: (status: "active" | "archived" | "all" = "active") =>
    ["chats", status] as const,
  detail: (id: string) => ["chats", id] as const,
};

export const agentMemoryKeys = {
  detail: (teammateId: string) => ["agent-memory", teammateId] as const,
};

export const userMemoryKeys = {
  detail: (teammateId: string) => ["user-memory", teammateId] as const,
};

export const agentTasksKeys = {
  detail: (teammateId: string, projectId: string) =>
    ["agent-tasks", teammateId, projectId] as const,
};

export const agentNoteKeys = {
  list: (teammateId: string) => ["agent-notes", teammateId] as const,
  detail: (teammateId: string, noteId: string) =>
    ["agent-notes", teammateId, noteId] as const,
};

export const agentDocumentKeys = {
  list: (teammateId: string) => ["agent-documents", teammateId] as const,
  detail: (teammateId: string, documentId: string) =>
    ["agent-documents", teammateId, documentId] as const,
};

export const currentUserKeys = {
  detail: ["current-user"] as const,
};
