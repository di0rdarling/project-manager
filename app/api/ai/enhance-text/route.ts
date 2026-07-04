import { generateText } from "@/lib/gemini";
import {
  buildRichTextEnhancePrompt,
  parseRichTextEnhanceResponse,
  type RichTextEnhanceAction,
} from "@/lib/prompts/rich-text-enhance-prompt";
import { isRichTextEmpty } from "@/lib/rich-text";

const VALID_ACTIONS: RichTextEnhanceAction[] = ["shorten", "expand"];

type EnhanceTextRequest = {
  html?: string;
  action?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnhanceTextRequest;
    const html = typeof body.html === "string" ? body.html : "";
    const action = body.action;

    if (isRichTextEmpty(html)) {
      return Response.json(
        { error: "Text content is required" },
        { status: 400 },
      );
    }

    if (!action || !VALID_ACTIONS.includes(action as RichTextEnhanceAction)) {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const prompt = buildRichTextEnhancePrompt(
      html,
      action as RichTextEnhanceAction,
    );
    const response = await generateText(prompt);
    const enhancedHtml = parseRichTextEnhanceResponse(response);

    if (isRichTextEmpty(enhancedHtml)) {
      return Response.json(
        { error: "AI returned empty content" },
        { status: 500 },
      );
    }

    return Response.json({ html: enhancedHtml });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI text enhancement is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to enhance text" },
      { status: 500 },
    );
  }
}
