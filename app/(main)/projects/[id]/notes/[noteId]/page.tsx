import NoteDetailView from "@/components/views/NoteDetail/NoteDetailView";

type NotePageProps = {
  params: Promise<{ id: string; noteId: string }>;
};

export default async function NotePage({ params }: NotePageProps) {
  const { id, noteId } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <NoteDetailView projectId={id} noteId={noteId} />
    </div>
  );
}
