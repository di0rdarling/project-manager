"use client";

import Link from "next/link";
import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import type { ProjectResponse } from "@/lib/types";
import { formatDisplayDate } from "@/lib/dates";
import DeleteProjectModal from "./modals/DeleteProjectModal";
import EditProjectModal from "./modals/EditProjectModal";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface ProjectManagerListProps {
  projects: ProjectResponse[];
  onEditSuccess?: (projectName: string) => void;
  onDeleteSuccess?: (projectName: string) => void;
}

export default function ProjectManagerList({
  projects,
  onEditSuccess,
  onDeleteSuccess,
}: Readonly<ProjectManagerListProps>) {
  const [projectToEdit, setProjectToEdit] = useState<ProjectResponse | null>(
    null,
  );
  const [projectToDelete, setProjectToDelete] = useState<ProjectResponse | null>(
    null,
  );

  return (
    <>
      <ul className="space-y-3">
        {projects.map((project) => (
          <li
            key={project._id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
          >
            <div className="flex items-start justify-between gap-4">
              <Link
                href={`/projects/${project._id}`}
                className="min-w-0 flex-1 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
              >
                <h3 className="font-medium">{project.name}</h3>
                {project.description ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {project.description}
                  </p>
                ) : null}
              </Link>
              <div className="flex shrink-0 items-start gap-1">
                <time
                  dateTime={project.createdAt}
                  className="pt-2 text-xs text-zinc-500"
                >
                  {formatDisplayDate(project.createdAt)}
                </time>
                <IconButton
                  type="button"
                  aria-label={`Edit ${project.name}`}
                  onClick={() => setProjectToEdit(project)}
                >
                  <PencilIcon className="size-4" />
                </IconButton>
                <IconButton
                  type="button"
                  variant="danger"
                  aria-label={`Delete ${project.name}`}
                  onClick={() => setProjectToDelete(project)}
                >
                  <TrashIcon className="size-4 text-red-500" />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <EditProjectModal
        open={projectToEdit !== null}
        project={projectToEdit}
        onClose={() => setProjectToEdit(null)}
        onSuccess={(projectName) => onEditSuccess?.(projectName)}
      />

      <DeleteProjectModal
        open={projectToDelete !== null}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onSuccess={(projectName) => onDeleteSuccess?.(projectName)}
      />
    </>
  );
}
