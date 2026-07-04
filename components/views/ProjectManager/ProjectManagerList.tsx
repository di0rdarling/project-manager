"use client";

import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import type { ProjectResponse } from "@/lib/types";
import { formatDisplayDate } from "@/lib/dates";
import DeleteProjectModal from "./DeleteProjectModal";
import { TrashIcon } from "@heroicons/react/24/outline";

interface ProjectManagerListProps {
  projects: ProjectResponse[];
  onDeleteSuccess?: (projectName: string) => void;
}

export default function ProjectManagerList({
  projects,
  onDeleteSuccess,
}: Readonly<ProjectManagerListProps>) {
  const [projectToDelete, setProjectToDelete] = useState<ProjectResponse | null>(
    null,
  );

  return (
    <>
      <ul className="space-y-3">
        {projects.map((project) => (
          <li
            key={project._id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">{project.name}</h3>
                {project.description ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {project.description}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <time
                  dateTime={project.createdAt}
                  className="pt-2 text-xs text-zinc-500"
                >
                  {formatDisplayDate(project.createdAt)}
                </time>
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

      <DeleteProjectModal
        open={projectToDelete !== null}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onSuccess={(projectName) => onDeleteSuccess?.(projectName)}
      />
    </>
  );
}
