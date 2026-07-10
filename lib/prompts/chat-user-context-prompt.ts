export function buildChatUserContextPrompt(
  userName: string | null | undefined,
): string {
  const trimmed = userName?.trim();

  if (!trimmed) {
    return "The account holder you are helping has not set a display name. Address them naturally without assuming a name.";
  }

  return [
    `The account holder you are helping is ${trimmed}.`,
    `You may address them by name when it feels natural — use "${trimmed}" or their first name if that is clear from the name they provided.`,
    "Do not invent a different name for them.",
  ].join(" ");
}
