"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error(`${component} must be used within Tabs`);
  }

  return context;
}

type TabsProps = {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
};

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const baseId = useId();
  const activeValue = value ?? internalValue;

  function setValue(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  return (
    <TabsContext.Provider value={{ value: activeValue, setValue, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

type TabsListProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function TabsList({
  children,
  className,
  "aria-label": ariaLabel,
}: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={
        className ??
        "flex gap-1 border-b border-zinc-200 dark:border-zinc-800"
      }
    >
      {children}
    </div>
  );
}

type TabsTriggerProps = {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

const tabsTriggerBaseClassName =
  "-mb-px cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

const tabsTriggerActiveClassName =
  "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100";

const tabsTriggerInactiveClassName =
  "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200";

const tabsTriggerDisabledClassName =
  "disabled:hover:border-transparent disabled:hover:text-zinc-400 dark:disabled:hover:text-zinc-500";

export function TabsTrigger({
  value,
  children,
  disabled = false,
  className,
}: TabsTriggerProps) {
  const { value: activeValue, setValue, baseId } = useTabsContext("TabsTrigger");
  const isSelected = activeValue === value;
  const triggerClassName = `${tabsTriggerBaseClassName} ${tabsTriggerDisabledClassName} ${
    isSelected ? tabsTriggerActiveClassName : tabsTriggerInactiveClassName
  }`;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isSelected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={className ? `${triggerClassName} ${className}` : triggerClassName}
    >
      {children}
    </button>
  );
}

type TabsPanelProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export function TabsPanel({ value, children, className }: TabsPanelProps) {
  const { value: activeValue, baseId } = useTabsContext("TabsPanel");
  const isSelected = activeValue === value;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={!isSelected}
      className={isSelected ? className : "hidden"}
    >
      {children}
    </div>
  );
}
