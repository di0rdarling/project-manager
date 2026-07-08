"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchNote } from "@/lib/api/notes";
import { noteKeys } from "@/lib/query-keys";
import type { NoteResponse } from "@/lib/types";

type UseFetchNoteOptions = Omit<
  UseQueryOptions<NoteResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchNote(
  projectId: string,
  noteId: string,
  options?: UseFetchNoteOptions,
) {
  return useQuery({
    queryKey: noteKeys.detail(projectId, noteId),
    queryFn: () => fetchNote({ projectId, noteId }),
    ...options,
  });
}
