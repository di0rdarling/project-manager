import type { InputHTMLAttributes } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400";

type InputProps = {
  label: string;
  id: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, id, className, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className={className ? `${inputClassName} ${className}` : inputClassName}
        {...props}
      />
    </div>
  );
}
