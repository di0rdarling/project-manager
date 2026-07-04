import { parseResponse } from "@/lib/api/response";
import type { RichTextEnhanceAction } from "@/lib/prompts/rich-text-enhance-prompt";

export type EnhanceRichTextRequest = {
  html: string;
  action: RichTextEnhanceAction;
};

export type EnhanceRichTextResponse = {
  html: string;
};

export async function enhanceRichText(
  request: EnhanceRichTextRequest,
): Promise<EnhanceRichTextResponse> {
  const response = await fetch("/api/ai/enhance-text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  return parseResponse<EnhanceRichTextResponse>(response);
}
