"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export type AvatarSelectOption = {
  value: string;
  label: string;
  description?: string;
  avatar: React.ReactNode;
};

type AvatarSelectProps = {
  id: string;
  label: string;
  options: AvatarSelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function AvatarSelect({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
}: AvatarSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((option) => option.value === value);

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

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((open) => !open)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-left outline-none transition focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:focus:border-zinc-400"
        >
          {selectedOption ? (
            <>
              {selectedOption.avatar}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedOption.label}
                </span>
                {selectedOption.description ? (
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedOption.description}
                  </span>
                ) : null}
              </span>
            </>
          ) : (
            <span className="flex-1 text-sm text-zinc-500 dark:text-zinc-400">
              Select an option
            </span>
          )}
          <ChevronDownIcon
            className={`size-4 shrink-0 text-zinc-500 transition dark:text-zinc-400 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {isOpen ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option.value)}
                className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                  option.value === value ? "bg-zinc-50 dark:bg-zinc-900" : ""
                }`}
              >
                {option.avatar}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {option.label}
                  </span>
                  {option.description ? (
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
