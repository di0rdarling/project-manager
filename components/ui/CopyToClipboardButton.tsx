"use client";

import { useState } from "react";
import {
  CheckIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { IconButton } from "@/components/ui/IconButton";

type CopyToClipboardButtonProps = {
  text: string;
  ariaLabel?: string;
  className?: string;
  successMessage?: string;
};

export function CopyToClipboardButton({
  text,
  ariaLabel = "Copy to clipboard",
  className,
  successMessage = "Copied to clipboard",
}: Readonly<CopyToClipboardButtonProps>) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  return (
    <IconButton
      type="button"
      aria-label={copied ? "Copied" : ariaLabel}
      title={copied ? "Copied" : ariaLabel}
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <CheckIcon className="size-4" aria-hidden />
      ) : (
        <DocumentDuplicateIcon className="size-4" aria-hidden />
      )}
    </IconButton>
  );
}
