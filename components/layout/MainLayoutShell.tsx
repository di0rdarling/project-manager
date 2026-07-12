"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import NavigationSidebar from "@/components/layout/NavigationSidebar";
import { IconButton } from "@/components/ui/IconButton";
import { ProjectManagerLogo } from "@/components/ui/ProjectManagerLogo";
import { ProjectSectionNavProvider } from "@/components/views/ProjectDetail/ProjectSectionNavContext";

function useIsMdUp() {
  const [isMdUp, setIsMdUp] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    setIsMdUp(mediaQuery.matches);

    function handleChange(event: MediaQueryListEvent) {
      setIsMdUp(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMdUp;
}

export default function MainLayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isMdUp = useIsMdUp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileSidebarVisible = isMdUp || isSidebarOpen;

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isSidebarOpen || isMdUp) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, isMdUp]);

  return (
    <ProjectSectionNavProvider>
      <div className="flex h-full">
        {!isMdUp && isSidebarOpen ? (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
          />
        ) : null}

        <NavigationSidebar
          id="navigation-sidebar"
          isOpen={isMobileSidebarVisible}
          onNavigate={() => setIsSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-4 py-3 md:hidden dark:border-zinc-800">
            <IconButton
              type="button"
              aria-label={
                isSidebarOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={isSidebarOpen}
              aria-controls="navigation-sidebar"
              onClick={() => setIsSidebarOpen((open) => !open)}
            >
              {isSidebarOpen ? (
                <XMarkIcon className="size-5" aria-hidden />
              ) : (
                <Bars3Icon className="size-5" aria-hidden />
              )}
            </IconButton>
            <ProjectManagerLogo className="h-8 w-auto" />
          </header>

          <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
        </div>
      </div>
    </ProjectSectionNavProvider>
  );
}
