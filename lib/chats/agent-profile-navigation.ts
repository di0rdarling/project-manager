export const AGENT_PROFILE_FROM_SEARCH_PARAM = "from";

export type AgentProfileFrom = "agents" | "chats";

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

export function getTeammateProfileHref(
  teammateId: string,
  from?: AgentProfileFrom | null,
): string {
  const basePath = `/chats/agents/${teammateId}`;

  if (!from) {
    return basePath;
  }

  const params = new URLSearchParams({
    [AGENT_PROFILE_FROM_SEARCH_PARAM]: from,
  });

  return `${basePath}?${params.toString()}`;
}

export function appendAgentProfileFrom(
  path: string,
  from: AgentProfileFrom | null,
): string {
  if (!from) {
    return path;
  }

  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set(AGENT_PROFILE_FROM_SEARCH_PARAM, from);
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function getAgentProfileBackNavigation(from: AgentProfileFrom | null): {
  href: string;
  label: string;
} {
  if (from === "agents") {
    return { href: "/agents", label: "Back to Agents" };
  }

  return { href: "/chats", label: "Back to AI Chats" };
}
