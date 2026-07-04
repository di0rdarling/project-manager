import type { SelectHTMLAttributes } from "react";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  label: string;
  id: string;
  options: SelectOption[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "children">;

export function Select({
  label,
  id,
  options,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className={
          className ? `${selectClassName} ${className}` : selectClassName
        }
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
