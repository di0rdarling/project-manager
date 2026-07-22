import type { ComponentType, SVGProps } from "react";
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PuzzlePieceIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

export type ProjectDetailSectionId =
  | "overview"
  | "core-users"
  | "pain-points"
  | "current-challenges"
  | "domain-knowledge"
  | "requirements"
  | "features"
  | "tools";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type ProjectDetailSection = {
  id: ProjectDetailSectionId;
  title: string;
  icon: HeroIcon;
};

export const PROJECT_DETAIL_SECTIONS: readonly ProjectDetailSection[] = [
  { id: "overview", title: "Overview", icon: SparklesIcon },
  { id: "core-users", title: "Core Users", icon: UsersIcon },
  { id: "pain-points", title: "Pain Points", icon: ExclamationTriangleIcon },
  {
    id: "current-challenges",
    title: "Current Challenges",
    icon: ShieldExclamationIcon,
  },
  { id: "domain-knowledge", title: "Domain Knowledge", icon: BookOpenIcon },
  {
    id: "requirements",
    title: "Requirements",
    icon: ClipboardDocumentListIcon,
  },
  { id: "features", title: "Features", icon: PuzzlePieceIcon },
  { id: "tools", title: "Tools", icon: WrenchScrewdriverIcon },
] as const;

export const PROJECT_NOTES_NAV = {
  title: "Notes",
  icon: DocumentTextIcon,
} as const;

export const PROJECT_AGENTS_NAV = {
  title: "Agents",
  icon: UserGroupIcon,
} as const;

export const PROJECT_CHATS_NAV = {
  title: "Chats",
  icon: ChatBubbleLeftRightIcon,
} as const;

export function getProjectAgentsPath(projectId: string) {
  return `/projects/${projectId}/agents`;
}

export function getProjectChatsPath(projectId: string) {
  return `/projects/${projectId}/chats`;
}

const PROJECT_PATH_PATTERN = /^\/projects\/([^/]+)(?:\/(.+))?$/;
const CHAT_DETAIL_PATH_PATTERN = /^\/chats\/([^/]+)$/;
const AGENT_PROFILE_PATH_PATTERN = /^\/chats\/agents\/([^/]+)(?:\/(.+))?$/;

export type ProjectPathInfo = {
  projectId: string;
  isDetailPage: boolean;
  isNotesRoute: boolean;
  isAgentsRoute: boolean;
  isChatsRoute: boolean;
  isFeatureRoute: boolean;
};

export type ProjectSidebarQueryContext = {
  projectId?: string | null;
  from?: "agents" | "chats" | null;
};

function getProjectSidebarInfoFromQuery(
  pathname: string,
  queryContext: ProjectSidebarQueryContext,
): ProjectPathInfo | null {
  const projectId = queryContext.projectId?.trim();
  if (!projectId) {
    return null;
  }

  if (AGENT_PROFILE_PATH_PATTERN.test(pathname)) {
    const isAgentsRoute = queryContext.from === "agents";

    return {
      projectId,
      isDetailPage: false,
      isNotesRoute: false,
      isAgentsRoute,
      isChatsRoute: !isAgentsRoute,
      isFeatureRoute: false,
    };
  }

  const chatMatch = pathname.match(CHAT_DETAIL_PATH_PATTERN);
  if (chatMatch && chatMatch[1] !== "agents") {
    return {
      projectId,
      isDetailPage: false,
      isNotesRoute: false,
      isAgentsRoute: false,
      isChatsRoute: true,
      isFeatureRoute: false,
    };
  }

  return null;
}

export function getProjectPathInfo(pathname: string): ProjectPathInfo | null {
  const match = pathname.match(PROJECT_PATH_PATTERN);
  if (!match) {
    return null;
  }

  const projectId = match[1];
  const rest = match[2] ?? "";
  const isNotesRoute = rest === "notes" || rest.startsWith("notes/");
  const isAgentsRoute = rest === "agents" || rest.startsWith("agents/");
  const isChatsRoute = rest === "chats" || rest.startsWith("chats/");
  const isFeatureRoute = rest.startsWith("features/");
  const showProjectSidebar =
    rest === "" || isNotesRoute || isAgentsRoute || isChatsRoute;

  if (!showProjectSidebar) {
    return null;
  }

  return {
    projectId,
    isDetailPage: rest === "",
    isNotesRoute,
    isAgentsRoute,
    isChatsRoute,
    isFeatureRoute,
  };
}

export function getProjectSidebarInfo(
  pathname: string,
  queryContext?: ProjectSidebarQueryContext | null,
): ProjectPathInfo | null {
  const pathInfo = getProjectPathInfo(pathname);
  if (pathInfo) {
    return pathInfo;
  }

  if (!queryContext) {
    return null;
  }

  return getProjectSidebarInfoFromQuery(pathname, queryContext);
}
