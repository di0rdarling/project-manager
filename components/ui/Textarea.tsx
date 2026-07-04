import type { TextareaHTMLAttributes } from "react";

const textareaClassName =
  "w-full resize-none rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400";

type TextareaProps = {
  label: string;
  id: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ label, id, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        className={
          className ? `${textareaClassName} ${className}` : textareaClassName
        }
        {...props}
      />
    </div>
  );
}
