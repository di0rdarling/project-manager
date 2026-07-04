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
