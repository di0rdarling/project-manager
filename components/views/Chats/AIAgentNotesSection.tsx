"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useFetchAgentNotes } from "@/hooks/queries/useFetchAgentNotes";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import AgentSection from "./AgentSection";
import AIAgentNotesList from "./AIAgentNotesList";
import CreateAgentNoteModal from "./modals/agent-notes/CreateAgentNoteModal";
import DeleteAgentNoteModal from "./modals/agent-notes/DeleteAgentNoteModal";
import EditAgentNoteModal from "./modals/agent-notes/EditAgentNoteModal";
import ShareAgentNoteModal from "./modals/agent-notes/ShareAgentNoteModal";

type AIAgentNotesSectionProps = {
  teammateId: ChatTeammateId;
  agentName: string;
};

export default function AIAgentNotesSection({
  teammateId,
  agentName,
}: Readonly<AIAgentNotesSectionProps>) {
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);

  const {
    data: notes = [],
    isPending,
    isError,
    error,
  } = useFetchAgentNotes(teammateId);

  return (
    <>
      <AgentSection
        title="Notes"
        description={`Notes the user has left for ${agentName}, plus any notes the user has shared with ${agentName} from other teammates' profiles. They are included in every conversation you have with this teammate.`}
        addButtonLabel="Add Note"
        onAddClick={() => setIsCreateNoteModalOpen(true)}
        isPending={isPending}
        isError={isError}
        error={error}
        loadingMessage="Loading notes..."
        errorFallbackMessage="Failed to load notes"
        isEmpty={notes.length === 0}
        emptyMessage={`No notes for ${agentName} yet. Add context, preferences, or standing instructions you want this teammate to remember. You can also share notes with other teammates later.`}
      >
        <AIAgentNotesList
          teammateId={teammateId}
          notes={notes}
          onEditSuccess={() => toast.success("Note updated successfully.")}
          onDeleteSuccess={() => toast.success("Note deleted successfully.")}
          onShareSuccess={() => toast.success("Note sharing updated.")}
          renderEditModal={({ open, item, onClose, onSuccess }) => (
            <EditAgentNoteModal
              open={open}
              teammateId={teammateId}
              note={item}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}
          renderDeleteModal={({ open, item, onClose, onSuccess }) => (
            <DeleteAgentNoteModal
              open={open}
              teammateId={teammateId}
              note={item}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}
          renderShareModal={({ open, item, onClose, onSuccess }) => (
            <ShareAgentNoteModal
              open={open}
              teammateId={teammateId}
              note={item}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}
        />
      </AgentSection>

      <CreateAgentNoteModal
        open={isCreateNoteModalOpen}
        teammateId={teammateId}
        onClose={() => setIsCreateNoteModalOpen(false)}
        onSuccess={() => toast.success("Note added successfully.")}
      />
    </>
  );
}
