"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/chats", label: "AI Chats", icon: ChatBubbleLeftRightIcon },
] as const;

export default function NavigationSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 py-5 dark:border-zinc-800">
        <p className="text-sm font-semibold tracking-tight">Project Manager</p>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              }`}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Button
          type="button"
          variant="secondary"
          className="flex w-full items-center justify-center gap-2"
          onClick={handleLogout}
        >
          <ArrowRightOnRectangleIcon className="size-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
