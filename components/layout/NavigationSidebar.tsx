"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthQueryCache } from "@/lib/auth/auth-query-cache";
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  HomeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ProjectManagerLogo } from "@/components/ui/ProjectManagerLogo";
import { SubscriptionChip } from "@/components/ui/SubscriptionChip";
import { useProjectSectionNav } from "@/components/views/ProjectDetail/ProjectSectionNavContext";
import { useFetchCurrentUser } from "@/hooks/queries/useFetchCurrentUser";
import { useFetchFeature } from "@/hooks/queries/useFetchFeature";
import { useFetchProject } from "@/hooks/queries/useFetchProject";
import {
  FEATURE_DETAIL_SECTIONS,
  FEATURE_NOTES_NAV,
  getFeaturePathInfo,
} from "@/lib/feature-detail-sections";
import { parseAgentProfileNavigationContext } from "@/lib/chats/agent-profile-navigation";
import {
  getFeatureNotesPath,
  getProjectNotesPath,
} from "@/lib/notes";
import {
  getProjectAgentsPath,
  getProjectChatsPath,
  getProjectSidebarInfo,
  PROJECT_AGENTS_NAV,
  PROJECT_CHATS_NAV,
  PROJECT_DETAIL_SECTIONS,
  PROJECT_NOTES_NAV,
} from "@/lib/project-detail-sections";

const navItems = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/settings", label: "Settings", icon: Cog6ToothIcon },
  { href: "/account", label: "Account", icon: UserCircleIcon },
] as const;

type NavigationSidebarProps = {
  id?: string;
  isOpen?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
};

