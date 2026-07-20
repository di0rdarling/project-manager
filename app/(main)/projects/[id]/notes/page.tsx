import ProjectNotesView from "@/components/views/ProjectNotes/ProjectNotesView";

type ProjectNotesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectNotesPage({ params }: ProjectNotesPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <ProjectNotesView projectId={id} />
    </div>
  );
}
