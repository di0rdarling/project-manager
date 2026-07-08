import FeatureDetailView from "@/components/views/FeatureDetail/FeatureDetailView";

type FeaturePageProps = {
  params: Promise<{ id: string; featureId: string }>;
};

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { id, featureId } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <FeatureDetailView projectId={id} featureId={featureId} />
    </div>
  );
}
