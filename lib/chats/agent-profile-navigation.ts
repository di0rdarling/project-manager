import {
  getProjectAgentsPath,
  getProjectChatsPath,
} from "@/lib/project-detail-sections";

export const AGENT_PROFILE_FROM_SEARCH_PARAM = "from";
export const AGENT_PROFILE_PROJECT_ID_PARAM = "projectId";
export const AGENT_PROFILE_TASK_TITLE_PARAM = "taskTitle";

export const AGENT_TASKS_SECTION_ID = "agent-tasks";

export type AgentProfileFrom = "agents" | "chats";

export type AgentProfileNavigationContext = {
  from?: AgentProfileFrom | null;
  projectId?: string | null;
};

function isAgentProfileFrom(value: string): value is AgentProfileFrom {
  return value === "agents" || value === "chats";
}

export function parseAgentProfileFrom(
  value: string | null | undefined,
): AgentProfileFrom | null {
  if (!value || !isAgentProfileFrom(value)) {
    return null;
  }

  return value;
}

export function parseAgentProfileProjectId(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function parseAgentProfileNavigationContext(
  searchParams: Pick<URLSearchParams, "get">,
): AgentProfileNavigationContext {
  return {
    from: parseAgentProfileFrom(
      searchParams.get(AGENT_PROFILE_FROM_SEARCH_PARAM),
    ),
    projectId: parseAgentProfileProjectId(
      searchParams.get(AGENT_PROFILE_PROJECT_ID_PARAM),
    ),
  };
}

function appendNavigationContext(
  path: string,
  context?: AgentProfileNavigationContext | null,
): string {
  if (!context?.from && !context?.projectId) {
    return path;
  }

  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);

  if (context.from) {
    params.set(AGENT_PROFILE_FROM_SEARCH_PARAM, context.from);
  }

  if (context.projectId) {
    params.set(AGENT_PROFILE_PROJECT_ID_PARAM, context.projectId);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getTeammateProfileHref(
  teammateId: string,
  from?: AgentProfileFrom | null,
  projectId?: string | null,
): string {
  return appendNavigationContext(`/chats/agents/${teammateId}`, {
    from,
    projectId,
  });
}

export function appendAgentProfileFrom(
  path: string,
  from: AgentProfileFrom | null,
  projectId?: string | null,
): string {
  return appendNavigationContext(path, { from, projectId });
}

export function appendAgentProfileTaskTitle(
  path: string,
  taskTitle: string,
  projectId?: string | null,
): string {
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);

  if (projectId) {
    params.set(AGENT_PROFILE_PROJECT_ID_PARAM, projectId);
  }

  params.set(AGENT_PROFILE_TASK_TITLE_PARAM, taskTitle);

  const query = params.toString();
  return `${pathname}?${query}#${AGENT_TASKS_SECTION_ID}`;
}

export function getAgentProfileBackNavigation(
  context: AgentProfileNavigationContext,
): { href: string; label: string } {
  if (context.projectId) {
    if (context.from === "agents") {
      return {
        href: getProjectAgentsPath(context.projectId),
        label: "Back to Agents",
      };
    }

    return {
      href: getProjectChatsPath(context.projectId),
      label: "Back to AI Chats",
    };
  }

  return { href: "/home", label: "Back to projects" };
}

export function getChatDetailHref(
  chatId: string,
  projectId: string,
): string {
  return appendNavigationContext(`/chats/${chatId}`, { projectId });
}

export function getChatBackNavigation(projectId: string | null | undefined): {
  href: string;
  label: string;
} {
  if (projectId) {
    return {
      href: getProjectChatsPath(projectId),
      label: "Back to chats",
    };
  }

  return { href: "/home", label: "Back to projects" };
}
