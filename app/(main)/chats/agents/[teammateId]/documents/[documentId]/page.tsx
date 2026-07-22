import AgentDocumentDetailView from "@/components/views/AgentDocumentDetail/AgentDocumentDetailView";

type AgentDocumentPageProps = {
  params: Promise<{ teammateId: string; documentId: string }>;
};

export default async function AgentDocumentPage({
  params,
}: AgentDocumentPageProps) {
  const { teammateId, documentId } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <AgentDocumentDetailView
        teammateId={teammateId}
        documentId={documentId}
      />
    </div>
  );
}
