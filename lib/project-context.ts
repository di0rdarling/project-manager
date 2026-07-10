import type { Db, ObjectId } from "mongodb";
import { buildChatProjectContext } from "@/lib/prompts/chat-project-context-prompt";
import {
  featureDomainKnowledgeFilter,
  parseConfidenceLevel,
  projectLevelDomainKnowledgeFilter,
} from "@/lib/domain-knowledge";
import {
  getLinkedRequirementTitles,
  getStoredRequirementIds,
} from "@/lib/feature-requirements";
import { stripRichText } from "@/lib/rich-text";
import {
  getRequirementPriorityLabel,
  parseRequirementPriority,
} from "@/lib/requirements";
import type { StoredProject } from "@/lib/serialize-project";
import type { CoreUser, DomainKnowledge, Feature, Note, PainPoint, Requirement, Tool, Challenge } from "@/lib/types";
import { featureNotesFilter, projectLevelNotesFilter } from "@/lib/notes";
import {
  featureChallengesFilter,
  projectLevelChallengesFilter,
} from "@/lib/challenges";

type StoredRequirement = Omit<
  Requirement,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: Requirement["_id"];
  projectId: Requirement["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredFeature = Omit<
  Feature,
  "_id" | "projectId" | "requirementIds" | "createdAt" | "updatedAt"
> & {
  _id: Feature["_id"];
  projectId: Feature["projectId"];
  requirementIds?: Feature["requirementIds"];
  requirementId?: Feature["requirementIds"][number] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredChallenge = Omit<
  Challenge,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: Challenge["_id"];
  projectId: Challenge["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredNote = Omit<Note, "_id" | "projectId" | "createdAt" | "updatedAt"> & {
  _id: Note["_id"];
  projectId: Note["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredTool = Omit<Tool, "_id" | "projectId" | "createdAt" | "updatedAt"> & {
  _id: Tool["_id"];
  projectId: Tool["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredCoreUser = Omit<
  CoreUser,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: CoreUser["_id"];
  projectId: CoreUser["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredPainPoint = Omit<
  PainPoint,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: PainPoint["_id"];
  projectId: PainPoint["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredDomainKnowledge = Omit<
  DomainKnowledge,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: DomainKnowledge["_id"];
  projectId: DomainKnowledge["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ProjectContextFocus = {
  requirementId?: ObjectId | null;
  featureId?: ObjectId | null;
};

function buildChatFocusSection(
  requirement: StoredRequirement | null,
  feature: StoredFeature | null,
): string | null {
  if (!requirement && !feature) {
    return null;
  }

  const sections = ["", "Chat Focus:"];

  if (requirement) {
    const priority = parseRequirementPriority(requirement.priority);
    const priorityLine = priority
      ? `\nPriority: ${getRequirementPriorityLabel(priority)}`
      : "";

    sections.push(
      "The user started this chat to discuss the following requirement. Prioritize this topic in your replies:",
      `Requirement: ${requirement.title.trim() || "Untitled requirement"}${priorityLine}`,
      stripRichText(requirement.content) || "No content provided.",
    );
  }

  if (feature) {
    if (requirement) {
      sections.push(
        "",
        "They also want to focus on this linked feature:",
      );
    } else {
      sections.push(
        "The user started this chat to discuss the following feature. Prioritize this topic in your replies:",
      );
    }

    sections.push(
      `Feature: ${feature.title.trim() || "Untitled feature"}`,
      stripRichText(feature.content) || "No description provided.",
    );
  }

  return sections.join("\n");
}

export async function getProjectContext(
  db: Db,
  userId: ObjectId,
  projectId: ObjectId,
  focus?: ProjectContextFocus,
): Promise<string | null> {
  const project = await db
    .collection<StoredProject>("projects")
    .findOne({ _id: projectId, userId });

  if (!project) {
    return null;
  }

  const [coreUsers, painPoints, challenges, domainKnowledge, requirements, features, tools, notes] =
    await Promise.all([
    db
      .collection<StoredCoreUser>("coreUsers")
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredPainPoint>("painPoints")
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredChallenge>("challenges")
      .find(projectLevelChallengesFilter(projectId))
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredDomainKnowledge>("domainKnowledge")
      .find(projectLevelDomainKnowledgeFilter(projectId))
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredRequirement>("requirements")
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredFeature>("features")
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredTool>("tools")
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<StoredNote>("notes")
      .find(projectLevelNotesFilter(projectId))
      .sort({ createdAt: -1 })
      .toArray(),
  ]);

  const requirementTitles = new Map(
    requirements.map((requirement) => [
      requirement._id.toString(),
      requirement.title.trim() || "Untitled requirement",
    ]),
  );

  const [
    focusedRequirement,
    focusedFeature,
    focusedFeatureNotes,
    focusedFeatureChallenges,
    focusedFeatureDomainKnowledge,
  ] = await Promise.all([
      focus?.requirementId
        ? db.collection<StoredRequirement>("requirements").findOne({
            _id: focus.requirementId,
            projectId,
          })
        : Promise.resolve(null),
      focus?.featureId
        ? db.collection<StoredFeature>("features").findOne({
            _id: focus.featureId,
            projectId,
          })
        : Promise.resolve(null),
      focus?.featureId
        ? db
            .collection<StoredNote>("notes")
            .find(featureNotesFilter(projectId, focus.featureId))
            .sort({ createdAt: -1 })
            .toArray()
        : Promise.resolve([]),
      focus?.featureId
        ? db
            .collection<StoredChallenge>("challenges")
            .find(featureChallengesFilter(projectId, focus.featureId))
            .sort({ createdAt: -1 })
            .toArray()
        : Promise.resolve([]),
      focus?.featureId
        ? db
            .collection<StoredDomainKnowledge>("domainKnowledge")
            .find(featureDomainKnowledgeFilter(projectId, focus.featureId))
            .sort({ createdAt: -1 })
            .toArray()
        : Promise.resolve([]),
    ]);

  const projectContext = buildChatProjectContext({
    name: project.name,
    description: project.description,
    aiSummary: project.aiSummary,
    coreUsers: coreUsers.map((coreUser) => ({
      name: coreUser.name,
      role: coreUser.role,
      content: coreUser.content,
    })),
    painPoints: painPoints.map((painPoint) => ({
      title: painPoint.title,
      content: painPoint.content,
    })),
    challenges: challenges.map((challenge) => ({
      title: challenge.title,
      overview: challenge.overview,
      status: challenge.status,
    })),
    domainKnowledge: domainKnowledge.map((item) => ({
      name: item.name,
      currentUnderstanding: item.currentUnderstanding,
      openQuestions: item.openQuestions,
      confidenceLevel: parseConfidenceLevel(item.confidenceLevel),
    })),
    requirements: requirements.map((requirement) => ({
      title: requirement.title,
      content: requirement.content,
      priority: parseRequirementPriority(requirement.priority),
    })),
    features: features.map((feature) => ({
      title: feature.title,
      content: feature.content,
      linkedRequirementTitles: getLinkedRequirementTitles(
        getStoredRequirementIds(feature),
        requirementTitles,
      ),
    })),
    tools: tools.map((tool) => ({
      name: tool.name,
      content: tool.content,
    })),
    notes: notes.map((note) => ({
      title: note.title,
      content: note.content,
    })),
    featureNotes: focus?.featureId
      ? focusedFeatureNotes.map((note) => ({
          title: note.title,
          content: note.content,
        }))
      : undefined,
    featureChallenges: focus?.featureId
      ? focusedFeatureChallenges.map((challenge) => ({
          title: challenge.title,
          overview: challenge.overview,
          status: challenge.status,
        }))
      : undefined,
    featureDomainKnowledge: focus?.featureId
      ? focusedFeatureDomainKnowledge.map((item) => ({
          name: item.name,
          currentUnderstanding: item.currentUnderstanding,
          openQuestions: item.openQuestions,
          confidenceLevel: parseConfidenceLevel(item.confidenceLevel),
        }))
      : undefined,
  });

  const focusSection = buildChatFocusSection(
    focusedRequirement,
    focusedFeature,
  );

  return focusSection ? `${projectContext}${focusSection}` : projectContext;
}

export async function getAllProjectsContext(
  db: Db,
  userId: ObjectId,
): Promise<string | null> {
  const projects = await db
    .collection<StoredProject>("projects")
    .find({ userId })
    .sort({ updatedAt: -1 })
    .toArray();

  if (projects.length === 0) {
    return null;
  }

  const projectContexts = await Promise.all(
    projects.map((project) => getProjectContext(db, userId, project._id)),
  );

  const sections = projectContexts
    .map((context, index) => {
      if (!context?.trim()) {
        return null;
      }

      const projectName =
        projects[index]?.name.trim() || `Project ${index + 1}`;

      return [`=== ${projectName} ===`, context.trim()].join("\n");
    })
    .filter((section): section is string => Boolean(section));

  if (sections.length === 0) {
    return null;
  }

  return sections.join("\n\n");
}
