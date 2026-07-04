"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchNotes } from "@/lib/api/notes";
import { noteKeys } from "@/lib/query-keys";
import type { NoteResponse } from "@/lib/types";

type UseFetchNotesOptions = Omit<
  UseQueryOptions<NoteResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchNotes(
  projectId: string,
  options?: UseFetchNotesOptions,
) {
  return useQuery({
    queryKey: noteKeys.all(projectId),
    queryFn: () => fetchNotes(projectId),
    ...options,
  });
}
