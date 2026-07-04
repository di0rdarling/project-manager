export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export const noteKeys = {
  all: (projectId: string) => ["projects", projectId, "notes"] as const,
};

export const requirementKeys = {
  all: (projectId: string) =>
    ["projects", projectId, "requirements"] as const,
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

export const domainKnowledgeKeys = {
  all: (projectId: string) =>
    ["projects", projectId, "domain-knowledge"] as const,
};

export const chatKeys = {
  all: ["chats"] as const,
  detail: (id: string) => ["chats", id] as const,
};
