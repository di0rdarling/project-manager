"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchNoteFolders } from "@/lib/api/note-folders";
import { noteFolderKeys } from "@/lib/query-keys";
import type { NoteFolderResponse } from "@/lib/types";

type UseFetchNoteFoldersOptions = Omit<
  UseQueryOptions<NoteFolderResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchNoteFolders(
  projectId: string,
  options?: UseFetchNoteFoldersOptions,
) {
  return useQuery({
    queryKey: noteFolderKeys.list(projectId),
    queryFn: () => fetchNoteFolders(projectId),
    ...options,
  });
}
