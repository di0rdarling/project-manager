export const CHAT_TEAMMATE_IDS = ["general", "sandy", "theo"] as const;

export type ChatTeammateId = (typeof CHAT_TEAMMATE_IDS)[number];

export type ChatTeammate = {
  id: ChatTeammateId;
  name: string;
  role: string;
  description: string;
  avatarInitials: string;
  avatarImageSrc?: string;
  avatarColorClassName: string;
};

export const DEFAULT_CHAT_TEAMMATE_ID: ChatTeammateId = "general";

export const CHAT_TEAMMATES: ChatTeammate[] = [
  {
    id: "general",
    name: "General Assistant",
    role: "Default AI Assistant",
    description: "A helpful all-purpose assistant for any project question.",
    avatarInitials: "AI",
    avatarColorClassName: "bg-zinc-700 dark:bg-zinc-600",
  },
  {
    id: "sandy",
    name: "Sandy",
    role: "Business Analyst",
    description:
      "Digs into requirements, users, and priorities like a business analyst.",
    avatarInitials: "SA",
    avatarImageSrc: "/sandy_2.png",
    avatarColorClassName: "bg-violet-600 dark:bg-violet-500",
  },
  {
    id: "theo",
    name: "Theo",
    role: "Domain Expert",
    description:
      "Helps you deeply understand the domain — terminology, concepts, pitfalls, and the context experienced practitioners know.",
    avatarInitials: "TH",
    avatarImageSrc: "/theo.png",
    avatarColorClassName: "bg-amber-600 dark:bg-amber-500",
  },
];

export function isChatTeammateId(value: unknown): value is ChatTeammateId {
  return (
    typeof value === "string" &&
    CHAT_TEAMMATE_IDS.includes(value as ChatTeammateId)
  );
}

export function getChatTeammate(id: string | null | undefined): ChatTeammate {
  return (
    CHAT_TEAMMATES.find((teammate) => teammate.id === id) ?? CHAT_TEAMMATES[0]
  );
}
