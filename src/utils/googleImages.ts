/**
 * Build a Google Images search URL for a card — the "find a real photo" path
 * that pairs with drag-and-drop in the LLM Studio ImagesStep.
 *
 * Uses the card's answer, appending its `imageKeywords` when present so the
 * search targets the same subject the image prompt describes. The query is
 * URL-encoded; `tbm=isch` selects the Images tab. Returns `null` when the answer
 * is blank — there's nothing to search for, and the caller disables the button.
 */
export function buildGoogleImagesUrl(answer: string, imageKeywords: string): string | null {
  const trimmedAnswer = answer.trim();
  if (trimmedAnswer.length === 0) return null;
  const keywords = imageKeywords.trim();
  const query = keywords.length > 0 ? `${trimmedAnswer} ${keywords}` : trimmedAnswer;
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
}
