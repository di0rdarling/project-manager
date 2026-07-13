import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { generateProjectSummary } from "@/lib/gemini";
import { featureChallengesFilter } from "@/lib/challenges";
import { featureNotesFilter } from "@/lib/notes";
import {
  featureDomainKnowledgeFilter,
  parseConfidenceLevel,
} from "@/lib/domain-knowledge";
import { getStoredRequirementIds } from "@/lib/feature-requirements";
import { buildFeatureSummaryPrompt } from "@/lib/prompts/feature-summary-prompt";
import {
  serializeFeature,
  type StoredFeature,
} from "@/lib/serialize/serialize-feature";
import type { StoredProject } from "@/lib/serialize/serialize-project";
import type { Challenge, DomainKnowledge, Note, Requirement } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; featureId: string }>;
};

type StoredRequirement = Omit<
  Requirement,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: Requirement["_id"];
  projectId: Requirement["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredNote = Omit<Note, "_id" | "projectId" | "createdAt" | "updatedAt"> & {
  _id: Note["_id"];
  projectId: Note["projectId"];
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

type StoredDomainKnowledge = Omit<
  DomainKnowledge,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: DomainKnowledge["_id"];
  projectId: DomainKnowledge["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function hasSavedSummary(feature: StoredFeature): boolean {
  return (
    typeof feature.aiSummary === "string" && feature.aiSummary.trim().length > 0
  );
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, featureId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(featureId)) {
      return Response.json({ error: "Invalid feature id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectObjectId = new ObjectId(id);
    const featureObjectId = new ObjectId(featureId);

    const [project, feature] = await Promise.all([
      db
        .collection<StoredProject>("projects")
        .findOne({ _id: projectObjectId, userId: auth.userId }),
      db.collection<StoredFeature>("features").findOne({
        _id: featureObjectId,
        projectId: projectObjectId,
        userId: auth.userId,
      }),
    ]);

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (!feature) {
      return Response.json({ error: "Feature not found" }, { status: 404 });
    }

    const requirementIds = getStoredRequirementIds(feature);

    const [linkedRequirements, domainKnowledge, challenges, notes] =
      await Promise.all([
      requirementIds.length > 0
        ? db
            .collection<StoredRequirement>("requirements")
            .find({
              _id: { $in: requirementIds },
              projectId: projectObjectId,
            })
            .toArray()
        : Promise.resolve([]),
      db
        .collection<StoredDomainKnowledge>("domainKnowledge")
        .find(featureDomainKnowledgeFilter(projectObjectId, featureObjectId))
        .sort({ createdAt: -1 })
        .toArray(),
      db
        .collection<StoredChallenge>("challenges")
        .find(featureChallengesFilter(projectObjectId, featureObjectId))
        .sort({ createdAt: -1 })
        .toArray(),
      db
        .collection<StoredNote>("notes")
        .find(featureNotesFilter(projectObjectId, featureObjectId))
        .sort({ createdAt: -1 })
        .toArray(),
    ]);

    const prompt = buildFeatureSummaryPrompt({
      projectName: project.name,
      projectDescription: project.description,
      title: feature.title,
      content: feature.content,
      linkedRequirements: linkedRequirements.map((requirement) => ({
        title: requirement.title,
        content: requirement.content,
      })),
      domainKnowledge: domainKnowledge.map((item) => ({
        name: item.name,
        currentUnderstanding: item.currentUnderstanding,
        openQuestions: item.openQuestions,
        confidenceLevel: parseConfidenceLevel(item.confidenceLevel),
      })),
      challenges: challenges.map((challenge) => ({
        title: challenge.title,
        overview: challenge.overview,
        status: challenge.status,
      })),
      notes: notes.map((note) => ({
        title: note.title,
        content: note.content,
      })),
    });

    const aiSummary = await generateProjectSummary(prompt);
    const updatedAt = new Date().toISOString();

    const updateResult = await db.collection<StoredFeature>("features").updateOne(
      { _id: featureObjectId, projectId: projectObjectId, userId: auth.userId },
      {
        $set: {
          aiSummary,
          updatedAt,
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return Response.json({ error: "Feature not found" }, { status: 404 });
    }

    const savedFeature = await db
      .collection<StoredFeature>("features")
      .findOne({ _id: featureObjectId, projectId: projectObjectId, userId: auth.userId });

    if (!savedFeature || !hasSavedSummary(savedFeature)) {
      return Response.json(
        { error: "Failed to save feature summary" },
        { status: 500 },
      );
    }

    return Response.json(serializeFeature(savedFeature));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI summary generation is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to generate feature summary" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, featureId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(featureId)) {
      return Response.json({ error: "Invalid feature id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectObjectId = new ObjectId(id);
    const featureObjectId = new ObjectId(featureId);

    const updateResult = await db.collection<StoredFeature>("features").updateOne(
      { _id: featureObjectId, projectId: projectObjectId, userId: auth.userId },
      {
        $set: {
          aiSummary: null,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return Response.json({ error: "Feature not found" }, { status: 404 });
    }

    const savedFeature = await db
      .collection<StoredFeature>("features")
      .findOne({ _id: featureObjectId, projectId: projectObjectId, userId: auth.userId });

    if (!savedFeature) {
      return Response.json({ error: "Feature not found" }, { status: 404 });
    }

    return Response.json(serializeFeature(savedFeature));
  } catch {
    return Response.json(
      { error: "Failed to delete feature summary" },
      { status: 500 },
    );
  }
}
