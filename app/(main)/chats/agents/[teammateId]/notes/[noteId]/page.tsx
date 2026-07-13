import AgentNoteDetailView from "@/components/views/AgentNoteDetail/AgentNoteDetailView";

type AgentNotePageProps = {
  params: Promise<{ teammateId: string; noteId: string }>;
};

export default async function AgentNotePage({ params }: AgentNotePageProps) {
  const { teammateId, noteId } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <AgentNoteDetailView teammateId={teammateId} noteId={noteId} />
    </div>
  );
}
