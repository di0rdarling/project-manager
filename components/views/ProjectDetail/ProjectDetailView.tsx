"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useFetchProject } from "@/hooks/queries/useFetchProject";
import { useFetchRequirements } from "@/hooks/queries/useFetchRequirements";
import { useFetchFeatures } from "@/hooks/queries/useFetchFeatures";
import { useFetchTools } from "@/hooks/queries/useFetchTools";
import { useFetchCoreUsers } from "@/hooks/queries/useFetchCoreUsers";
import { useFetchPainPoints } from "@/hooks/queries/useFetchPainPoints";
import { formatDisplayDate } from "@/lib/dates";
import CreatePainPointModal from "./modals/painPoints/CreatePainPointModal";
import CreateRequirementModal from "./modals/requirements/CreateRequirementModal";
import CreateFeatureModal from "./modals/features/CreateFeatureModal";
import CreateToolModal from "./modals/tools/CreateToolModal";
import CreateCoreUserModal from "./modals/coreUsers/CreateCoreUserModal";
import DeleteRequirementModal from "./modals/requirements/DeleteRequirementModal";
import DeleteFeatureModal from "./modals/features/DeleteFeatureModal";
import DeleteToolModal from "./modals/tools/DeleteToolModal";
import DeleteCoreUserModal from "./modals/coreUsers/DeleteCoreUserModal";
import DeletePainPointModal from "./modals/painPoints/DeletePainPointModal";
import EditPainPointModal from "./modals/painPoints/EditPainPointModal";
import EditRequirementModal from "./modals/requirements/EditRequirementModal";
import EditFeatureModal from "./modals/features/EditFeatureModal";
import EditToolModal from "./modals/tools/EditToolModal";
import EditCoreUserModal from "./modals/coreUsers/EditCoreUserModal";
import ProjectItemsList from "./ProjectItemsList";
import RequirementsItemsList from "./RequirementsItemsList";
import FeatureItemsList from "./FeatureItemsList";
import ChallengesSection from "./ChallengesSection";
import DomainKnowledgeSection from "./DomainKnowledgeSection";
import ProjectSection from "./ProjectSection";
import NotesSection from "./NotesSection";
import AIProjectSummary from "./AIProjectSummary";
import PageContent from "@/components/layout/PageContent";
import EditProjectModal from "../ProjectManager/modals/EditProjectModal";

interface ProjectDetailViewProps {
  projectId: string;
}

