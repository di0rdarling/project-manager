"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useFetchProjects } from "@/hooks/queries/useFetchProjects";
import CreateProjectModal from "./CreateProjectModal";
import ProjectManagerList from "./ProjectManagerList";

export default function ProjectManagerView() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: projects = [],
    isPending,
    isError,
    error,
  } = useFetchProjects();

  function openCreateModal() {
    setIsCreateModalOpen(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Project Manager</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Create and manage your projects.
          </p>
        </div>

      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold mt-4">Your projects</h2>
          <Button type="button" onClick={openCreateModal} className="shrink-0">
            Create Project
          </Button>
        </div>

        {isPending ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading projects...
          </p>
        ) : isError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : "Failed to load projects"}
          </p>
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
    </div>
  );
}
