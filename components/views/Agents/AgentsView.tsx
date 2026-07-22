"use client";

import PageContent from "@/components/layout/PageContent";
import ChatAgentsRow from "@/components/views/Chats/ChatAgentsRow";
import { useFetchProject } from "@/hooks/queries/useFetchProject";

type AgentsViewProps = {
  projectId: string;
};

export default function AgentsView({ projectId }: Readonly<AgentsViewProps>) {
  const { data: project } = useFetchProject(projectId);

  return (
    <PageContent>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Agents</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {project
            ? `AI teammates available for ${project.name}`
            : "AI teammates available for this project"}
        </p>
      </div>

      <ChatAgentsRow from="agents" projectId={projectId} />
    </PageContent>
  );
}
