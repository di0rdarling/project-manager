"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useFetchCurrentUser } from "@/hooks/queries/useFetchCurrentUser";
import { useFetchProjects } from "@/hooks/queries/useFetchProjects";
import PageContent from "@/components/layout/PageContent";
import CreateProjectModal from "./modals/CreateProjectModal";
import CrossProjectAIDigest from "./CrossProjectAIDigest";
import DashboardStats from "./DashboardStats";
import ProjectManagerList from "./ProjectManagerList";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function ProjectManagerView() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: projects = [],
    isPending,
    isError,
    error,
  } = useFetchProjects();

  const { data: currentUser } = useFetchCurrentUser();

  function openCreateModal() {
    setIsCreateModalOpen(true);
  }

  const greetingName = currentUser?.name?.trim();
  const greeting = `${getGreeting()}${greetingName ? `, ${greetingName}` : ""}`;

  return (
    <PageContent>
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Create and manage your projects.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} className="shrink-0">
          Create Project
        </Button>
      </div>

      <DashboardStats />

      <CrossProjectAIDigest />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your projects</h2>
        </div>

        {isPending ? (
          <LoadingMessage>Loading projects...</LoadingMessage>
        ) : isError ? (
          <ErrorMessage
            error={error}
            fallbackMessage="Failed to load projects"
          />
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No projects yet. Create your first one to get started.
            </p>
            <Button
              type="button"
              onClick={openCreateModal}
              className="mt-4"
            >
              Create Project
            </Button>
          </div>
        ) : (
          <ProjectManagerList
            projects={projects}
            onEditSuccess={(projectName) =>
              toast.success(`Project "${projectName}" updated successfully.`)
            }
            onDeleteSuccess={(projectName) =>
              toast.success(`Project "${projectName}" deleted successfully.`)
            }
          />
        )}
      </section>

      <CreateProjectModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(projectName) =>
          toast.success(`Project "${projectName}" created successfully.`)
        }
      />
    </PageContent>
  );
}
