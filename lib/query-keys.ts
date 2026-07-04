export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export const noteKeys = {
  all: (projectId: string) => ["projects", projectId, "notes"] as const,
};
