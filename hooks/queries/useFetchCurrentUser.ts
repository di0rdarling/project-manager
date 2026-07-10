"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/lib/api/auth";
import { currentUserKeys } from "@/lib/query-keys";

export function useFetchCurrentUser() {
  return useQuery({
    queryKey: currentUserKeys.detail,
    queryFn: fetchCurrentUser,
    staleTime: 0,
    retry: false,
  });
}
