import Link from "next/link";
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
  ServerIcon,
} from "@heroicons/react/20/solid";
import {
  BoltIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const primaryFeatures = [
  {
    name: "Structured project workspaces",
    description:
      "Requirements, features, tools, and notes all live in one place, organized into the same clear sections for every project you run.",
    href: "#features",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "AI teammates",
    description:
      "Chat with agents that already understand your project's context, so you spend less time re-explaining and more time deciding.",
    href: "#features",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: "Shared context",
    description:
      "Core users, pain points, domain knowledge, and current challenges stay visible to the whole team, not buried in someone's notes.",
    href: "#features",
    icon: BookOpenIcon,
  },
] as const;

const secondaryFeatures = [
  {
    name: "Instant setup.",
    description:
      "Create a project and start capturing context immediately. No configuration required.",
    icon: CloudArrowUpIcon,
  },
  {
    name: "Private by default.",
    description:
      "Every account keeps its own projects and conversations, protected behind a signed-in session.",
    icon: LockClosedIcon,
  },
  {
    name: "Always in sync.",
    description:
      "Notes, requirements, and features update in real time as your team works, no manual refresh needed.",
    icon: ArrowPathIcon,
  },
  {
    name: "Archive, don't lose.",
    description:
      "Wrap up an AI chat without losing it. Archived conversations stay one click away when you need them again.",
    icon: ArchiveBoxIcon,
  },
  {
    name: "Built for how you work.",
    description:
      "Track pain points, current challenges, and tool evaluations right alongside your requirements.",
    icon: Cog6ToothIcon,
  },
  {
    name: "Reliable storage.",
    description:
      "Backed by MongoDB-powered storage, so your project data stays put and stays yours.",
    icon: ServerIcon,
  },
] as const;

const stats = [
  { id: 1, name: "Structured sections per project", value: "9" },
  { id: 2, name: "AI teammates on call", value: "24/7" },
  { id: 3, name: "Context lost between tools", value: "0" },
  { id: 4, name: "Your data, your projects", value: "100%" },
] as const;

const footerNavigation = {
  product: [
    { name: "Features", href: "#features" },
    { name: "AI teammates", href: "#features" },
    { name: "Sign in", href: "/login" },
    { name: "Create account", href: "/signup" },
  ],
  company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
  ],
  legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
  ],
} as const;

