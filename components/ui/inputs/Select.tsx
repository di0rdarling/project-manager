import type { SelectHTMLAttributes } from "react";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectOptionGroup = {
  label: string;
  options: SelectOption[];
};

type SelectProps = {
  label?: string;
  id: string;
  options?: SelectOption[];
  groups?: SelectOptionGroup[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "children">;

export function Select({
  label,
  id,
  options = [],
  groups,
  className,
  ...props
}: SelectProps) {
  const optionElements = groups?.length
    ? groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </optgroup>
      ))
    : options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ));

  return (
    <div className={label ? "space-y-2" : undefined}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={
          className ? `${selectClassName} ${className}` : selectClassName
        }
        {...props}
      >
        {optionElements}
      </select>
    </div>
  );
}
