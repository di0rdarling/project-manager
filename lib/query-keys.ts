export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export const noteKeys = {
  list: (projectId: string, featureId?: string | null) =>
    featureId
      ? (["projects", projectId, "features", featureId, "notes"] as const)
      : (["projects", projectId, "notes"] as const),
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
  detail: (id: string) => ["chats", id] as const,
};
