import type { ComponentType, SVGProps } from "react";
import {
  BookOpenIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export type FeatureDetailSectionId =
  | "overview"
  | "description"
  | "current-challenges"
  | "domain-knowledge"
  | "notes";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type FeatureDetailSection = {
  id: FeatureDetailSectionId;
  title: string;
  icon: HeroIcon;
};

export const FEATURE_DETAIL_SECTIONS: readonly FeatureDetailSection[] = [
  { id: "overview", title: "Overview", icon: SparklesIcon },
  { id: "description", title: "Description", icon: DocumentTextIcon },
  {
    id: "current-challenges",
    title: "Current Challenges",
    icon: ShieldExclamationIcon,
  },
  { id: "domain-knowledge", title: "Domain Knowledge", icon: BookOpenIcon },
  { id: "notes", title: "Notes", icon: DocumentTextIcon },
] as const;

const FEATURE_PATH_PATTERN =
  /^\/projects\/([^/]+)\/features\/([^/]+)(?:\/(.+))?$/;

export function getFeaturePathInfo(pathname: string) {
  const match = pathname.match(FEATURE_PATH_PATTERN);
  if (!match) {
    return null;
  }

  const projectId = match[1];
  const featureId = match[2];
  const rest = match[3] ?? "";

  if (rest !== "") {
    return null;
  }

  return {
    projectId,
    featureId,
    isDetailPage: true,
  };
}
