"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { saveAgentDocumentAsProjectNote } from "@/lib/api/agent-documents";
import { agentDocumentKeys, noteKeys } from "@/lib/query-keys";
import type {
  NoteResponse,
  SaveAgentDocumentAsProjectNoteResponse,
} from "@/lib/types";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

type SaveAgentDocumentAsProjectNoteInput = {
  teammateId: ChatTeammateId;
  documentId: string;
};

type UseSaveAgentDocumentAsProjectNoteOptions = Omit<
  UseMutationOptions<
    SaveAgentDocumentAsProjectNoteResponse,
    Error,
    SaveAgentDocumentAsProjectNoteInput
  >,
  "mutationFn"
>;

export function useSaveAgentDocumentAsProjectNote(
  options?: UseSaveAgentDocumentAsProjectNoteOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: saveAgentDocumentAsProjectNote,
    ...restOptions,
    onSuccess: (response, input, onMutateResult, context) => {
      queryClient.setQueryData(
        agentDocumentKeys.detail(input.teammateId, input.documentId),
        response.document,
      );

      queryClient.setQueryData<NoteResponse[]>(
        noteKeys.list(response.document.projectId, response.note.featureId),
        (current) => (current ? [response.note, ...current] : [response.note]),
      );

      queryClient.setQueryData(
        agentDocumentKeys.list(input.teammateId),
        (current) =>
          Array.isArray(current)
            ? current.map((entry) =>
                entry._id === response.document._id ? response.document : entry,
              )
            : current,
      );

      onSuccess?.(response, input, onMutateResult, context);
    },
  });
}
