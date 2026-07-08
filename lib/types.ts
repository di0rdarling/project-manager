import type { ObjectId } from "mongodb";
import type { ChatTeammateId } from "@/lib/chat-teammates";

type ProjectBase<TId> = {
  _id: TId;
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
  projectId: TId;
  featureId: TId | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Note = NoteBase<ObjectId>;
export type NoteResponse = NoteBase<string>;

type PainPointBase<TId> = {
  _id: TId;
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

type RequirementBase<TId> = {
  _id: TId;
  projectId: TId;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Requirement = RequirementBase<ObjectId>;
export type RequirementResponse = RequirementBase<string>;

type FeatureBase<TId> = {
  _id: TId;
  projectId: TId;
  title: string;
  content: string;
  requirementId: TId | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Feature = FeatureBase<ObjectId>;
export type FeatureResponse = FeatureBase<string>;

type ToolBase<TId> = {
  _id: TId;
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
  projectId: TId | null;
  requirementId: TId | null;
  featureId: TId | null;
  teammateId: ChatTeammateId;
  title: string;
  conversationSummary: string | null;
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

export type ChatWithMessagesResponse = ChatResponse & {
  messages: ChatMessageResponse[];
};

export type SendChatMessageResponse = {
  chat: ChatResponse;
  userMessage: ChatMessageResponse;
  assistantMessage: ChatMessageResponse;
};

export type AgentMemoryResponse = {
  teammateId: ChatTeammateId;
  memory: string | null;
  updatedAt: string | null;
};
