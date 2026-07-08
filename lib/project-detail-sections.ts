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
  | "tools"
  | "notes";

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
  { id: "notes", title: "Notes", icon: DocumentTextIcon },
] as const;

const PROJECT_DETAIL_PATH_PATTERN = /^\/projects\/([^/]+)$/;

export function getProjectDetailPathInfo(pathname: string) {
  const match = pathname.match(PROJECT_DETAIL_PATH_PATTERN);
  if (!match) {
    return null;
  }

  return { projectId: match[1] };
}
