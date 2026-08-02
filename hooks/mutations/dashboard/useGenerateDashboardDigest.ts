"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateDashboardDigest } from "@/lib/api/dashboard";
import { dashboardKeys } from "@/lib/query-keys";
import type { DashboardDigestResponse } from "@/lib/types";

type UseGenerateDashboardDigestOptions = {
  onSuccess?: (data: DashboardDigestResponse) => void;
  onError?: (error: Error) => void;
};

export function useGenerateDashboardDigest(
  options: UseGenerateDashboardDigestOptions = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateDashboardDigest,
    onSuccess: (data) => {
      queryClient.setQueryData(dashboardKeys.digest, data);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      options.onError?.(error);
    },
  });
}