export default function ProjectDetailView({
  projectId,
}: Readonly<ProjectDetailViewProps>) {
  const [isCreateRequirementModalOpen, setIsCreateRequirementModalOpen] =
    useState(false);
  const [isCreateFeatureModalOpen, setIsCreateFeatureModalOpen] =
    useState(false);
  const [isCreateToolModalOpen, setIsCreateToolModalOpen] = useState(false);
  const [isCreateCoreUserModalOpen, setIsCreateCoreUserModalOpen] =
    useState(false);
  const [isCreatePainPointModalOpen, setIsCreatePainPointModalOpen] =
    useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  const { data: project, isPending, isError, error } =
    useFetchProject(projectId);

  const canFetchSections = !isPending && !isError;

  const {
    data: requirements = [],
    isPending: isRequirementsPending,
    isError: isRequirementsError,
    error: requirementsError,
  } = useFetchRequirements(projectId, { enabled: canFetchSections });

  const {
    data: features = [],
    isPending: isFeaturesPending,
    isError: isFeaturesError,
    error: featuresError,
  } = useFetchFeatures(projectId, { enabled: canFetchSections });

  const {
    data: tools = [],
    isPending: isToolsPending,
    isError: isToolsError,
    error: toolsError,
  } = useFetchTools(projectId, { enabled: canFetchSections });

  const {
    data: coreUsers = [],
    isPending: isCoreUsersPending,
    isError: isCoreUsersError,
    error: coreUsersError,
  } = useFetchCoreUsers(projectId, { enabled: canFetchSections });

  const {
    data: painPoints = [],
    isPending: isPainPointsPending,
    isError: isPainPointsError,
    error: painPointsError,
  } = useFetchPainPoints(projectId, { enabled: canFetchSections });

  return (
    <PageContent>
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to projects
      </Link>

      {isPending ? (
        <LoadingMessage>Loading project...</LoadingMessage>
      ) : isError ? (
        <ErrorMessage error={error} fallbackMessage="Failed to load project" />
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
              <IconButton
                type="button"
                aria-label="Edit project"
                onClick={() => setIsEditProjectModalOpen(true)}
              >
                <PencilIcon className="size-4" />
              </IconButton>
            </div>
            {project.description ? (
              <p className="text-zinc-600 dark:text-zinc-400">
                {project.description}
              </p>
            ) : null}
            <p className="text-xs text-zinc-500">
              Created {formatDisplayDate(project.createdAt)}
            </p>
          </div>

          <AIProjectSummary projectId={projectId} />

          <ProjectSection
            title="Core Users"
            addButtonLabel="Add Core User"
            onAddClick={() => setIsCreateCoreUserModalOpen(true)}
            isPending={isCoreUsersPending}
            isError={isCoreUsersError}
            error={coreUsersError}
            loadingMessage="Loading core users..."
            errorFallbackMessage="Failed to load core users"
            isEmpty={coreUsers.length === 0}
            emptyMessage="No core users yet. Add your first one to get started."
          >
            <ProjectItemsList
              items={coreUsers}
              itemLabel="core user"
              onEditSuccess={() =>
                toast.success("Core user updated successfully.")
              }
              onDeleteSuccess={() =>
                toast.success("Core user deleted successfully.")
              }
              renderEditModal={({ open, item, onClose, onSuccess }) => (
                <EditCoreUserModal
                  open={open}
                  projectId={projectId}
                  coreUser={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
              renderDeleteModal={({ open, item, onClose, onSuccess }) => (
                <DeleteCoreUserModal
                  open={open}
                  projectId={projectId}
                  coreUser={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
            />
          </ProjectSection>

          <ProjectSection
            title="Pain Points"
            addButtonLabel="Add Pain Point"
            onAddClick={() => setIsCreatePainPointModalOpen(true)}
            isPending={isPainPointsPending}
            isError={isPainPointsError}
            error={painPointsError}
            loadingMessage="Loading pain points..."
            errorFallbackMessage="Failed to load pain points"
            isEmpty={painPoints.length === 0}
            emptyMessage="No pain points yet. Add the problems this project solves for core users."
          >
            <ProjectItemsList
              items={painPoints}
              itemLabel="pain point"
              onEditSuccess={() =>
                toast.success("Pain point updated successfully.")
              }
              onDeleteSuccess={() =>
                toast.success("Pain point deleted successfully.")
              }
              renderEditModal={({ open, item, onClose, onSuccess }) => (
                <EditPainPointModal
                  open={open}
                  projectId={projectId}
                  painPoint={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
              renderDeleteModal={({ open, item, onClose, onSuccess }) => (
                <DeletePainPointModal
                  open={open}
                  projectId={projectId}
                  painPoint={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
            />
          </ProjectSection>

          <ChallengesSection projectId={projectId} enabled={canFetchSections} />

          <DomainKnowledgeSection
            projectId={projectId}
            enabled={canFetchSections}
          />

          <ProjectSection
            title="Requirements"
            addButtonLabel="Add Requirement"
            onAddClick={() => setIsCreateRequirementModalOpen(true)}
            isPending={isRequirementsPending}
            isError={isRequirementsError}
            error={requirementsError}
            loadingMessage="Loading requirements..."
            errorFallbackMessage="Failed to load requirements"
            isEmpty={requirements.length === 0}
            emptyMessage="No requirements yet. Add your first one to get started."
          >
            <RequirementsItemsList
              items={requirements}
              onEditSuccess={() =>
                toast.success("Requirement updated successfully.")
              }
              onDeleteSuccess={() =>
                toast.success("Requirement deleted successfully.")
              }
              renderEditModal={({ open, item, onClose, onSuccess }) => (
                <EditRequirementModal
                  open={open}
                  projectId={projectId}
                  requirement={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
              renderDeleteModal={({ open, item, onClose, onSuccess }) => (
                <DeleteRequirementModal
                  open={open}
                  projectId={projectId}
                  requirement={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
            />
          </ProjectSection>

          <ProjectSection
            title="Features"
            addButtonLabel="Add Feature"
            onAddClick={() => setIsCreateFeatureModalOpen(true)}
            isPending={isFeaturesPending}
            isError={isFeaturesError}
            error={featuresError}
            loadingMessage="Loading features..."
            errorFallbackMessage="Failed to load features"
            isEmpty={features.length === 0}
            emptyMessage="No features yet. Add your first one to get started."
          >
            <FeatureItemsList
              projectId={projectId}
              items={features}
              requirements={requirements}
              onEditSuccess={() => toast.success("Feature updated successfully.")}
              onDeleteSuccess={() => toast.success("Feature deleted successfully.")}
              renderEditModal={({ open, item, onClose, onSuccess }) => (
                <EditFeatureModal
                  open={open}
                  projectId={projectId}
                  feature={item}
                  requirements={requirements}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
              renderDeleteModal={({ open, item, onClose, onSuccess }) => (
                <DeleteFeatureModal
                  open={open}
                  projectId={projectId}
                  feature={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
            />
          </ProjectSection>

          <ProjectSection
            title="Tools"
            addButtonLabel="Add Tool"
            onAddClick={() => setIsCreateToolModalOpen(true)}
            isPending={isToolsPending}
            isError={isToolsError}
            error={toolsError}
            loadingMessage="Loading tools..."
            errorFallbackMessage="Failed to load tools"
            isEmpty={tools.length === 0}
            emptyMessage="No tools yet. Add your first one to get started."
          >
            <ProjectItemsList
              items={tools}
              itemLabel="tool"
              onEditSuccess={() => toast.success("Tool updated successfully.")}
              onDeleteSuccess={() => toast.success("Tool deleted successfully.")}
              renderEditModal={({ open, item, onClose, onSuccess }) => (
                <EditToolModal
                  open={open}
                  projectId={projectId}
                  tool={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
              renderDeleteModal={({ open, item, onClose, onSuccess }) => (
                <DeleteToolModal
                  open={open}
                  projectId={projectId}
                  tool={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
            />
          </ProjectSection>

          <NotesSection projectId={projectId} enabled={canFetchSections} />
          <CreateRequirementModal
            open={isCreateRequirementModalOpen}
            projectId={projectId}
            onClose={() => setIsCreateRequirementModalOpen(false)}
            onSuccess={() => toast.success("Requirement added successfully.")}
          />

          <CreateFeatureModal
            open={isCreateFeatureModalOpen}
            projectId={projectId}
            requirements={requirements}
            onClose={() => setIsCreateFeatureModalOpen(false)}
            onSuccess={() => toast.success("Feature added successfully.")}
          />

          <CreateToolModal
            open={isCreateToolModalOpen}
            projectId={projectId}
            onClose={() => setIsCreateToolModalOpen(false)}
            onSuccess={() => toast.success("Tool added successfully.")}
          />

          <CreateCoreUserModal
            open={isCreateCoreUserModalOpen}
            projectId={projectId}
            onClose={() => setIsCreateCoreUserModalOpen(false)}
            onSuccess={() => toast.success("Core user added successfully.")}
          />

          <CreatePainPointModal
            open={isCreatePainPointModalOpen}
            projectId={projectId}
            onClose={() => setIsCreatePainPointModalOpen(false)}
            onSuccess={() => toast.success("Pain point added successfully.")}
          />

          <EditProjectModal
            open={isEditProjectModalOpen}
            project={project}
            onClose={() => setIsEditProjectModalOpen(false)}
            onSuccess={() => toast.success("Project updated successfully.")}
          />
        </>
      )}
    </PageContent>
  );
}
