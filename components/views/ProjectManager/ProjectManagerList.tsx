"use client";

import { useState } from "react";
import type { ProjectResponse } from "@/lib/types";
import DeleteProjectModal from "./modals/DeleteProjectModal";
import EditProjectModal from "./modals/EditProjectModal";
import ProjectCard from "./ProjectCard";

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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project._id}>
            <ProjectCard
              project={project}
              onEdit={setProjectToEdit}
              onDelete={setProjectToDelete}
            />
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
