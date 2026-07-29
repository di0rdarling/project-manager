import React from "react";
import Link from "next/link";
import { ProjectManagerLogo } from "@/components/ui/ProjectManagerLogo";
import {
  PencilSquareIcon,
  SparklesIcon as SparklesIconSolid,
} from "@heroicons/react/20/solid";
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PlusIcon,
  PuzzlePieceIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  UsersIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const primaryFeatures = [
  {
    name: "Your project, pre-structured",
    description:
      "Organise your project knowledge into consistent, structured sections. No scattered notes, no hunting for that one detail.",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Specialist AI teammates",
    description:
      "Chat with AI teammates who already know your project's full context. Get answers in seconds, make decisions with confidence.",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: "Master Unfamiliar Tech",
    description:
      "Map out new frameworks, APIs, and domain concepts directly in your workspace. Track what you know, what you're still learning, and get unstuck faster with your AI domain expert.",
    icon: BookOpenIcon,
  },
] as const;

const secondaryFeatures = [
  {
    name: "Pick up where you left off",
    description:
      "One-click AI summaries of any project or feature. Get the high-level view instantly, so you can jump back in without re-reading everything.",
    icon: SparklesIconSolid,
  },
  {
    name: "Think out loud, with context",
    description:
      "Chat with AI teammates who already know your project inside out. Get unstuck on architecture, clarify requirements, or master new tech, all in one place.",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: "Write it down, make it clear",
    description:
      "Polish, shorten, or expand your notes directly in the editor. Keep your documentation sharp without breaking your flow.",
    icon: PencilSquareIcon,
  },
] as const;

const footerNavigation = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Sign in", href: "/login" },
    { name: "Create account", href: "/signup" },
  ],
} as const;

const MOCK_PROJECT_NAME = "API Analytics Dashboard";

const MOCK_PROJECT_DESCRIPTION =
  "A developer tool that tracks API usage, performance, and errors across client applications.";

const MOCK_AI_SUMMARY =
  "An analytics platform for developers to monitor how their APIs are used in production. The core challenge is balancing real-time event ingestion with fast dashboard queries, while keeping report generation from blocking the user experience. Early focus is on a small beta group of around 50 users.";

const MOCK_AI_SUMMARY_MOBILE =
  "Core challenge: balance real-time event ingestion with fast dashboard queries, without report generation blocking the user experience.";

// ─── Hero Mockup: Project Detail Page ────────────────────────────────────────

const SIDEBAR_SECTIONS: {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  active?: boolean;
}[] = [
  { id: "overview", label: "Overview", icon: SparklesIcon },
  { id: "core-users", label: "Core Users", icon: UsersIcon },
  { id: "pain-points", label: "Pain Points", icon: ExclamationTriangleIcon },
  {
    id: "current-challenges",
    label: "Current Challenges",
    icon: ShieldExclamationIcon,
  },
  { id: "domain-knowledge", label: "Domain Knowledge", icon: BookOpenIcon },
  {
    id: "requirements",
    label: "Requirements",
    icon: ClipboardDocumentListIcon,
    active: true,
  },
  { id: "features", label: "Features", icon: PuzzlePieceIcon },
  { id: "tools", label: "Tools", icon: WrenchScrewdriverIcon },
  { id: "notes", label: "Notes", icon: DocumentTextIcon },
];

const MOCK_REQUIREMENTS = [
  "Real-time event ingestion",
  "Report generation with PDF export",
  "Usage-based rate limiting",
  "Dashboard response time under 300ms",
];

const MOCK_FEATURES = [
  {
    name: "Live usage dashboard",
    status: "in-progress",
    reqIndex: 0,
  },
  {
    name: "Scheduled & on-demand reports",
    status: "planned",
    reqIndex: 1,
  },
  {
    name: "Client API keys & quotas",
    status: "planned",
    reqIndex: 2,
  },
] as const;

