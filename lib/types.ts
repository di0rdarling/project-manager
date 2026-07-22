import type { ObjectId } from "mongodb";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

type UserBase<TId> = {
  _id: TId;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export type User = UserBase<ObjectId>;
export type UserResponse = Omit<UserBase<string>, "passwordHash">;

type ProjectBase<TId> = {
  _id: TId;
  userId: TId;
  name: string;
  description: string;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Project = ProjectBase<ObjectId>;
export type ProjectResponse = ProjectBase<string>;

type NoteBase<TId> = {
  _id: TId;
  userId: TId;
  projectId: TId;
  featureId: TId | null;
  folderId: TId | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Note = NoteBase<ObjectId>;
export type NoteResponse = NoteBase<string>;

type NoteFolderBase<TId> = {
  _id: TId;
  userId: TId;
  projectId: TId;
  featureId: TId | null;
  parentFolderId: TId | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteFolder = NoteFolderBase<ObjectId>;
export type NoteFolderResponse = NoteFolderBase<string>;

type AgentNoteBase<TId> = {
  _id: TId;
  userId: TId;
  teammateId: ChatTeammateId;
  sharedWithTeammateIds: ChatTeammateId[];
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentNote = AgentNoteBase<ObjectId>;
export type AgentNoteResponse = AgentNoteBase<string>;

export type AgentDocumentStatus =
  | "ready_for_review"
  | "in_review"
  | "accepted";

type AgentDocumentBase<TId> = {
  _id: TId;
  userId: TId;
  teammateId: ChatTeammateId;
  projectId: TId;
  /** Denormalized for list display; populated by the API when available. */
  projectName?: string;
  title: string;
  content: string;
  status: AgentDocumentStatus;
  createdAt: string;
  updatedAt: string;
};

export type AgentDocument = AgentDocumentBase<ObjectId>;
export type AgentDocumentResponse = AgentDocumentBase<string>;

type PainPointBase<TId> = {
  _id: TId;
  userId: TId;
  projectId: TId;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PainPoint = PainPointBase<ObjectId>;
export type PainPointResponse = PainPointBase<string>;

export type ChallengeStatus = "open" | "in_progress" | "resolved";

type ChallengeBase<TId> = {
  _id: TId;
  userId: TId;
  projectId: TId;
  featureId: TId | null;
  title: string;
  overview: string;
  status: ChallengeStatus;
  createdAt: string;
  updatedAt: string;
};

export type Challenge = ChallengeBase<ObjectId>;
export type ChallengeResponse = ChallengeBase<string>;

export type RequirementPriority = "must_have" | "should_have" | "could_have";

type RequirementBase<TId> = {
  _id: TId;
  userId: TId;
  projectId: TId;
  title: string;
  content: string;
  priority: RequirementPriority | null;
  createdAt: string;
  updatedAt: string;
};

export type Requirement = RequirementBase<ObjectId>;
export type RequirementResponse = RequirementBase<string>;

type FeatureBase<TId> = {
  _id: TId;
  userId: TId;
  projectId: TId;
  title: string;
  content: string;
  requirementIds: TId[];
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Feature = FeatureBase<ObjectId>;
export type FeatureResponse = FeatureBase<string>;

type ToolBase<TId> = {
  _id: TId;
  userId: TId;
  projectId: TId;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Tool = ToolBase<ObjectId>;
export type ToolResponse = ToolBase<string>;

type CoreUserBase<TId> = {
  _id: TId;
  userId: TId;
  projectId: TId;
  name: string;
  role: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CoreUser = CoreUserBase<ObjectId>;
export type CoreUserResponse = CoreUserBase<string>;

export type DomainKnowledgeConfidenceLevel =
  | "novice"
  | "learning"
  | "comfortable";

type DomainKnowledgeBase<TId> = {
  _id: TId;
  userId: TId;
  projectId: TId;
  featureId: TId | null;
  name: string;
  currentUnderstanding: string;
  openQuestions: string;
  confidenceLevel: DomainKnowledgeConfidenceLevel | null;
  createdAt: string;
  updatedAt: string;
};

export type DomainKnowledge = DomainKnowledgeBase<ObjectId>;
export type DomainKnowledgeResponse = DomainKnowledgeBase<string>;

export type ProjectContentItem = {
  _id: string;
  title?: string;
  name?: string;
  role?: string;
  content: string;
  createdAt: string;
};

export type ChatMessageRole = "user" | "model";

export type ChatGroundingSource = {
  title?: string;
  uri?: string;
};

type ChatMessageBase<TId> = {
  _id: TId;
  userId: TId;
  chatId: TId;
  role: ChatMessageRole;
  content: string;
  sources?: ChatGroundingSource[];
  webSearchQueries?: string[];
  searchSuggestionsHtml?: string;
  createdAt: string;
};

export type ChatMessage = ChatMessageBase<ObjectId>;
export type ChatMessageResponse = ChatMessageBase<string>;

type ChatBase<TId> = {
  _id: TId;
  userId: TId;
  projectId: TId | null;
  requirementId: TId | null;
  featureId: TId | null;
  teammateId: ChatTeammateId;
  modelId: ChatModelId;
  title: string;
  titleIsCustom: boolean;
  aiTitleGenerated: boolean;
  conversationSummary: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Chat = ChatBase<ObjectId>;
export type ChatResponse = ChatBase<string>;

export type ChatListItemResponse = ChatResponse & {
  project: { _id: string; name: string } | null;
  requirement: { _id: string; title: string } | null;
  feature: { _id: string; title: string } | null;
};

export type ChatContextUsageCategoryKey =
  | "systemPrompt"
  | "agentMemory"
  | "sharedMemory"
  | "projectContext"
  | "conversation";

export type ChatContextUsageCategory = {
  key: ChatContextUsageCategoryKey;
  label: string;
  tokens: number;
};

export type ChatContextUsage = {
  usedTokens: number;
  limitTokens: number;
  isAtLimit: boolean;
  breakdown: ChatContextUsageCategory[];
};

export type ChatWithMessagesResponse = ChatListItemResponse & {
  messages: ChatMessageResponse[];
  contextUsage: ChatContextUsage;
};

export type SendChatMessageResponse = {
  chat: ChatResponse;
  userMessage: ChatMessageResponse;
  assistantMessage: ChatMessageResponse;
  contextUsage: ChatContextUsage;
};

export type AgentMemoryResponse = {
  teammateId: ChatTeammateId;
  memory: string | null;
  updatedAt: string | null;
};

export type UserMemoryResponse = {
  teammateId: ChatTeammateId;
  mostRecently: string | null;
  stableContext: string[];
  updatedAt: string | null;
};

export type AgentTaskOutputFormat = "note" | "document";

export type AgentTaskStatus = "pending" | "accepted" | "rejected";

/**
 * Lifecycle of the agent actually carrying out an accepted task.
 * "not_started" is the default (including for tasks with no outputStatus
 * stored at all); "completed" means the deliverable fields below are
 * populated and ready for the user to review.
 */
export type AgentTaskOutputStatus = "not_started" | "completed";

export type AgentTask = {
  title: string;
  detail: string;
  /** Why the agent is suggesting this task now, grounded in project context. */
  rationale: string;
  /** What becomes true or improves if this task gets done. */
  impact: string;
  /** What happens, or continues to be a gap, if this task is skipped. */
  riskIfSkipped: string;
  /** Deliverable type — typically a new note; document for longer structured output. */
  outputFormat: AgentTaskOutputFormat;
  /** What the agent intends to put in the deliverable and what purpose it serves. */
  outputDescription: string;
  /** User decision on whether the agent should run this task autonomously. */
  status?: AgentTaskStatus;
  /** Project this task was suggested for. */
  projectName?: string;
  /** Whether the agent has produced output for this (accepted) task yet. */
  outputStatus?: AgentTaskOutputStatus;
  /** The actual note/document content the agent produced. */
  outputContent?: string;
  /** How the agent tackled the task — their approach and reasoning. */
  outputApproach?: string;
  /** What is now true/unblocked in the project because this work is done. */
  outputCompletionSummary?: string;
};

export type AgentTasksResponse = {
  teammateId: ChatTeammateId;
  projectId: string;
  projectName: string | null;
  tasks: AgentTask[];
  updatedAt: string | null;
};
