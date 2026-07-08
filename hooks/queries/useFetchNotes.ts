"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchNotes } from "@/lib/api/notes";
import { noteKeys } from "@/lib/query-keys";
import type { NoteResponse } from "@/lib/types";

type UseFetchNotesOptions = Omit<
  UseQueryOptions<NoteResponse[], Error>,
  "queryKey" | "queryFn"
> & {
  featureId?: string | null;
};

export function useFetchNotes(
  projectId: string,
  options?: UseFetchNotesOptions,
) {
  const { featureId, ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: noteKeys.list(projectId, featureId),
    queryFn: () => fetchNotes(projectId, featureId),
    ...queryOptions,
  });
}