export default function NavigationSidebar({
  id,
  isOpen = true,
  isCollapsed = false,
  onToggleCollapse,
  onNavigate,
}: NavigationSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useFetchCurrentUser();
  const projectSectionNav = useProjectSectionNav();
  const navigationContext = parseAgentProfileNavigationContext(searchParams);
  const projectPathInfo = getProjectSidebarInfo(pathname, navigationContext);
  const featurePathInfo = getFeaturePathInfo(pathname);
  const showProjectSidebar = projectPathInfo !== null;
  const showFeatureSidebar = featurePathInfo !== null;
  const showContextSidebar = showProjectSidebar || showFeatureSidebar;
  const isProjectDetailPage = projectPathInfo?.isDetailPage ?? false;
  const isFeatureDetailPage = featurePathInfo?.isDetailPage ?? false;
  const isFeatureNotesRoute = featurePathInfo?.isNotesRoute ?? false;
  const isSectionNavPage = isProjectDetailPage || isFeatureDetailPage;
  const { data: project } = useFetchProject(
    projectPathInfo?.projectId ?? featurePathInfo?.projectId ?? "",
    {
      enabled: showContextSidebar,
    },
  );
  const { data: feature } = useFetchFeature(
    featurePathInfo?.projectId ?? "",
    featurePathInfo?.featureId ?? "",
    {
      enabled: showFeatureSidebar,
    },
  );

  useEffect(() => {
    if (!showContextSidebar) {
      projectSectionNav?.resetActiveSection();
    }
  }, [showContextSidebar, projectSectionNav]);

  useEffect(() => {
    if (!isSectionNavPage) {
      projectSectionNav?.resetActiveSection();
    }
  }, [isSectionNavPage, projectSectionNav]);

  useEffect(() => {
    projectSectionNav?.resetActiveSection();
  }, [
    projectPathInfo?.projectId,
    featurePathInfo?.featureId,
    projectSectionNav,
  ]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearAuthQueryCache(queryClient);
    router.replace("/login");
    router.refresh();
  }

  const projectId =
    projectPathInfo?.projectId ?? featurePathInfo?.projectId ?? "";
  const notesHref = getProjectNotesPath(projectId);
  const agentsHref = getProjectAgentsPath(projectId);
  const chatsHref = getProjectChatsPath(projectId);
  const projectHref = `/projects/${projectId}`;
  const featureHref = featurePathInfo
    ? `/projects/${projectId}/features/${featurePathInfo.featureId}`
    : projectHref;
  const featureNotesHref = featurePathInfo
    ? getFeatureNotesPath(projectId, featurePathInfo.featureId)
    : notesHref;
  const NotesIcon = PROJECT_NOTES_NAV.icon;
  const AgentsIcon = PROJECT_AGENTS_NAV.icon;
  const ChatsIcon = PROJECT_CHATS_NAV.icon;
  const FeatureNotesIcon = FEATURE_NOTES_NAV.icon;

  const navLinkClassName = (isActive: boolean) =>
    `cursor-pointer flex items-center rounded-lg text-sm font-medium transition ${
      isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"
    } ${
      isActive
        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
    }`;

  const navPaddingClassName = isCollapsed ? "p-2" : "p-3";

  return (
    <aside
      id={id}
      aria-hidden={!isOpen}
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-200 bg-white transition-[width,transform] duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 md:relative md:z-auto md:shrink-0 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } ${isCollapsed ? "w-16 md:w-16" : "w-56 md:w-56"}`}
    >
      <div
        className={`border-b border-zinc-200 dark:border-zinc-800 ${
          isCollapsed ? "px-2 py-3" : "px-4 py-5"
        }`}
      >
        <div
          className={`flex items-center ${
            isCollapsed ? "flex-col gap-2" : "justify-between gap-2"
          }`}
        >
          <ProjectManagerLogo
            variant={isCollapsed ? "icon" : "full"}
            className={isCollapsed ? "size-9" : "h-9 w-auto"}
          />
          {onToggleCollapse ? (
            <IconButton
              type="button"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isCollapsed}
              onClick={onToggleCollapse}
              className="hidden shrink-0 md:inline-flex"
            >
              {isCollapsed ? (
                <ChevronRightIcon className="size-5" aria-hidden />
              ) : (
                <ChevronLeftIcon className="size-5" aria-hidden />
              )}
            </IconButton>
          ) : null}
        </div>
        {!isCollapsed && showContextSidebar && project?.name ? (
          <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {project.name}
          </p>
        ) : null}
        {!isCollapsed && showFeatureSidebar && feature?.title ? (
          <p className="mt-0.5 truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {feature.title}
          </p>
        ) : null}
      </div>


      <div className="relative min-h-0 flex-1 overflow-hidden">
        <nav
          aria-hidden={showContextSidebar}
          className={`absolute inset-0 flex flex-col gap-1 overflow-y-auto transition-all duration-200 ease-out ${navPaddingClassName} ${
            showContextSidebar
              ? "pointer-events-none -translate-x-3 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/home"
                ? pathname === "/home"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : undefined}
                onClick={onNavigate}
                className={navLinkClassName(isActive)}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {isCollapsed ? (
                  <span className="sr-only">{label}</span>
                ) : (
                  label
                )}
              </Link>
            );
          })}
        </nav>

        

        <nav
          aria-hidden={!showProjectSidebar}
          className={`absolute inset-0 flex flex-col gap-1 overflow-y-auto transition-all duration-200 ease-out ${navPaddingClassName} ${
            showProjectSidebar
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-3 opacity-0"
          }`}
        >
          <Link
            href="/home"
            title={isCollapsed ? "All projects" : undefined}
            onClick={onNavigate}
            className={`cursor-pointer mb-1 flex items-center rounded-lg text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 ${
              isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"
            }`}
          >
            <ArrowLeftIcon className="size-5 shrink-0" aria-hidden />
            {isCollapsed ? (
              <span className="sr-only">All projects</span>
            ) : (
              "All projects"
            )}
          </Link>

          {!isCollapsed ? (
            <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
          ) : null}

          <Link
            href={agentsHref}
            title={isCollapsed ? PROJECT_AGENTS_NAV.title : undefined}
            onClick={onNavigate}
            className={navLinkClassName(projectPathInfo?.isAgentsRoute ?? false)}
          >
            <AgentsIcon className="size-5 shrink-0" aria-hidden />
            {isCollapsed ? (
              <span className="sr-only">{PROJECT_AGENTS_NAV.title}</span>
            ) : (
              PROJECT_AGENTS_NAV.title
            )}
          </Link>

          <Link
            href={chatsHref}
            title={isCollapsed ? PROJECT_CHATS_NAV.title : undefined}
            onClick={onNavigate}
            className={navLinkClassName(projectPathInfo?.isChatsRoute ?? false)}
          >
            <ChatsIcon className="size-5 shrink-0" aria-hidden />
            {isCollapsed ? (
              <span className="sr-only">{PROJECT_CHATS_NAV.title}</span>
            ) : (
              PROJECT_CHATS_NAV.title
            )}
          </Link>

          {!isCollapsed ? (
            <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
          ) : null}

          {PROJECT_DETAIL_SECTIONS.map(({ id, title, icon: Icon }) => {
            const isActive =
              isProjectDetailPage &&
              projectSectionNav?.activeSectionId === id;

            if (isProjectDetailPage) {
              return (
                <button
                  key={id}
                  type="button"
                  title={isCollapsed ? title : undefined}
                  onClick={() => {
                    projectSectionNav?.navigateToSection(id);
                    onNavigate?.();
                  }}
                  className={`${navLinkClassName(isActive)} text-left`}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {isCollapsed ? (
                    <span className="sr-only">{title}</span>
                  ) : (
                    title
                  )}
                </button>
              );
            }

            return (
              <Link
                key={id}
                href={projectHref}
                title={isCollapsed ? title : undefined}
                onClick={onNavigate}
                className={navLinkClassName(false)}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {isCollapsed ? (
                  <span className="sr-only">{title}</span>
                ) : (
                  title
                )}
              </Link>
            );
          })}

          <Link
            href={notesHref}
            title={isCollapsed ? PROJECT_NOTES_NAV.title : undefined}
            onClick={onNavigate}
            className={navLinkClassName(projectPathInfo?.isNotesRoute ?? false)}
          >
            <NotesIcon className="size-5 shrink-0" aria-hidden />
            {isCollapsed ? (
              <span className="sr-only">{PROJECT_NOTES_NAV.title}</span>
            ) : (
              PROJECT_NOTES_NAV.title
            )}
          </Link>
        </nav>

        <nav
          aria-hidden={!showFeatureSidebar}
          className={`absolute inset-0 flex flex-col gap-1 overflow-y-auto transition-all duration-200 ease-out ${navPaddingClassName} ${
            showFeatureSidebar
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-3 opacity-0"
          }`}
        >
          <Link
            href={projectHref}
            title={
              isCollapsed
                ? project
                  ? `Back to ${project.name}`
                  : "Back to project"
                : undefined
            }
            onClick={onNavigate}
            className={`cursor-pointer mb-1 flex items-center rounded-lg text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 ${
              isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"
            }`}
          >
            <ArrowLeftIcon className="size-5 shrink-0" aria-hidden />
            {isCollapsed ? (
              <span className="sr-only">
                {project ? `Back to ${project.name}` : "Back to project"}
              </span>
            ) : project ? (
              `Back to ${project.name}`
            ) : (
              "Back to project"
            )}
          </Link>

          {!isCollapsed ? (
            <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
          ) : null}

          {FEATURE_DETAIL_SECTIONS.map(({ id, title, icon: Icon }) => {
            const isActive =
              isFeatureDetailPage &&
              projectSectionNav?.activeSectionId === id;

            if (isFeatureDetailPage) {
              return (
                <button
                  key={id}
                  type="button"
                  title={isCollapsed ? title : undefined}
                  onClick={() => {
                    projectSectionNav?.navigateToSection(id);
                    onNavigate?.();
                  }}
                  className={`${navLinkClassName(isActive)} text-left`}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {isCollapsed ? (
                    <span className="sr-only">{title}</span>
                  ) : (
                    title
                  )}
                </button>
              );
            }

            return (
              <Link
                key={id}
                href={featureHref}
                title={isCollapsed ? title : undefined}
                onClick={onNavigate}
                className={navLinkClassName(false)}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {isCollapsed ? (
                  <span className="sr-only">{title}</span>
                ) : (
                  title
                )}
              </Link>
            );
          })}

          <Link
            href={featureNotesHref}
            title={isCollapsed ? FEATURE_NOTES_NAV.title : undefined}
            onClick={onNavigate}
            className={navLinkClassName(isFeatureNotesRoute)}
          >
            <FeatureNotesIcon className="size-5 shrink-0" aria-hidden />
            {isCollapsed ? (
              <span className="sr-only">{FEATURE_NOTES_NAV.title}</span>
            ) : (
              FEATURE_NOTES_NAV.title
            )}
          </Link>
        </nav>
      </div>

      <div
        className={`mt-auto border-t border-zinc-200 dark:border-zinc-800 ${
          isCollapsed ? "p-2" : "p-3"
        }`}
      >
        {currentUser && !isCollapsed ? (
          <Link
            href="/account"
            onClick={onNavigate}
            className="mb-2 block rounded-lg px-1 py-1 text-xs text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <div className="flex items-center gap-2">
              <span className="truncate">
                {currentUser.name || currentUser.email}
              </span>
              <SubscriptionChip
                subscription={currentUser.subscription}
                size="sm"
              />
            </div>
          </Link>
        ) : null}
        {currentUser && isCollapsed ? (
          <Link
            href="/account"
            title={currentUser.name || currentUser.email}
            onClick={onNavigate}
            className="mb-2 flex flex-col items-center gap-1 rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            <UserCircleIcon className="size-5 shrink-0" aria-hidden />
            <SubscriptionChip
              subscription={currentUser.subscription}
              size="sm"
              iconOnly={currentUser.subscription === "premium"}
            />
            <span className="sr-only">{currentUser.name || currentUser.email}</span>
          </Link>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          aria-label="Sign out"
          className={`flex w-full items-center ${
            isCollapsed ? "justify-center px-2" : "justify-center gap-2"
          }`}
          onClick={handleLogout}
        >
          <ArrowRightOnRectangleIcon className="size-4" aria-hidden />
          {isCollapsed ? (
            <span className="sr-only">Sign out</span>
          ) : (
            "Sign out"
          )}
        </Button>
      </div>
    </aside>
  );
}
