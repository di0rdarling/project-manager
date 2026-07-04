"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import {
  enhanceRichText,
  type EnhanceRichTextRequest,
  type EnhanceRichTextResponse,
} from "@/lib/api/enhance-text";

type UseEnhanceRichTextOptions = Omit<
  UseMutationOptions<EnhanceRichTextResponse, Error, EnhanceRichTextRequest>,
  "mutationFn"
>;

export function useEnhanceRichText(options?: UseEnhanceRichTextOptions) {
  return useMutation({
    mutationFn: enhanceRichText,
    ...options,
  });
}
