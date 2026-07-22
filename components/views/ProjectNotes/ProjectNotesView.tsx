"use client";

import NotesView from "@/components/views/ProjectNotes/NotesView";

interface ProjectNotesViewProps {
  projectId: string;
}

export default function ProjectNotesView({
  projectId,
}: Readonly<ProjectNotesViewProps>) {
  return <NotesView projectId={projectId} />;
}
