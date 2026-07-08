"use client";

import NavigationSidebar from "@/components/layout/NavigationSidebar";
import { ProjectSectionNavProvider } from "@/components/views/ProjectDetail/ProjectSectionNavContext";

export default function MainLayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProjectSectionNavProvider>
      <div className="flex h-full">
        <NavigationSidebar />
        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </ProjectSectionNavProvider>
  );
}
