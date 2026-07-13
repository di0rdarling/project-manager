import { Button } from "@/components/ui/Button";

export const documentDetailToolbarButtonClassName = "px-2.5 py-1 text-xs";

type DocumentDetailToolbarActionsProps = {
  onCancel: () => void;
  isSaving: boolean;
  cancelLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
};

export function DocumentDetailToolbarActions({
  onCancel,
  isSaving,
  cancelLabel = "Cancel",
  saveLabel = "Save changes",
  savingLabel = "Saving...",
}: Readonly<DocumentDetailToolbarActionsProps>) {
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className={documentDetailToolbarButtonClassName}
        onClick={onCancel}
        disabled={isSaving}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        className={documentDetailToolbarButtonClassName}
        disabled={isSaving}
      >
        {isSaving ? savingLabel : saveLabel}
      </Button>
    </>
  );
}
