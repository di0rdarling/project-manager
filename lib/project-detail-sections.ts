import type { ComponentType, SVGProps } from "react";
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PuzzlePieceIcon,
  ShieldExclamationIcon,
  SparklesIcon,
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

const PROJECT_PATH_PATTERN = /^\/projects\/([^/]+)(?:\/(.+))?$/;

export function getProjectPathInfo(pathname: string) {
  const match = pathname.match(PROJECT_PATH_PATTERN);
  if (!match) {
    return null;
  }

  const projectId = match[1];
  const rest = match[2] ?? "";
  const isNotesRoute = rest === "notes" || rest.startsWith("notes/");
  const isFeatureRoute = rest.startsWith("features/");
  const showProjectSidebar = rest === "" || isNotesRoute;

  if (!showProjectSidebar) {
    return null;
  }

  return {
    projectId,
    isDetailPage: rest === "",
    isNotesRoute,
    isFeatureRoute,
  };
}
