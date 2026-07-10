"use client";

import { useEffect, useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useUpdateCurrentUser } from "@/hooks/mutations/auth/useUpdateCurrentUser";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400";

type EditableNameRowProps = {
  name: string | null;
};

export default function EditableNameRow({ name }: EditableNameRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftName(name ?? "");
      setError(null);
    }
  }, [isEditing, name]);

  const updateCurrentUserMutation = useUpdateCurrentUser({
    onSuccess: () => {
      setIsEditing(false);
      setError(null);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to update name",
      );
    },
  });

  function handleCancel() {
    if (updateCurrentUserMutation.isPending) {
      return;
    }

    setDraftName(name ?? "");
    setError(null);
    setIsEditing(false);
  }

  function handleSave() {
    setError(null);
    updateCurrentUserMutation.mutate({ name: draftName });
  }

  return (
    <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Name
        </dt>

        {isEditing ? (
          <div className="w-full space-y-3 sm:max-w-md">
            <input
              id="account-name"
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Your name"
              maxLength={100}
              autoFocus
              className={inputClassName}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateCurrentUserMutation.isPending}
              >
                {updateCurrentUserMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={updateCurrentUserMutation.isPending}
              >
                Cancel
              </Button>
            </div>
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <dd className="flex w-full items-center justify-between gap-3 sm:max-w-md sm:justify-end">
            <span className="text-sm text-zinc-900 dark:text-zinc-100">
              {name?.trim() || "Not set"}
            </span>
            <IconButton
              type="button"
              aria-label="Edit name"
              className="shrink-0"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon className="size-4" />
            </IconButton>
          </dd>
        )}
      </div>
    </div>
  );
}
