import { Suspense } from "react";
import NotesView from "@/components/views/ProjectNotes/NotesView";

type FeatureNotesPageProps = {
  params: Promise<{ id: string; featureId: string }>;
};

export default async function FeatureNotesPage({ params }: FeatureNotesPageProps) {
  const { id, featureId } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <Suspense fallback={null}>
        <NotesView projectId={id} featureId={featureId} />
      </Suspense>
    </div>
  );
}
