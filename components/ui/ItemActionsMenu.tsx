"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";

export type ItemAction = {
  key: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger";
  disabled?: boolean;
};

export function editItemAction(label: string, onClick: () => void): ItemAction {
  return {
    key: "edit",
    label,
    icon: <PencilIcon className="size-4" aria-hidden />,
    onClick,
  };
}

export function deleteItemAction(
  label: string,
  onClick: () => void,
  disabled = false,
): ItemAction {
  return {
    key: "delete",
    label,
    icon: <TrashIcon className="size-4 text-red-500" aria-hidden />,
    onClick,
    variant: "danger",
    disabled,
  };
}

export function shareItemAction(label: string, onClick: () => void): ItemAction {
  return {
    key: "share",
    label,
    icon: <ShareIcon className="size-4" aria-hidden />,
    onClick,
  };
}

export function expandItemAction(label: string, href: string): ItemAction {
  return {
    key: "expand",
    label,
    icon: <ArrowsPointingOutIcon className="size-4" aria-hidden />,
    href,
  };
}

export function regenerateItemAction(
  label: string,
  onClick: () => void,
  disabled = false,
): ItemAction {
  return {
    key: "regenerate",
    label,
    icon: <ArrowPathIcon className="size-4" aria-hidden />,
    onClick,
    disabled,
  };
}

type ItemActionsMenuProps = {
  actions: ItemAction[];
  menuLabel?: string;
};

const iconLinkClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100";

function DesktopActionIcon({ action }: { action: ItemAction }) {
  if (action.href) {
    return (
      <Link
        href={action.href}
        aria-label={action.label}
        className={iconLinkClassName}
      >
        {action.icon}
      </Link>
    );
  }

  return (
    <IconButton
      type="button"
      aria-label={action.label}
      variant={action.variant === "danger" ? "danger" : "ghost"}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.icon}
    </IconButton>
  );
}

function MobileMenuItem({
  action,
  onSelect,
}: {
  action: ItemAction;
  onSelect: () => void;
}) {
  const itemClassName = `flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
    action.variant === "danger"
      ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
      : "text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-900"
  }`;

  if (action.href) {
    return (
      <Link
        href={action.href}
        role="menuitem"
        aria-label={action.label}
        onClick={onSelect}
        className={itemClassName}
      >
        <span className="text-zinc-500 dark:text-zinc-400">{action.icon}</span>
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      aria-label={action.label}
      disabled={action.disabled}
      onClick={() => {
        action.onClick?.();
        onSelect();
      }}
      className={itemClassName}
    >
      <span className="text-zinc-500 dark:text-zinc-400">{action.icon}</span>
      {action.label}
    </button>
  );
}

export function ItemActionsMenu({
  actions,
  menuLabel = "More actions",
}: Readonly<ItemActionsMenuProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-start">
      <div className="hidden items-start gap-1 md:flex">
        {actions.map((action) => (
          <DesktopActionIcon key={action.key} action={action} />
        ))}
      </div>

      <div ref={containerRef} className="relative md:hidden">
        <IconButton
          type="button"
          aria-label={menuLabel}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          onClick={() => setIsOpen((open) => !open)}
        >
          <EllipsisVerticalIcon className="size-5" aria-hidden />
        </IconButton>

        {isOpen ? (
          <div
            id={menuId}
            role="menu"
            aria-label={menuLabel}
            className="absolute right-0 top-full z-10 mt-1 min-w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
          >
            {actions.map((action) => (
              <MobileMenuItem
                key={action.key}
                action={action}
                onSelect={() => setIsOpen(false)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
