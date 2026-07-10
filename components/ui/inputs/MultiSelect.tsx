"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export type MultiSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type MultiSelectProps = {
  id: string;
  label: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
};

function formatSelectedLabels(
  selectedOptions: MultiSelectOption[],
  placeholder: string,
): string {
  if (selectedOptions.length === 0) {
    return placeholder;
  }

  if (selectedOptions.length === 1) {
    return selectedOptions[0].label;
  }

  if (selectedOptions.length === 2) {
    return `${selectedOptions[0].label}, ${selectedOptions[1].label}`;
  }

  return `${selectedOptions[0].label}, ${selectedOptions[1].label} +${selectedOptions.length - 2} more`;
}

export function MultiSelect({
  id,
  label,
  options,
  values,
  onChange,
  placeholder = "Select options",
  emptyMessage = "No options available.",
  disabled = false,
}: Readonly<MultiSelectProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOptions = options.filter((option) =>
    values.includes(option.value),
  );
  const triggerLabel = formatSelectedLabels(selectedOptions, placeholder);

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

  function toggleOption(optionValue: string) {
    if (values.includes(optionValue)) {
      onChange(values.filter((value) => value !== optionValue));
      return;
    }

    onChange([...values, optionValue]);
  }

  if (options.length === 0) {
    return (
      <div className="space-y-2">
        <p className="block text-sm font-medium">{label}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
      </div>
    );
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
          <span
            className={`min-w-0 flex-1 truncate text-sm ${
              selectedOptions.length > 0
                ? "font-medium text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {triggerLabel}
          </span>
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
            aria-multiselectable="true"
            className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
          >
            {options.map((option) => {
              const isSelected = values.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => toggleOption(option.value)}
                  className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-900 ${
                    isSelected ? "bg-zinc-50 dark:bg-zinc-900" : ""
                  }`}
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-300 dark:border-zinc-600"
                    }`}
                    aria-hidden
                  >
                    {isSelected ? <CheckIcon className="size-3" /> : null}
                  </span>
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
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