function ProjectDetailMockup() {
  return (
    <div className="w-[76rem] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex h-[40rem]">
        {/* Sidebar */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <p className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-white">
              Project Manager
            </p>
            <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              {MOCK_PROJECT_NAME}
            </p>
          </div>

          <nav className="flex-1 overflow-hidden p-2.5">
            <div className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <ArrowLeftIcon className="size-4 shrink-0" aria-hidden />
              All projects
            </div>
            <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
            {SIDEBAR_SECTIONS.map(({ id, label, icon: Icon, active }) => (
              <div
                key={id}
                className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </div>
            ))}
          </nav>

          <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
            <p className="mb-2 truncate px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              you@example.com
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              <ArrowRightOnRectangleIcon className="size-4 shrink-0" aria-hidden />
              Sign out
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-white dark:bg-zinc-900">
          <div className="space-y-6 p-8">
            {/* Back link */}
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <ArrowLeftIcon className="size-4 shrink-0" aria-hidden />
              Back to projects
            </div>

            {/* Project header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {MOCK_PROJECT_NAME}
                </h2>
                <div className="mt-0.5 shrink-0 rounded p-1.5 text-zinc-400 dark:text-zinc-500">
                  <PencilIcon className="size-4" aria-hidden />
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {MOCK_PROJECT_DESCRIPTION}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Created Jun 3, 2026
              </p>
            </div>

            {/* AI Summary */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="mb-3 flex items-center gap-2">
                <SparklesIcon
                  className="size-4 shrink-0 text-indigo-500 dark:text-indigo-400"
                  aria-hidden
                />
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  AI Summary
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {MOCK_AI_SUMMARY}
              </p>
            </div>

            {/* Requirements section */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardDocumentListIcon
                    className="size-5 shrink-0 text-zinc-700 dark:text-zinc-300"
                    aria-hidden
                  />
                  <span className="text-base font-semibold text-zinc-900 dark:text-white">
                    Requirements
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {MOCK_REQUIREMENTS.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                  <PlusIcon className="size-4" aria-hidden />
                  Add
                </div>
              </div>
              <div className="space-y-2.5">
                {MOCK_REQUIREMENTS.map((req, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/20"
                  >
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {req}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features section */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PuzzlePieceIcon
                    className="size-5 shrink-0 text-zinc-700 dark:text-zinc-300"
                    aria-hidden
                  />
                  <span className="text-base font-semibold text-zinc-900 dark:text-white">
                    Features
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {MOCK_FEATURES.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                  <PlusIcon className="size-4" aria-hidden />
                  Add
                </div>
              </div>
              <div className="space-y-2.5">
                {MOCK_FEATURES.map((feat) => (
                  <div
                    key={feat.name}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        feat.status === "in-progress"
                          ? "bg-indigo-500"
                          : "bg-zinc-300 dark:bg-zinc-600"
                      }`}
                    />
                    <p className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {feat.name}
                    </p>
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                      Req {feat.reqIndex + 1}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        feat.status === "in-progress"
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {feat.status === "in-progress" ? "In Progress" : "Planned"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Purpose-built mobile rendition of the hero mockup, shown below the `sm`
 * breakpoint instead of a shrunk clone of the desktop mockup (which becomes
 * illegible once scaled down to phone width). Mirrors the same content in a
 * single-column layout matching how the real app renders on mobile.
 */
function ProjectDetailMockupMobile() {
  return (
    <div className="w-[20rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/10">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Bars3Icon className="size-5 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
        <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
          Project Manager
        </p>
      </div>

      <div className="space-y-5 p-4">
        {/* Back link */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <ArrowLeftIcon className="size-3.5 shrink-0" aria-hidden />
          Back to projects
        </div>

        {/* Project header */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              {MOCK_PROJECT_NAME}
            </h2>
            <PencilIcon
              className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
              aria-hidden
            />
          </div>
          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {MOCK_PROJECT_DESCRIPTION}
          </p>
        </div>

        {/* AI Summary */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="mb-2 flex items-center gap-1.5">
            <SparklesIcon
              className="size-3.5 shrink-0 text-indigo-500 dark:text-indigo-400"
              aria-hidden
            />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              AI Summary
            </span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {MOCK_AI_SUMMARY_MOBILE}
          </p>
        </div>

        {/* Requirements section (condensed) */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ClipboardDocumentListIcon
                className="size-4 shrink-0 text-zinc-700 dark:text-zinc-300"
                aria-hidden
              />
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                Requirements
              </span>
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {MOCK_REQUIREMENTS.length}
              </span>
            </div>
            <PlusIcon
              className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
              aria-hidden
            />
          </div>
          <div className="space-y-2">
            {MOCK_REQUIREMENTS.slice(0, 2).map((req, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/20"
              >
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {req}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Features section (condensed) */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PuzzlePieceIcon
                className="size-4 shrink-0 text-zinc-700 dark:text-zinc-300"
                aria-hidden
              />
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                Features
              </span>
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {MOCK_FEATURES.length}
              </span>
            </div>
            <PlusIcon
              className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
              aria-hidden
            />
          </div>
          <div className="space-y-2">
            {MOCK_FEATURES.slice(0, 2).map((feat) => (
              <div
                key={feat.name}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${
                    feat.status === "in-progress"
                      ? "bg-indigo-500"
                      : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
                <p className="flex-1 truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {feat.name}
                </p>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                    feat.status === "in-progress"
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {feat.status === "in-progress" ? "In Progress" : "Planned"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Secondary Mockup: AI Chats Detail ───────────────────────────────────────

const MAIN_NAV = [
  { label: "Home", icon: HomeIcon, active: false },
  { label: "AI Chats", icon: ChatBubbleLeftRightIcon, active: true },
  { label: "Account", icon: UserCircleIcon, active: false },
] as const;

const ARLO_AGENT = {
  initials: "AR",
  color: "bg-sky-600 dark:bg-sky-500",
  name: "Arlo",
} as const;

const MOCK_CHATS = [
  {
    id: 1,
    title: "Report generation approach",
    project: MOCK_PROJECT_NAME,
    ago: "3m ago",
    active: true,
  },
  {
    id: 2,
    title: "Sprint prioritization",
    project: MOCK_PROJECT_NAME,
    ago: "Yesterday",
    active: false,
  },
  {
    id: 3,
    title: "Architecture review",
    project: "Mobile App Rewrite",
    ago: "Jul 9",
    active: false,
  },
  {
    id: 4,
    title: "Onboarding copy audit",
    project: MOCK_PROJECT_NAME,
    ago: "Jul 7",
    active: false,
  },
] as const;

const MOCK_MESSAGES = [
  {
    id: 1,
    role: "user" as const,
    text: "Not sure if I should add a queue for the report generation or just run it inline. Reports take about 30 seconds to build.",
  },
  {
    id: 2,
    role: "agent" as const,
    agent: ARLO_AGENT,
    text: "Given your current stack, inline will hurt. Your requirements say users trigger reports from the dashboard, so a 30s block means timeouts and a frozen UI. A queue lets you respond instantly and notify when it's done.\n\nWith your expected volume (you noted ~50 users), something lightweight like BullMQ on Redis is enough. No need for Kafka yet.",
  },
  {
    id: 3,
    role: "user" as const,
    text: "Yeah, I was worried about overengineering it. BullMQ sounds right.",
  },
  {
    id: 4,
    role: "agent" as const,
    agent: ARLO_AGENT,
    text: "Worth capturing this as a decision in your project notes. Want me to draft it? Context, options considered, and why you chose the queue, so future-you remembers the reasoning.",
  },
] as const;

const MOCK_TEAMMATES = [
  { initials: "JO", color: "bg-emerald-600 dark:bg-emerald-500", name: "Jordan" },
  { initials: "SA", color: "bg-violet-600 dark:bg-violet-500", name: "Sandy" },
  { initials: "AR", color: "bg-sky-600 dark:bg-sky-500", name: "Arlo" },
  { initials: "RE", color: "bg-teal-600 dark:bg-teal-500", name: "Reid" },
  { initials: "NO", color: "bg-rose-600 dark:bg-rose-500", name: "Nova" },
  { initials: "TH", color: "bg-amber-600 dark:bg-amber-500", name: "Theo" },
] as const;

function AIChatsDetailMockup() {
  return (
    <div className="w-[60rem] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex h-[40rem]">
        {/* Sidebar */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <p className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-white">
              Project Manager
            </p>
          </div>

          <nav className="flex-1 overflow-hidden p-2.5">
            {MAIN_NAV.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                  active
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </div>
            ))}
          </nav>

          <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
            <p className="mb-2 truncate px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              you@example.com
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              <ArrowRightOnRectangleIcon className="size-4 shrink-0" aria-hidden />
              Sign out
            </div>
          </div>
        </aside>

        {/* Chats list panel */}
        <div className="flex w-72 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              AI Chats
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Your conversations with AI teammates
            </p>
          </div>

          {/* Teammate cards */}
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Teammates
            </p>
            <div className="flex flex-wrap gap-3">
              {MOCK_TEAMMATES.map(({ initials, color, name }) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <div
                    className={`flex size-9 items-center justify-center rounded-full text-[10px] font-bold text-white ${color}`}
                  >
                    {initials}
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat entries */}
          <div className="flex-1 overflow-hidden p-2.5">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Active
            </p>
            {MOCK_CHATS.map((chat) => (
              <div
                key={chat.id}
                className={`mb-1 rounded-lg px-3 py-2.5 ${
                  chat.active
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p
                    className={`text-xs font-medium leading-tight ${
                      chat.active
                        ? "text-zinc-900 dark:text-zinc-50"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {chat.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">
                    {chat.ago}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {chat.project}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
              <PlusIcon className="size-4" aria-hidden />
              New chat
            </div>
          </div>
        </div>

        {/* Chat detail */}
        <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-zinc-900">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white dark:bg-sky-500">
              AR
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                Report generation approach
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Arlo · Solution Architect · {MOCK_PROJECT_NAME}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {MOCK_MESSAGES.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "items-start gap-3"}`}
              >
                {msg.role === "agent" && (
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${msg.agent.color}`}
                  >
                    {msg.agent.initials}
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {msg.role === "agent" && (
                    <p className="mb-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {msg.agent.name}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="flex-1 text-sm text-zinc-400 dark:text-zinc-500">
                Ask Arlo anything about report generation...
              </p>
              <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white">
                <PaperAirplaneIcon className="size-3.5 text-white dark:text-zinc-900" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Purpose-built mobile rendition of the AI Chats mockup, shown below the `sm`
 * breakpoint instead of a shrunk clone of the desktop mockup. Focuses on the
 * active chat detail — the single most compelling view on a phone-sized
 * screen — matching how the real app renders a chat on mobile.
 */
function AIChatsDetailMockupMobile() {
  return (
    <div className="w-[20rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/10">
      {/* Chat header */}
      <div className="flex items-center gap-2.5 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <ArrowLeftIcon
          className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400"
          aria-hidden
        />
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white dark:bg-sky-500">
          AR
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
            Report generation approach
          </p>
          <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            Arlo · {MOCK_PROJECT_NAME}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 px-4 py-4">
        {MOCK_MESSAGES.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "items-start gap-2"}`}
          >
            {msg.role === "agent" && (
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${msg.agent.color}`}
              >
                {msg.agent.initials}
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 ${
                msg.role === "user"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <p className="text-xs leading-relaxed whitespace-pre-line">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="flex-1 truncate text-xs text-zinc-400 dark:text-zinc-500">
            Ask Arlo anything...
          </p>
          <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white">
            <PaperAirplaneIcon
              className="size-3 text-white dark:text-zinc-900"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Background decorations ───────────────────────────────────────────────────

function BackgroundGrid() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 -z-10 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-gray-200 dark:stroke-white/10"
    >
      <defs>
        <pattern
          x="50%"
          y={-1}
          id="landing-grid-pattern"
          width={200}
          height={200}
          patternUnits="userSpaceOnUse"
        >
          <path d="M.5 200V.5H200" fill="none" />
        </pattern>
      </defs>
      <svg x="50%" y={-1} className="overflow-visible fill-gray-50 dark:fill-gray-800/20">
        <path
          d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
          strokeWidth={0}
        />
      </svg>
      <rect fill="url(#landing-grid-pattern)" width="100%" height="100%" strokeWidth={0} />
    </svg>
  );
}

function GradientBlob({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <div
        style={{
          clipPath:
            "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
        }}
        className="aspect-1108/632 w-277 flex-none bg-linear-to-r from-[#80caff] to-[#4f46e5] opacity-20"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="h-dvh overflow-y-auto bg-white dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-zinc-950/80">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <ProjectManagerLogo className="h-9 w-auto" />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/waitlist"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Join the Waitlist
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero section */}
        <div className="relative isolate overflow-hidden">
          <BackgroundGrid />
          <GradientBlob className="absolute top-10 left-[calc(50%-4rem)] -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:top-[calc(50%-30rem)] lg:left-48 xl:left-[calc(50%-24rem)]" />

          <div className="mx-auto max-w-7xl px-6 pt-6 pb-10 sm:pt-10 lg:flex">
            <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:pt-8">
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:mt-32 sm:text-7xl lg:mt-16 dark:text-white">
                A second brain for your software projects.
              </h1>
              <p className="mt-5 text-lg font-medium text-pretty text-gray-500 sm:mt-8 sm:text-xl/8 dark:text-gray-400">
                Pre-built, not pieced together. Structured project docs and AI
                teammates who already know your project, so you can spend your
                time thinking, not organising.
              </p>
              <div className="mt-6 sm:mt-10">
                <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Beta opens soon, join the waitlist for early access.
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <Link
                    href="/waitlist"
                    className="rounded-md bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus-visible:outline-white"
                  >
                    Join the Waitlist
                  </Link>
                  <a
                    href="#features"
                    className="text-sm/6 font-semibold text-gray-900 dark:text-white"
                  >
                    See how it works <span aria-hidden="true">↓</span>
                  </a>
                </div>
              </div>
            </div>
            {/* Hero mockup. Below `sm` we show a purpose-built, full-size mobile
                mockup instead of shrinking the desktop version (which becomes
                illegible at phone widths). From `sm` up, the desktop mockup is
                scaled down via `zoom` to fit, then reverts to full size at `lg`
                and intentionally overflows right like a product screenshot
                bleeding off the edge. */}
            <div className="mx-auto mt-8 flex max-w-2xl justify-center sm:mt-24 lg:mt-0 lg:mr-0 lg:ml-10 lg:max-w-none lg:flex-none lg:justify-start xl:ml-32">
              <div className="sm:hidden">
                <ProjectDetailMockupMobile />
              </div>
              <div className="hidden sm:block sm:[zoom:0.4] md:[zoom:0.52] lg:[zoom:1]">
                <ProjectDetailMockup />
              </div>
            </div>
          </div>
        </div>

        {/* Primary feature section */}
        <div id="features" className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base/7 font-semibold text-zinc-500 dark:text-zinc-400">
              End the chaos
            </h2>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance dark:text-white">
              All your project intelligence, in one place.
            </p>
            <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-300">
              No more scattered notes and overwhelming information. Your
              project&apos;s requirements, features, tools, and AI
              conversations stay connected, so you always have the clarity
              you need.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {primaryFeatures.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="text-base/7 font-semibold text-gray-900 dark:text-white">
                    <div className="mb-6 flex size-10 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50">
                      <feature.icon
                        aria-hidden="true"
                        className="size-6 text-white dark:text-zinc-900"
                      />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base/7 text-gray-600 dark:text-gray-400">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Secondary feature section */}
        <div className="mt-32 sm:mt-56">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl sm:text-center">
              <h2 className="text-base/7 font-semibold text-zinc-500 dark:text-zinc-400">
                Built for how you think
              </h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl sm:text-balance dark:text-white">
                Your dedicated space for structured problem-solving.
              </p>
              <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-300">
                The same intelligent building blocks for every project, so you
                can focus on the work, not the setup.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden pt-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mb-10 flex justify-center sm:mb-[-12%] lg:justify-start">
                <div className="sm:hidden">
                  <AIChatsDetailMockupMobile />
                </div>
                <div className="hidden sm:block sm:[zoom:0.45] md:[zoom:0.6] lg:[zoom:1]">
                  <AIChatsDetailMockup />
                </div>
              </div>
              <div aria-hidden="true" className="relative hidden sm:block">
                <div className="absolute -inset-x-20 bottom-0 bg-linear-to-t from-white pt-[7%] dark:from-zinc-950" />
              </div>
            </div>
          </div>
          <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24 lg:px-8">
            <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base/7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 dark:text-gray-400">
              {secondaryFeatures.map((feature) => (
                <div key={feature.name} className="relative pl-9">
                  <dt className="inline font-semibold text-gray-900 dark:text-white">
                    <feature.icon
                      aria-hidden="true"
                      className="absolute top-1 left-1 size-5 text-zinc-700 dark:text-zinc-400"
                    />
                    {feature.name}
                  </dt>{" "}
                  <dd className="inline">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* CTA section */}
        <div className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8">
          <BackgroundGrid />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          >
            <div
              style={{
                clipPath:
                  "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
              }}
              className="aspect-1108/632 w-277 flex-none bg-linear-to-r from-[#80caff] to-[#4f46e5] opacity-20"
            />
          </div>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-balance text-gray-900 sm:text-5xl dark:text-white">
              Your next project deserves a second brain.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg/8 text-pretty text-gray-600 dark:text-gray-300">
              Join the waitlist and be one of the first developers through the
              door when beta opens.
            </p>
            <div className="mt-10">
              <Link
                href="/waitlist"
                className="rounded-md bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:shadow-none dark:hover:bg-zinc-100 dark:focus-visible:outline-white"
              >
                Join the Waitlist
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="border-t border-gray-200 py-12 dark:border-white/10">
          <div>
            <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">
              Product
            </h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-12 text-sm/6 text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Project Manager. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
