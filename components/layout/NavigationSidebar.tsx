"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthQueryCache } from "@/lib/auth/auth-query-cache";
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ProjectManagerLogo } from "@/components/ui/ProjectManagerLogo";
import { useProjectSectionNav } from "@/components/views/ProjectDetail/ProjectSectionNavContext";
import { useFetchCurrentUser } from "@/hooks/queries/useFetchCurrentUser";
import { useFetchProject } from "@/hooks/queries/useFetchProject";
import { getProjectNotesPath } from "@/lib/notes";
import {
  getProjectPathInfo,
  PROJECT_DETAIL_SECTIONS,
  PROJECT_NOTES_NAV,
} from "@/lib/project-detail-sections";

const navItems = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/agents", label: "Agents", icon: UserGroupIcon },
  { href: "/chats", label: "Chats", icon: ChatBubbleLeftRightIcon },
  { href: "/account", label: "Account", icon: UserCircleIcon },
] as const;

type NavigationSidebarProps = {
  id?: string;
  isOpen?: boolean;
  onNavigate?: () => void;
};

export default function NavigationSidebar({
  id,
  isOpen = true,
  onNavigate,
}: NavigationSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useFetchCurrentUser();
  const projectSectionNav = useProjectSectionNav();
  const projectPathInfo = getProjectPathInfo(pathname);
  const showProjectSidebar = projectPathInfo !== null;
  const isProjectDetailPage = projectPathInfo?.isDetailPage ?? false;
  const { data: project } = useFetchProject(projectPathInfo?.projectId ?? "", {
    enabled: showProjectSidebar,
  });

  useEffect(() => {
    if (!showProjectSidebar) {
      projectSectionNav?.resetActiveSection();
    }
  }, [showProjectSidebar, projectSectionNav]);

  useEffect(() => {
    if (!isProjectDetailPage) {
      projectSectionNav?.resetActiveSection();
    }
  }, [isProjectDetailPage, projectSectionNav]);

  useEffect(() => {
    projectSectionNav?.resetActiveSection();
  }, [projectPathInfo?.projectId, projectSectionNav]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearAuthQueryCache(queryClient);
    router.replace("/login");
    router.refresh();
  }

  const projectId = projectPathInfo?.projectId ?? "";
  const notesHref = getProjectNotesPath(projectId);
  const projectHref = `/projects/${projectId}`;
  const NotesIcon = PROJECT_NOTES_NAV.icon;

  const navLinkClassName = (isActive: boolean) =>
    `cursor-pointer flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
    }`;

  return (
    <aside
      id={id}
      aria-hidden={!isOpen}
      className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 md:relative md:z-auto md:shrink-0 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="border-b border-zinc-200 px-4 py-5 dark:border-zinc-800">
        <ProjectManagerLogo className="h-9 w-auto" />
        {showProjectSidebar && project?.name ? (
          <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {project.name}
          </p>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <nav
          aria-hidden={showProjectSidebar}
          className={`absolute inset-0 flex flex-col gap-1 overflow-y-auto p-3 transition-all duration-200 ease-out ${
            showProjectSidebar
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
                onClick={onNavigate}
                className={navLinkClassName(isActive)}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <nav
          aria-hidden={!showProjectSidebar}
          className={`absolute inset-0 flex flex-col gap-1 overflow-y-auto p-3 transition-all duration-200 ease-out ${
            showProjectSidebar
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-3 opacity-0"
          }`}
        >
          <Link
            href="/home"
            onClick={onNavigate}
            className="cursor-pointer mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            <ArrowLeftIcon className="size-5 shrink-0" aria-hidden />
            All projects
          </Link>

          <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />

          {PROJECT_DETAIL_SECTIONS.map(({ id, title, icon: Icon }) => {
            const isActive =
              isProjectDetailPage &&
              projectSectionNav?.activeSectionId === id;

            if (isProjectDetailPage) {
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    projectSectionNav?.navigateToSection(id);
                    onNavigate?.();
                  }}
                  className={`${navLinkClassName(isActive)} text-left`}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {title}
                </button>
              );
            }

            return (
              <Link
                key={id}
                href={projectHref}
                onClick={onNavigate}
                className={navLinkClassName(false)}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {title}
              </Link>
            );
          })}

          <Link
            href={notesHref}
            onClick={onNavigate}
            className={navLinkClassName(projectPathInfo?.isNotesRoute ?? false)}
          >
            <NotesIcon className="size-5 shrink-0" aria-hidden />
            {PROJECT_NOTES_NAV.title}
          </Link>
        </nav>
      </div>

      <div className="mt-auto border-t border-zinc-200 p-3 dark:border-zinc-800">
        {currentUser ? (
          <Link
            href="/account"
            onClick={onNavigate}
            className="mb-2 block truncate rounded-lg px-1 py-1 text-xs text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {currentUser.name || currentUser.email}
          </Link>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="flex w-full items-center justify-center gap-2"
          onClick={handleLogout}
        >
          <ArrowRightOnRectangleIcon className="size-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