function AppPreviewMockup() {
  const sections = [
    { label: "Overview", icon: SparklesIcon, active: false },
    { label: "Requirements", icon: ClipboardDocumentListIcon, active: true },
    { label: "Features", icon: PuzzlePieceIcon, active: false },
    { label: "Notes", icon: DocumentTextIcon, active: false },
  ];

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/10">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <p className="ml-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Acme Onboarding Redesign
        </p>
      </div>
      <div className="flex">
        <div className="w-32 shrink-0 border-r border-zinc-200 p-3 dark:border-zinc-800">
          {sections.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium ${
                active
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 space-y-3 p-4">
          <div className="h-2.5 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-2.5 w-1/2 rounded-full bg-zinc-100 dark:bg-zinc-900" />
          <div className="mt-4 space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
              <div className="h-2 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
              <div className="h-2 w-1/2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-zinc-900 p-3 dark:bg-zinc-100">
            <ChatBubbleLeftRightIcon
              className="mt-0.5 size-4 shrink-0 text-zinc-300 dark:text-zinc-600"
              aria-hidden
            />
            <div className="space-y-1.5">
              <div className="h-2 w-40 rounded-full bg-zinc-700 dark:bg-zinc-300" />
              <div className="h-2 w-28 rounded-full bg-zinc-700 dark:bg-zinc-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundGrid() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 -z-10 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-zinc-200 dark:stroke-white/10"
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
      <svg x="50%" y={-1} className="overflow-visible fill-zinc-50 dark:fill-zinc-800/20">
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
        className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-zinc-400 to-zinc-600 opacity-20 dark:from-zinc-600 dark:to-zinc-400 dark:opacity-10"
      />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-y-auto bg-white dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
            Project Manager
          </p>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero section */}
        <div className="relative isolate overflow-hidden">
          <BackgroundGrid />
          <GradientBlob className="absolute top-10 left-[calc(50%-4rem)] -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:top-[calc(50%-30rem)] lg:left-48 xl:left-[calc(50%-24rem)]" />

          <div className="mx-auto max-w-7xl px-6 pt-10 pb-24 sm:pb-32 lg:flex lg:px-8 lg:py-40">
            <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:pt-8">
              <div>
                <a href="#features" className="inline-flex space-x-6">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm/6 font-semibold text-zinc-700 ring-1 ring-inset ring-zinc-900/10 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/20">
                    What&apos;s new
                  </span>
                  <span className="inline-flex items-center space-x-2 text-sm/6 font-medium text-zinc-600 dark:text-zinc-300">
                    <span>AI teammates just shipped</span>
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-5 text-zinc-400 dark:text-zinc-500"
                    />
                  </span>
                </a>
              </div>
              <h1 className="mt-10 text-5xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-7xl dark:text-white">
                Plan, document, and ship with clarity
              </h1>
              <p className="mt-8 text-lg font-medium text-pretty text-zinc-500 sm:text-xl/8 dark:text-zinc-400">
                Project Manager helps teams capture product context, collaborate
                with AI teammates, and move from idea to delivery without losing
                the thread.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link
                  href="/signup"
                  className="rounded-md bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus-visible:outline-white"
                >
                  Get started
                </Link>
                <a
                  href="#features"
                  className="text-sm/6 font-semibold text-zinc-900 dark:text-white"
                >
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <div className="mx-auto mt-16 flex max-w-2xl justify-center sm:mt-24 lg:mt-0 lg:mr-0 lg:ml-10 lg:max-w-none lg:flex-none xl:ml-32">
              <AppPreviewMockup />
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div id="features" className="mx-auto mt-16 max-w-7xl px-6 sm:mt-24 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base/7 font-semibold text-zinc-500 dark:text-zinc-400">
              Everything in one place
            </h2>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-5xl lg:text-balance dark:text-white">
              Everything you need to run a project
            </p>
            <p className="mt-6 text-lg/8 text-zinc-600 dark:text-zinc-300">
              No more scattered docs and stale context. Requirements, features,
              tools, and conversations stay connected from day one.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {primaryFeatures.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="text-base/7 font-semibold text-zinc-900 dark:text-white">
                    <div className="mb-6 flex size-10 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white">
                      <feature.icon
                        aria-hidden="true"
                        className="size-6 text-white dark:text-zinc-900"
                      />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base/7 text-zinc-600 dark:text-zinc-400">
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
                Built for how teams actually work
              </h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-5xl sm:text-balance dark:text-white">
                No extra tools required
              </p>
              <p className="mt-6 text-lg/8 text-zinc-600 dark:text-zinc-300">
                Every project comes with the same set of building blocks, so
                nothing important slips through the cracks.
              </p>
            </div>
          </div>
          <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24 lg:px-8">
            <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base/7 text-zinc-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 dark:text-zinc-400">
              {secondaryFeatures.map((feature) => (
                <div key={feature.name} className="relative pl-9">
                  <dt className="inline font-semibold text-zinc-900 dark:text-white">
                    <feature.icon
                      aria-hidden="true"
                      className="absolute top-1 left-1 size-5 text-zinc-500 dark:text-zinc-400"
                    />
                    {feature.name}
                  </dt>{" "}
                  <dd className="inline">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
            <h2 className="text-base/8 font-semibold text-zinc-500 dark:text-zinc-400">
              Why teams choose us
            </h2>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-5xl dark:text-white">
              Built to keep your project&nbsp;organized
            </p>
            <p className="mt-6 text-lg/8 text-zinc-700 dark:text-zinc-300">
              Every project starts with the same structure, so your team always
              knows where to look and what to trust.
            </p>
          </div>
          <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-10 text-zinc-900 sm:mt-20 sm:grid-cols-2 sm:gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-4 dark:text-white">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="flex flex-col gap-y-3 border-l border-zinc-900/15 pl-6 dark:border-white/10"
              >
                <dt className="text-sm/6">{stat.name}</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* CTA section */}
        <div className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8">
          <BackgroundGrid />
          <GradientBlob className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl" />

          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl dark:text-white">
              Give your next project a clear home
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg/8 text-pretty text-zinc-600 dark:text-zinc-300">
              Create your first project, invite your AI teammates, and see
              everything come together in one workspace.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:shadow-none dark:hover:bg-zinc-300 dark:focus-visible:outline-white"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="text-sm/6 font-semibold text-zinc-900 dark:text-white"
              >
                Sign in <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="border-t border-zinc-200 py-12 dark:border-white/10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm/6 font-semibold text-zinc-900 dark:text-white">
                Product
              </h3>
              <ul className="mt-4 space-y-3">
                {footerNavigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm/6 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm/6 font-semibold text-zinc-900 dark:text-white">
                Company
              </h3>
              <ul className="mt-4 space-y-3">
                {footerNavigation.company.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-sm/6 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm/6 font-semibold text-zinc-900 dark:text-white">
                Legal
              </h3>
              <ul className="mt-4 space-y-3">
                {footerNavigation.legal.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-sm/6 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-12 text-sm/6 text-zinc-600 dark:text-zinc-400">
            &copy; {new Date().getFullYear()} Project Manager. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
