"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ContextTag } from "@/components/ui/ContextTag";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import PageContent from "@/components/layout/PageContent";
import NotesSection from "@/components/views/ProjectDetail/NotesSection";
import ChallengesSection from "@/components/views/ProjectDetail/ChallengesSection";
import DomainKnowledgeSection from "@/components/views/ProjectDetail/DomainKnowledgeSection";
import AIFeatureSummary from "@/components/views/FeatureDetail/AIFeatureSummary";
import { useFetchFeature } from "@/hooks/queries/useFetchFeature";
import { useFetchProject } from "@/hooks/queries/useFetchProject";
import { useFetchRequirements } from "@/hooks/queries/useFetchRequirements";
import { formatDisplayDate } from "@/lib/dates";

interface FeatureDetailViewProps {
  projectId: string;
  featureId: string;
}

export default function FeatureDetailView({
  projectId,
  featureId,
}: Readonly<FeatureDetailViewProps>) {
  const {
    data: feature,
    isPending: isFeaturePending,
    isError: isFeatureError,
    error: featureError,
  } = useFetchFeature(projectId, featureId);

  const {
    data: project,
    isPending: isProjectPending,
    isError: isProjectError,
    error: projectError,
  } = useFetchProject(projectId);

  const { data: requirements = [] } = useFetchRequirements(projectId, {
    enabled: Boolean(feature?.requirementIds?.length),
  });

  const isPending = isFeaturePending || isProjectPending;
  const isError = isFeatureError || isProjectError;
  const error = featureError ?? projectError;

  const linkedRequirements = feature
    ? requirements.filter((requirement) =>
        feature.requirementIds.includes(requirement._id),
      )
    : [];

  return (
    <PageContent>
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {project ? `Back to ${project.name}` : "Back to project"}
      </Link>

      {isPending ? (
        <LoadingMessage>Loading feature...</LoadingMessage>
      ) : isError ? (
        <ErrorMessage error={error} fallbackMessage="Failed to load feature" />
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Feature
            </p>
            <h1 className="text-4xl font-bold tracking-tight">{feature.title}</h1>
            {linkedRequirements.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Linked requirements:
                </p>
                {linkedRequirements.map((requirement) => (
                  <ContextTag
                    key={requirement._id}
                    className="bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {requirement.title.trim() || "Untitled requirement"}
                  </ContextTag>
                ))}
              </div>
            ) : null}
            <p className="text-xs text-zinc-500">
              Created {formatDisplayDate(feature.createdAt)}
            </p>
          </div>

          <AIFeatureSummary projectId={projectId} featureId={featureId} />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Description
            </h2>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <RichTextContent
                content={feature.content}
                className="text-sm text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </section>

          <ChallengesSection
            projectId={projectId}
            featureId={featureId}
            emptyMessage="No challenges recorded yet. Add any issues or blockers specific to this feature."
          />

          <DomainKnowledgeSection
            projectId={projectId}
            featureId={featureId}
            emptyMessage="No domain knowledge yet. Capture terms, concepts, and open questions specific to this feature."
          />

          <NotesSection
            projectId={projectId}
            featureId={featureId}
            emptyMessage="No notes yet. Add notes about this feature to capture ideas, decisions, or open questions."
          />
        </>
      )}
    </PageContent>
  );
}
