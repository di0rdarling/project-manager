import { Suspense } from "react";
import AgentsView from "@/components/views/Agents/AgentsView";

type ProjectAgentsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectAgentsPage({
  params,
}: ProjectAgentsPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <Suspense fallback={null}>
        <AgentsView projectId={id} />
      </Suspense>
    </div>
  );
}
