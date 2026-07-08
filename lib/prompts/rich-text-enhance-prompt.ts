import { stripRichText } from "@/lib/rich-text";
import { PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";

export type RichTextEnhanceAction = "shorten" | "polish" | "expand";

const ACTION_INSTRUCTIONS: Record<RichTextEnhanceAction, string> = {
  shorten:
    "Make the text shorter and more concise while preserving its meaning.",
  polish:
    "Polish the text to improve clarity and readability. Fix grammar and spelling errors. Keep roughly the same length — do not shorten or expand the content.",
  expand:
    "Expand the text to be more detailed and comprehensive while preserving its core meaning. Fix any grammar and spelling errors.",
};

const HTML_FORMAT_INSTRUCTIONS = [
  "Return only valid HTML using the same formatting tags as the input where appropriate.",
  "Supported tags: p, ul, ol, li, h1, h2, h3, blockquote, strong, em, u, s, mark, br.",
  "Do not wrap the response in markdown, code fences, or any explanation.",
];

export function buildRichTextEnhancePrompt(
  html: string,
  action: RichTextEnhanceAction,
): string {
  const plainText = stripRichText(html);

  const sections = [
    "You are a writing assistant that edits rich text content.",
    ACTION_INSTRUCTIONS[action],
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    ...HTML_FORMAT_INSTRUCTIONS,
    "",
    `Input HTML:\n${html.trim() || `<p>${plainText}</p>`}`,
  ];

  return sections.join("\n");
}

export function parseRichTextEnhanceResponse(text: string): string {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/^```(?:html)?\s*([\s\S]*?)```$/);

  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  return cleaned;
}
