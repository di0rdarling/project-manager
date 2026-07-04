import ProjectDetailView from "@/components/views/ProjectDetail/ProjectDetailView";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <ProjectDetailView projectId={id} />
    </div>
  );
}
